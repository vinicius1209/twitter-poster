import { selectors } from "./selectors.js";
import { getPersistentContext } from "./session.js";
import { enqueue } from "./queue.js";

export type SessionHealth = {
  ok: boolean;
  loggedIn: boolean;
  url: string;
  hint: string;
  debug?: Record<string, unknown>;
};

export type PageSignals = {
  url: string;
  pageTitle: string;
  hasAccountSwitcher: boolean;
  hasComposer: boolean;
  hasTimeline: boolean;
  hasLoginLink: boolean;
  testIdsFound: string[];
  firstElement: string;
};

/**
 * Lógica pura de decisão — testável sem browser.
 */
export function evaluateLogin(signals: PageSignals): SessionHealth {
  const loggedIn =
    (signals.hasAccountSwitcher || signals.hasComposer || signals.hasTimeline) &&
    !signals.hasLoginLink;

  return {
    ok: true,
    loggedIn,
    url: signals.url,
    hint: loggedIn
      ? "Sessão ativa: o app enxerga a home logada."
      : "Faça login no navegador que abriu; depois rode o healthcheck de novo.",
    debug: signals,
  };
}

/**
 * Coleta sinais da página do X via Playwright.
 */
async function collectPageSignals(page: import("playwright").Page): Promise<PageSignals> {
  // Espera a SPA renderizar — primeiro elemento que aparecer
  const firstElement = await Promise.race([
    page.locator(selectors.sideNavAccountSwitcher).first().waitFor({ state: "visible", timeout: 15_000 }).then(() => "accountSwitcher"),
    page.locator(selectors.draftEditor).first().waitFor({ state: "visible", timeout: 15_000 }).then(() => "composer"),
    page.locator(selectors.homeTimeline).first().waitFor({ state: "visible", timeout: 15_000 }).then(() => "timeline"),
    page.locator(selectors.signInLink).first().waitFor({ state: "visible", timeout: 15_000 }).then(() => "loginLink"),
  ]).catch(() => "timeout");

  console.log("[healthcheck] primeiro elemento encontrado:", firstElement);

  const hasAccountSwitcher = await page.locator(selectors.sideNavAccountSwitcher).first().isVisible().catch(() => false);
  const hasComposer = await page.locator(selectors.draftEditor).first().isVisible().catch(() => false);
  const hasTimeline = await page.locator(selectors.homeTimeline).first().isVisible().catch(() => false);
  const hasLoginLink = await page.locator(selectors.signInLink).first().isVisible().catch(() => false);
  const pageTitle = await page.title().catch(() => "");
  const testIdsFound = await page.evaluate(`
    [...document.querySelectorAll("[data-testid]")].slice(0, 30).map(el => el.getAttribute("data-testid") ?? "")
  `).catch(() => []) as string[];

  return {
    url: page.url(),
    pageTitle,
    hasAccountSwitcher,
    hasComposer,
    hasTimeline,
    hasLoginLink,
    testIdsFound,
    firstElement,
  };
}

export function checkSessionHealth(navigate = true): Promise<SessionHealth> {
  return enqueue(async () => {
    console.log("[healthcheck] iniciando...");
    const context = await getPersistentContext();
    const page = context.pages()[0] ?? (await context.newPage());

    if (navigate) {
      console.log("[healthcheck] navegando para x.com/home...");
      await page.goto("https://x.com/home", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      console.log("[healthcheck] DOM carregou, URL:", page.url());
    }

    console.log("[healthcheck] coletando sinais da página...");
    const signals = await collectPageSignals(page);
    console.log("[healthcheck] sinais:", JSON.stringify(signals, null, 2));

    return evaluateLogin(signals);
  });
}
