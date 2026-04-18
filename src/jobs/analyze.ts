import { randomUUID } from "node:crypto";
import { analyzeTopicsWithLlm } from "../ai/llm.js";
import { getEventTextsSince } from "../db/repositories/events.repo.js";
import {
  insertTopicRun,
  listTopicRuns as listTopicRunsRepo,
} from "../db/repositories/topics.repo.js";

export async function runTopicAnalysis(windowHours: number): Promise<{
  id: string;
  summary: string;
  topics: string[];
  sampleSize: number;
  analysisSource: "llm" | "heuristic";
}> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const rows = await getEventTextsSince(since);
  const texts = rows.map((r) => r.text_content);
  const { summary, topics, source } = await analyzeTopicsWithLlm(texts, windowHours);
  const id = randomUUID();

  await insertTopicRun({
    id, windowHours, summary,
    topicsJson: JSON.stringify(topics),
    now: new Date().toISOString(),
  });

  return { id, summary, topics, sampleSize: texts.length, analysisSource: source };
}

export async function listTopicRuns(limit = 20) {
  return listTopicRunsRepo(limit);
}
