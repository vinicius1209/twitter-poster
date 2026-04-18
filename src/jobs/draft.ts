import { randomUUID } from "node:crypto";
import {
  embedTexts,
  generateDraftsWithLlm,
  maxCosineSimilarity,
  type PostFormat,
} from "../ai/llm.js";
import { openaiApiKey, SIMILARITY_THRESHOLD, POST_LIMITS } from "../config.js";
import {
  getRandomEventsSince,
  getTopAuthors,
  getEventsByAuthor,
} from "../db/repositories/events.repo.js";
import { insertDraft, getRecentDraftBodies } from "../db/repositories/drafts.repo.js";
import { getPersona } from "../db/repositories/personas.repo.js";
import { getLatestTopicRun } from "../db/repositories/topics.repo.js";
import { runTopicAnalysis } from "./analyze.js";

export type GeneratedDraft = {
  draftId: string;
  body: string;
  similarityNote: string | null;
};

export async function generateDraftJob(params: {
  windowHours: number;
  tone: string;
  count?: number;
  personaId?: string;
  format?: PostFormat;
}): Promise<{
  drafts: GeneratedDraft[];
  inspiredBy: string[];
  mentorsUsed: string[];
}> {
  const count = Math.min(Math.max(1, params.count ?? 3), 10);

  // Reutiliza a análise mais recente se existir e for das últimas 2h
  // Senão roda uma nova
  let summary: string;
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const latest = getLatestTopicRun();

  if (latest && latest.created_at > twoHoursAgo) {
    console.log("[draft] reutilizando análise existente de", latest.created_at);
    summary = latest.summary;
  } else {
    console.log("[draft] rodando nova análise...");
    const analysis = await runTopicAnalysis(params.windowHours);
    summary = analysis.summary;
  }

  const since = new Date(
    Date.now() - params.windowHours * 60 * 60 * 1000,
  ).toISOString();

  const events = getRandomEventsSince(since, 20);
  const inspiredIds = events.map((e) => e.id);
  const exampleSnippets = events.map((e) => e.text_content);

  // Detectar mentores
  const topAuthors = getTopAuthors(since, 5);
  const mentors = topAuthors.map(a => ({
    handle: a.author_handle,
    score: a.score,
    sampleTweets: getEventsByAuthor(a.author_handle, since, 3).map(e => e.text_content),
  }));

  const existingDrafts = getRecentDraftBodies(10);

  // Persona
  const persona = params.personaId ? getPersona(params.personaId) : undefined;
  const effectiveTone = persona?.tone || params.tone;
  const systemPrompt = persona?.system_prompt;
  const format = params.format ?? "short";
  const maxChars = POST_LIMITS[format];

  const bodies = await generateDraftsWithLlm({
    topicsSummary: summary,
    exampleSnippets,
    tone: effectiveTone,
    count,
    format,
    maxChars,
    mentors,
    existingDrafts,
    systemPrompt,
  });

  // Verificar similaridade
  const drafts: GeneratedDraft[] = [];
  for (const body of bodies) {
    let similarityNote: string | null = null;

    if (openaiApiKey && exampleSnippets.length > 0) {
      try {
        const [draftEmb, ...srcEmb] = await embedTexts([
          body,
          ...exampleSnippets.slice(0, 8),
        ]);
        if (draftEmb && srcEmb.length) {
          const sim = maxCosineSimilarity(draftEmb, srcEmb);
          if (sim > SIMILARITY_THRESHOLD) {
            similarityNote = `Similaridade alta (${sim.toFixed(3)} > ${SIMILARITY_THRESHOLD}); revise ou regenere.`;
          }
        }
      } catch {
        // Embedding falhou
      }
    }

    const draftId = randomUUID();
    insertDraft({
      id: draftId,
      body,
      status: "pending_approval",
      inspiredByEventIds: JSON.stringify(inspiredIds),
      similarityNote,
      personaId: persona?.id ?? null,
      now: new Date().toISOString(),
    });

    drafts.push({ draftId, body, similarityNote });
  }

  return {
    drafts,
    inspiredBy: inspiredIds,
    mentorsUsed: mentors.map(m => m.handle),
  };
}
