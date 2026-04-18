import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv();

const cwd = process.cwd();

export const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(cwd, "data");

export const browserUserDataDir = path.join(dataDir, "browser-profile");
export const dbPath = path.join(dataDir, "app.db");

export const xUserHandle = (process.env.X_USER_HANDLE ?? "").replace(/^@/, "");

export const playwrightChannel =
  process.env.PLAYWRIGHT_CHANNEL === "chrome" ||
  process.env.PLAYWRIGHT_CHANNEL === "msedge"
    ? process.env.PLAYWRIGHT_CHANNEL
    : undefined;

export const port = Number(process.env.PORT ?? 3847);

export const apiToken = process.env.API_TOKEN ?? "";

export const openaiApiKey = process.env.OPENAI_API_KEY ?? "";
export const openaiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const openaiEmbeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

// ── Database ────────────────────────────────────────────────────────

export const dbProvider = (process.env.DB_PROVIDER ?? "sqlite") as "sqlite" | "supabase";
export const supabaseUrl = process.env.SUPABASE_URL ?? "";
export const supabaseKey = process.env.SUPABASE_KEY ?? "";

// ── Constantes de operação ──────────────────────────────────────────

/** Limites de caracteres por tipo de post */
export const POST_LIMITS = {
  short: 280,       // conta gratuita
  long: 4000,       // X Premium (post longo)
  thread: 25000,    // thread (múltiplos posts)
} as const;

export type PostFormat = keyof typeof POST_LIMITS;

/** Limite padrão (pode ser override via parâmetro) */
export const MAX_TWEET_LENGTH = 280;

/** Timeout padrão para navegação no Playwright (ms) */
export const NAV_TIMEOUT = 90_000;

/** Delays de interação com a UI do X (ms) */
export const DELAY_AFTER_NAVIGATION = 2000;
export const DELAY_BEFORE_SUBMIT = 500;
export const DELAY_AFTER_SUBMIT = 4000;
export const DELAY_COMPOSER_WAIT = 1500;
export const TYPING_DELAY = 15;

/** Coleta: limites padrão de scroll e tweets por sessão */
export const DEFAULT_MAX_SCROLLS = 8;
export const DEFAULT_MAX_TWEETS = 80;

/** LLM: limite de chars do prompt de análise */
export const LLM_PROMPT_MAX_CHARS = 12_000;
/** LLM: máximo de textos amostrados para análise */
export const LLM_SAMPLE_SIZE = 120;

/** Similaridade: limiar para alerta de plágio */
export const SIMILARITY_THRESHOLD = 0.82;

/** Publish worker: intervalo de polling (ms) */
export const WORKER_INTERVAL = 20_000;
/** Publish worker: máximo de tentativas antes de marcar como failed */
export const WORKER_MAX_ATTEMPTS = 3;
/** Publish worker: backoff entre tentativas (segundos) */
export const WORKER_BACKOFF_SECONDS = [30, 120, 600];
