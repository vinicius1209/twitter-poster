import { getEventsByAuthor, getTopAuthors } from "../db/repositories/events.repo.js";
import { openaiApiKey, openaiModel, LLM_PROMPT_MAX_CHARS } from "../config.js";
import OpenAI from "openai";

export type ProfileStudy = {
  handle: string;
  tweetCount: number;
  themes: string[];
  writingStyle: string;
  typicalFormat: string;
  engagementTips: string;
  summary: string;
};

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!openaiApiKey) return null;
  if (!client) client = new OpenAI({ apiKey: openaiApiKey });
  return client;
}

export async function analyzeProfile(handle: string): Promise<ProfileStudy> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias
  const tweets = getEventsByAuthor(handle, since, 100);

  if (tweets.length === 0) {
    return {
      handle,
      tweetCount: 0,
      themes: [],
      writingStyle: "Sem dados suficientes.",
      typicalFormat: "Colete tweets deste perfil primeiro.",
      engagementTips: "",
      summary: `Nenhum tweet de @${handle} encontrado na base. Colete tweets deste perfil primeiro.`,
    };
  }

  const c = getClient();
  if (!c) {
    return {
      handle,
      tweetCount: tweets.length,
      themes: [],
      writingStyle: "Análise requer OPENAI_API_KEY.",
      typicalFormat: "",
      engagementTips: "",
      summary: `${tweets.length} tweets coletados de @${handle}, mas análise profunda requer OPENAI_API_KEY.`,
    };
  }

  const sample = tweets.map(t => t.text_content).join("\n---\n").slice(0, LLM_PROMPT_MAX_CHARS);

  const prompt = `Analise estes ${tweets.length} tweets do perfil @${handle} e produza um estudo completo.

Responda APENAS JSON válido no formato:
{
  "themes": ["tema 1", "tema 2", ...],
  "writingStyle": "Descrição do estilo de escrita: tom, vocabulário, nível de formalidade, uso de emojis, etc.",
  "typicalFormat": "Formato mais comum: tweets curtos, longos, threads, listas, perguntas, etc.",
  "engagementTips": "Dicas específicas para criar conteúdo inspirado neste perfil sem copiar.",
  "summary": "Parágrafo resumindo o perfil: quem é, sobre o que escreve, como escreve, o que funciona."
}

Tweets de @${handle}:
${sample}`;

  try {
    const res = await c.chat.completions.create({
      model: openaiModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado");

    const data = JSON.parse(jsonMatch[0]) as Partial<ProfileStudy>;
    return {
      handle,
      tweetCount: tweets.length,
      themes: data.themes ?? [],
      writingStyle: data.writingStyle ?? "",
      typicalFormat: data.typicalFormat ?? "",
      engagementTips: data.engagementTips ?? "",
      summary: data.summary ?? "",
    };
  } catch (err) {
    console.error("[profileStudy] erro:", err instanceof Error ? err.message : err);
    return {
      handle,
      tweetCount: tweets.length,
      themes: [],
      writingStyle: "Erro na análise.",
      typicalFormat: "",
      engagementTips: "",
      summary: `Erro ao analisar @${handle}.`,
    };
  }
}
