import fs from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext } from "playwright";
import {
  browserUserDataDir,
  dataDir,
  playwrightChannel,
} from "../config.js";

let contextPromise: Promise<BrowserContext> | null = null;

function ensureDataDir(): void {
  fs.mkdirSync(browserUserDataDir, { recursive: true });
}

/**
 * Args que NÃO geram banner de "unsupported flag" no Chrome do sistema.
 * Flags anti-detecção vão via addInitScript, não via args.
 */
const chromiumArgs = [
  "--disable-crash-reporter",
  "--disable-breakpad",
  `--crash-dumps-dir=${path.join(dataDir, "crash-dumps")}`,
];

/**
 * Flags que o Playwright injeta por padrão e que queremos remover:
 * - --enable-automation → seta navigator.webdriver=true
 * - --no-sandbox → gera banner "unsupported flag"
 * - --disable-blink-features=AutomationControlled → gera banner no Chrome do sistema
 *   (o efeito dele é aplicado via addInitScript abaixo)
 */
const IGNORE_DEFAULT_ARGS = [
  "--enable-automation",
  "--no-sandbox",
];

/**
 * Encontra o executável do Chrome no sistema.
 */
function findChromeExecutable(): string | undefined {
  if (playwrightChannel) return undefined;

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Injeta patches anti-detecção no contexto do browser.
 * Executa antes de qualquer script da página.
 * Usa strings para evitar erros de tipagem Node vs Browser.
 */
async function applyStealthPatches(ctx: BrowserContext): Promise<void> {
  // navigator.webdriver = undefined (principal check do X)
  await ctx.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  `);

  // Garante window.chrome completo (Chromium headless tem incompleto)
  await ctx.addInitScript(`
    if (!window.chrome) window.chrome = {};
    if (!window.chrome.runtime) window.chrome.runtime = {};
  `);

  // Fix permissions query (evita leak de automação)
  await ctx.addInitScript(`
    const origQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : origQuery(params);
  `);
}

/**
 * Um único contexto persistente (cookies/sessão do X).
 *
 * Usa executablePath para o Chrome do sistema quando disponível.
 * Patches anti-detecção são injetados via addInitScript (sem banners).
 */
export function getPersistentContext(): Promise<BrowserContext> {
  if (!contextPromise) {
    ensureDataDir();
    fs.mkdirSync(path.join(dataDir, "crash-dumps"), { recursive: true });

    const executablePath = findChromeExecutable();
    const label = executablePath ? "Chrome do sistema" : (playwrightChannel ?? "chromium");
    console.log(`Abrindo browser (${label})...`);

    contextPromise = chromium
      .launchPersistentContext(browserUserDataDir, {
        headless: false,
        ...(executablePath
          ? { executablePath }
          : { channel: playwrightChannel }),
        viewport: { width: 1280, height: 900 },
        args: chromiumArgs,
        ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
      })
      .then(async (ctx) => {
        await applyStealthPatches(ctx);
        return ctx;
      })
      .catch((err) => {
        contextPromise = null;
        throw err;
      });
  }
  return contextPromise;
}

export async function closePersistentContext(): Promise<void> {
  if (!contextPromise) return;
  const ctx = await contextPromise;
  contextPromise = null;
  await ctx.close();
}

export function getBrowserProfilePath(): string {
  return path.resolve(browserUserDataDir);
}
