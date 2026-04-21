import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { openaiApiKey, openaiModel, LLM_PROMPT_MAX_CHARS } from "../config.js";
import { getEventsByAuthor } from "../db/repositories/events.repo.js";
import { upsertMentorStyle, getMentorStyle } from "../db/repositories/mentorStyles.repo.js";

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!openaiApiKey) return null;
  if (!client) client = new OpenAI({ apiKey: openaiApiKey });
  return client;
}

/**
 * Analisa o estilo de escrita de um mentor e salva no Supabase.
 * Roda automaticamente quando novos tweets são coletados de um perfil.
 */
export async function learnMentorStyle(handle: string): Promise<void> {
  // Verifica se já analisou recentemente (últimas 24h)
  const existing = await getMentorStyle(handle);
  if (existing) {
    const hoursSince = (Date.now() - new Date(existing.analyzed_at).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) return; // Skip — analisado recentemente
  }

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 dias
  const tweets = await getEventsByAuthor(handle, since, 50);
  if (tweets.length < 5) return; // Precisa de pelo menos 5 tweets

  const c = getClient();
  if (!c) return;

  const sample = tweets.map(t => t.text_content).join("\n---\n").slice(0, LLM_PROMPT_MAX_CHARS);

  // Análise heurística (sem LLM)
  const texts = tweets.map(t => t.text_content);
  const avgLength = Math.round(texts.reduce((a, t) => a + t.length, 0) / texts.length);
  const usesEmojis = texts.some(t => /[\u{1F300}-\u{1FAFF}]/u.test(t));
  const usesHashtags = texts.some(t => /#\w+/.test(t));
  const usesThreads = texts.some(t => t.includes("🧵") || /\d\/\d/.test(t));

  // Análise com LLM
  try {
    const res = await c.chat.completions.create({
      model: openaiModel,
      messages: [{
        role: "user",
        content: `Analise o ESTILO DE ESCRITA destes ${tweets.length} tweets de @${handle}. NÃO analise o conteúdo — foque em COMO ele escreve.

Responda JSON:
{
  "toneDescription": "Como é o tom: direto? irônico? técnico? casual? sério?",
  "writingPatterns": "Padrões: frases curtas? longas? usa perguntas? usa listas? começa como? termina como? usa analogias?",
  "commonTopics": "3-5 temas recorrentes",
  "samplePhrases": "3-5 frases CURTAS que exemplificam o estilo (não copiar tweets inteiros, só patterns)"
}

Tweets:
${sample}`,
      }],
      temperature: 0.3,
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const data = JSON.parse(jsonMatch[0]) as {
      toneDescription?: string;
      writingPatterns?: string;
      commonTopics?: string;
      samplePhrases?: string;
    };

    await upsertMentorStyle({
      id: existing?.id ?? randomUUID(),
      handle,
      tweetCount: tweets.length,
      avgLength,
      usesEmojis,
      usesHashtags,
      usesThreads,
      toneDescription: data.toneDescription ?? null,
      commonTopics: data.commonTopics ?? null,
      writingPatterns: data.writingPatterns ?? null,
      samplePhrases: data.samplePhrases ?? null,
    });

    console.log(`[learnStyle] Estilo de @${handle} aprendido (${tweets.length} tweets).`);
  } catch (err) {
    console.error(`[learnStyle] Erro ao analisar @${handle}:`, err instanceof Error ? err.message : err);
  }
}
