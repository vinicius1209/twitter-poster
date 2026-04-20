import type {
  RawEvent,
  Draft,
  ScheduledPost,
  TopicRun,
  Author,
  Persona,
  MetricsSummary,
  SessionHealth,
} from "@shared/types.js";

export type Paginated<T> = { data: T[]; total: number; page: number; limit: number };

function getToken(): string {
  return localStorage.getItem("api_token") ?? "";
}

export function setToken(token: string): void {
  localStorage.setItem("api_token", token);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type QuickSessionStatus = {
  ok: boolean;
  profileExists: boolean;
  hint: string;
};

/** Faz polling de uma task até completar ou falhar */
async function pollTask<T>(taskId: string, maxWaitMs = 60_000, intervalMs = 2000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const task = await request<{ status: string; result: T | null; error: string | null }>(`/api/agent/tasks/${taskId}`);
    if (task.status === "completed" && task.result) return task.result;
    if (task.status === "failed") throw new Error(task.error ?? "Task falhou");
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error("Timeout — agent não respondeu. Verifique se o agent está rodando.");
}

export const api = {
  getSessionQuick: () => request<QuickSessionStatus>("/api/session/quick"),

  /** Cria task de verificação e faz polling até o agent responder */
  getSession: async (): Promise<SessionHealth> => {
    const { taskId } = await request<{ taskId: string }>("/api/session");
    const result = await pollTask<SessionHealth>(taskId, 30_000);
    return result;
  },

  syncLikes: async (maxScrolls = 8, maxTweets = 80) => {
    const { taskId } = await request<{ taskId: string }>("/api/sync/likes", {
      method: "POST",
      body: JSON.stringify({ maxScrolls, maxTweets }),
    });
    await pollTask(taskId, 120_000, 3000); // coleta pode demorar até 2min
    return { ok: true, message: "Coleta concluída pelo agent.", inserted: 0 };
  },

  syncProfile: async (handle: string, maxScrolls = 8, maxTweets = 80) => {
    const { taskId } = await request<{ taskId: string }>(
      `/api/sync/profile/${encodeURIComponent(handle)}`,
      { method: "POST", body: JSON.stringify({ maxScrolls, maxTweets }) },
    );
    await pollTask(taskId, 120_000, 3000);
    return { ok: true, message: `Perfil @${handle} coletado pelo agent.`, inserted: 0 };
  },

  syncWatchlist: () =>
    request<{ results: { handle: string; inserted: number; message: string }[] }>(
      "/api/sync/watchlist",
      { method: "POST" },
    ),

  listEvents: (limit = 80, page = 1, source?: string) =>
    request<Paginated<RawEvent>>(`/api/events?limit=${limit}&page=${page}${source ? `&source=${encodeURIComponent(source)}` : ""}`),

  getCollectionStats: () =>
    request<{ source: string; count: number; latest: string; hasMedia: number }[]>("/api/events/stats"),

  analyze: (windowHours: number) =>
    request<{ id: string; summary: string; topics: string[]; sampleSize: number; analysisSource: "llm" | "heuristic" }>(
      "/api/analyze",
      { method: "POST", body: JSON.stringify({ windowHours }) },
    ),

  listTopics: () => request<TopicRun[]>("/api/topics"),

  generateDrafts: (params: {
    windowHours: number; tone: string; count?: number;
    personaId?: string; format?: "short" | "long" | "thread";
  }) =>
    request<{
      drafts: { draftId: string; body: string; similarityNote: string | null }[];
      inspiredBy: string[];
      mentorsUsed: string[];
    }>("/api/drafts/generate", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  listDrafts: (limit = 100, page = 1) =>
    request<Paginated<Draft>>(`/api/drafts?limit=${limit}&page=${page}`),

  patchDraft: (id: string, patch: { status?: string; body?: string }) =>
    request<Draft>(`/api/drafts/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  discardDraft: (id: string) =>
    request<{ discarded: boolean }>(`/api/drafts/${id}`, { method: "DELETE" }),

  schedule: (body: string, runAt: string, draftId?: string) =>
    request<ScheduledPost>("/api/schedule", {
      method: "POST",
      body: JSON.stringify({ body, runAt, ...(draftId ? { draftId } : {}) }),
    }),

  listScheduled: (limit = 100, page = 1) =>
    request<Paginated<ScheduledPost>>(`/api/scheduled?limit=${limit}&page=${page}`),

  cancelScheduled: (id: string) =>
    request<{ cancelled: boolean }>(`/api/scheduled/${id}`, { method: "DELETE" }),

  listPersonas: () => request<Persona[]>("/api/personas"),

  getMetrics: () => request<MetricsSummary>("/api/metrics"),
  collectMetrics: () => request<{ collected: number; errors: string[] }>("/api/metrics/collect", { method: "POST" }),

  listAuthors: () => request<Author[]>("/api/authors"),

  addAuthor: (handle: string, priority = 1) =>
    request<Author>("/api/authors", {
      method: "POST",
      body: JSON.stringify({ handle, priority }),
    }),

  deleteAuthor: (handle: string) =>
    request<{ deleted: number }>(`/api/authors/${encodeURIComponent(handle)}`, { method: "DELETE" }),

  // Profile Study
  studyProfile: (handle: string) =>
    request<{
      handle: string; tweetCount: number; themes: string[];
      writingStyle: string; typicalFormat: string;
      engagementTips: string; summary: string;
    }>(`/api/profile-study/${encodeURIComponent(handle)}`),

  // Ghostwriter
  ghostwrite: (text: string, format?: "short" | "long" | "thread", count?: number) =>
    request<{ drafts: { draftId: string; body: string }[] }>("/api/ghostwrite", {
      method: "POST",
      body: JSON.stringify({ text, format: format ?? "short", count: count ?? 3 }),
    }),
};
