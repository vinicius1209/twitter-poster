import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { openaiApiKey, openaiModel, POST_LIMITS } from "../config.js";
import { insertDraft } from "../db/repositories/drafts.repo.js";
import type { PostFormat } from "../ai/llm.js";

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!openaiApiKey) return null;
  if (!client) client = new OpenAI({ apiKey: openaiApiKey });
  return client;
}

function smartTruncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const chunk = text.slice(0, maxLen);
  const lastEnd = Math.max(chunk.lastIndexOf(". "), chunk.lastIndexOf(".\n"), chunk.lastIndexOf("."), chunk.lastIndexOf("!"), chunk.lastIndexOf("?"));
  if (lastEnd > maxLen * 0.5) return chunk.slice(0, lastEnd + 1).trim();
  const lastSpace = chunk.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.5) return chunk.slice(0, lastSpace).trim() + "…";
  return chunk.trim();
}

export async function ghostwrite(params: {
  text: string;
  format?: PostFormat;
  count?: number;
  personaId?: string;
}): Promise<{
  drafts: { draftId: string; body: string }[];
}> {
  const { text, format = "short", count = 3 } = params;
  const maxChars = POST_LIMITS[format];
  const c = getClient();

  if (!c) {
    const body = smartTruncate(`Baseado em: ${text.slice(0, 200)}...`, maxChars);
    const draftId = randomUUID();
    insertDraft({ id: draftId, body, status: "pending_approval", inspiredByEventIds: "[]", similarityNote: null, now: new Date().toISOString() });
    return { drafts: [{ draftId, body }] };
  }

  const formatInst = format === "short"
    ? `Cada post deve ter no máximo ${maxChars} caracteres. 2-4 frases naturais.`
    : format === "long"
    ? `Cada post pode ter até ${maxChars} caracteres. Use quebras de linha, frases curtas, estrutura clara.`
    : `Cada variação é uma thread de 3-5 posts separados por ---. Total max ${maxChars} chars.`;

  const prompt = `Você é um ghostwriter especialista em X/Twitter. Transforme o conteúdo abaixo em ${count} posts DISTINTOS para o X, em português brasileiro.

Formato: ${formatInst}

Regras:
- Cada post deve ter ângulo e abordagem DIFERENTES
- NÃO copie o texto original — reescreva com sua própria voz
- NÃO termine com call to action genérica
- Formatos para variar: insight direto, lista de 3 pontos, provocação, dado + opinião, mini-história
- Cada post deve ser COMPLETO, nunca cortado

Conteúdo original:
${text.slice(0, 8000)}

Responda APENAS JSON array com ${count} strings:
["post 1", "post 2", ...]`;

  try {
    const res = await c.chat.completions.create({
      model: openaiModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: count * (format === "thread" ? 2000 : format === "long" ? 1200 : 350) + 100,
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let posts: string[] = [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) posts = parsed.map(String);
    } catch {
      const match = jsonStr.match(/\[[\s\S]*\]/);
      if (match) {
        try { posts = JSON.parse(match[0]).map(String); } catch {}
      }
    }

    if (posts.length === 0) {
      posts = [smartTruncate(jsonStr.replace(/^\[?\s*"?|"?\s*\]?$/g, "").replace(/\\n/g, "\n").trim(), maxChars)];
    }

    const drafts = posts.slice(0, count).map((body) => {
      const trimmed = format === "short" ? smartTruncate(body, maxChars) : body.slice(0, maxChars);
      const draftId = randomUUID();
      insertDraft({ id: draftId, body: trimmed, status: "pending_approval", inspiredByEventIds: "[]", similarityNote: null, now: new Date().toISOString() });
      return { draftId, body: trimmed };
    });

    return { drafts };
  } catch (err) {
    console.error("[ghostwriter] erro:", err instanceof Error ? err.message : err);
    return { drafts: [] };
  }
}
