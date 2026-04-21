import { create } from "zustand";
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
import { api, setToken as persistToken, type QuickSessionStatus } from "./api.js";

export type PostFormat = "short" | "long" | "thread";

type CollectionStat = {
  source: string;
  count: number;
  latest: string;
  hasMedia: number;
};

type AppState = {
  // Session
  session: SessionHealth | null;
  quickStatus: QuickSessionStatus | null;

  // Content
  events: RawEvent[];
  topics: TopicRun[];
  drafts: Draft[];
  scheduled: ScheduledPost[];
  authors: Author[];
  personas: Persona[];
  metrics: MetricsSummary | null;
  collectionStats: CollectionStat[];

  // UI
  busy: string | null;
  msg: string;

  // Settings
  token: string;
  tone: string;
  draftCount: number;
  draftFormat: PostFormat;
  selectedPersonaId: string | null;
  windowH: number;
  mentorsUsed: string[];
  analysisSource: "llm" | "heuristic" | null;

  // Actions
  setSession: (s: SessionHealth | null) => void;
  setQuickStatus: (s: QuickSessionStatus | null) => void;
  setMsg: (m: string) => void;
  clearMsg: () => void;
  setToken: (t: string) => void;
  setTone: (t: string) => void;
  setDraftCount: (n: number) => void;
  setDraftFormat: (f: PostFormat) => void;
  setSelectedPersonaId: (id: string | null) => void;
  setWindowH: (h: number) => void;
  setMentorsUsed: (m: string[]) => void;
  setAnalysisSource: (s: "llm" | "heuristic" | null) => void;

  loadAll: () => Promise<void>;
  refreshDrafts: () => Promise<void>;
  refreshScheduled: () => Promise<void>;
  refreshAuthors: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  run: (label: string, fn: () => Promise<void>) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  // Session
  session: null,
  quickStatus: null,

  // Content
  events: [],
  topics: [],
  drafts: [],
  scheduled: [],
  authors: [],
  personas: [],
  metrics: null,
  collectionStats: [],

  // UI
  busy: null,
  msg: "",

  // Settings
  token: localStorage.getItem("api_token") ?? "",
  tone: "direto, tecnico, amigavel",
  draftCount: 3,
  draftFormat: "short",
  selectedPersonaId: null,
  windowH: 24,
  mentorsUsed: [],
  analysisSource: null,

  // Setters
  setSession: (s) => set({ session: s }),
  setQuickStatus: (s) => set({ quickStatus: s }),
  setMsg: (m) => set({ msg: m }),
  clearMsg: () => set({ msg: "" }),
  setToken: (t) => {
    persistToken(t);
    set({ token: t });
  },
  setTone: (t) => set({ tone: t }),
  setDraftCount: (n) => set({ draftCount: n }),
  setDraftFormat: (f) => set({ draftFormat: f }),
  setSelectedPersonaId: (id) => set({ selectedPersonaId: id }),
  setWindowH: (h) => set({ windowH: h }),
  setMentorsUsed: (m) => set({ mentorsUsed: m }),
  setAnalysisSource: (s) => set({ analysisSource: s }),

  loadAll: async () => {
    try {
      const [qs, e, t, d, sch, a, p, m, cs] = await Promise.all([
        api.getSessionQuick(),
        api.listEvents(),
        api.listTopics(),
        api.listDrafts(),
        api.listScheduled(),
        api.listAuthors(),
        api.listPersonas(),
        api.getMetrics(),
        api.getCollectionStats(),
      ]);
      set({
        quickStatus: qs,
        events: e.data,
        topics: t,
        drafts: d.data,
        scheduled: sch.data,
        authors: a,
        personas: p,
        metrics: m,
        collectionStats: cs,
      });
    } catch {
      set({ msg: "API offline? Inicie o servidor e tente novamente." });
    }
  },

  refreshDrafts: async () => {
    try {
      const d = await api.listDrafts();
      set({ drafts: d.data });
    } catch {}
  },

  refreshScheduled: async () => {
    try {
      const s = await api.listScheduled();
      set({ scheduled: s.data });
    } catch {}
  },

  refreshAuthors: async () => {
    try {
      const a = await api.listAuthors();
      set({ authors: a });
    } catch {}
  },

  refreshMetrics: async () => {
    try {
      const m = await api.getMetrics();
      set({ metrics: m });
    } catch {}
  },

  run: async (label, fn) => {
    set({ busy: label, msg: "" });
    try {
      await fn();
      await get().loadAll();
    } catch (e) {
      set({ msg: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ busy: null });
    }
  },
}));
