import { getEventsByAuthor } from "../db/repositories/events.repo.js";
import { openaiApiKey, openaiModel, LLM_PROMPT_MAX_CHARS } from "../config.js";
import OpenAI from "openai";

export type ProfileStudy = {
  handle: string; tweetCount: number; themes: string[];
  writingStyle: string; typicalFormat: string;
  engagementTips: string; summary: string;
};

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!openaiApiKey) return null;
  if (!client) client = new OpenAI({ apiKey: openaiApiKey });
  return client;
}

export async function analyzeProfile(handle: string): Promise<ProfileStudy> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const tweets = await getEventsByAuthor(handle, since, 100);

  if (tweets.length === 0) {
    return { handle, tweetCount: 0, themes: [], writingStyle: "Sem dados.", typicalFormat: "Colete tweets primeiro.", engagementTips: "", summary: `Nenhum tweet de @${handle} encontrado.` };
  }

  const c = getClient();
  if (!c) {
    return { handle, tweetCount: tweets.length, themes: [], writingStyle: "Requer OPENAI_API_KEY.", typicalFormat: "", engagementTips: "", summary: `${tweets.length} tweets, mas análise requer OPENAI_API_KEY.` };
  }

  const sample = tweets.map(t => t.text_content).join("\n---\n").slice(0, LLM_PROMPT_MAX_CHARS);

  try {
    const res = await c.chat.completions.create({
      model: openaiModel,
      messages: [{ role: "user", content: `Analise estes ${tweets.length} tweets do @${handle}. Responda JSON: {"themes":[],"writingStyle":"","typicalFormat":"","engagementTips":"","summary":""}\n\n${sample}` }],
      temperature: 0.3,
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado");
    const data = JSON.parse(jsonMatch[0]) as Partial<ProfileStudy>;
    return { handle, tweetCount: tweets.length, themes: data.themes ?? [], writingStyle: data.writingStyle ?? "", typicalFormat: data.typicalFormat ?? "", engagementTips: data.engagementTips ?? "", summary: data.summary ?? "" };
  } catch {
    return { handle, tweetCount: tweets.length, themes: [], writingStyle: "Erro.", typicalFormat: "", engagementTips: "", summary: `Erro ao analisar @${handle}.` };
  }
}
