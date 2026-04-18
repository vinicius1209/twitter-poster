/**
 * Teste de integração com browser real.
 * Roda com: npx vitest run tests/browser-integration.test.ts
 *
 * Requer Chrome instalado e PLAYWRIGHT_CHANNEL=chrome no .env.
 * Abre o browser, navega ao X, e valida que os selectors encontram elementos.
 */
import { describe, it, expect, afterAll } from "vitest";
import { getPersistentContext, closePersistentContext } from "../src/browser/session.js";
import { selectors } from "../src/browser/selectors.js";
import { evaluateLogin, type PageSignals } from "../src/browser/healthcheck.js";

describe("browser integration", { timeout: 60_000 }, () => {
  afterAll(async () => {
    await closePersistentContext();
  });

  it("abre o browser e navega ao X", async () => {
    const ctx = await getPersistentContext();
    const page = ctx.pages()[0] ?? await ctx.newPage();

    await page.goto("https://x.com/home", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const url = page.url();
    console.log("URL após navegação:", url);
    expect(url).toContain("x.com");
  });

  it("encontra pelo menos um data-testid no DOM", async () => {
    const ctx = await getPersistentContext();
    const page = ctx.pages()[0]!;

    // Espera qualquer elemento com data-testid aparecer
    await page.locator("[data-testid]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const testIds = await page.evaluate(() => {
      const els = document.querySelectorAll("[data-testid]");
      return [...els].map(el => el.getAttribute("data-testid"));
    });

    console.log("data-testids encontrados:", testIds.length);
    console.log("primeiros 20:", testIds.slice(0, 20));
    expect(testIds.length).toBeGreaterThan(0);
  });

  it("valida selectors do healthcheck contra o DOM real", async () => {
    const ctx = await getPersistentContext();
    const page = ctx.pages()[0]!;

    const checks = {
      sideNavAccountSwitcher: await page.locator(selectors.sideNavAccountSwitcher).first().isVisible().catch(() => false),
      draftEditor: await page.locator(selectors.draftEditor).first().isVisible().catch(() => false),
      homeTimeline: await page.locator(selectors.homeTimeline).first().isVisible().catch(() => false),
      signInLink: await page.locator(selectors.signInLink).first().isVisible().catch(() => false),
      tweetArticle: await page.locator(selectors.tweetArticle).first().isVisible().catch(() => false),
    };

    console.log("Visibilidade dos selectors:", checks);

    // Pelo menos UM selector de "logado" OU "deslogado" deve ter match
    const anyFound = Object.values(checks).some(v => v === true);
    expect(anyFound, "Nenhum selector encontrou nada — os data-testid mudaram?").toBe(true);
  });

  it("evaluateLogin retorna resultado coerente com a página", async () => {
    const ctx = await getPersistentContext();
    const page = ctx.pages()[0]!;

    const signals: PageSignals = {
      url: page.url(),
      pageTitle: await page.title().catch(() => ""),
      hasAccountSwitcher: await page.locator(selectors.sideNavAccountSwitcher).first().isVisible().catch(() => false),
      hasComposer: await page.locator(selectors.draftEditor).first().isVisible().catch(() => false),
      hasTimeline: await page.locator(selectors.homeTimeline).first().isVisible().catch(() => false),
      hasLoginLink: await page.locator(selectors.signInLink).first().isVisible().catch(() => false),
      testIdsFound: await page.evaluate(() =>
        [...document.querySelectorAll("[data-testid]")].slice(0, 20).map(el => el.getAttribute("data-testid") ?? "")
      ).catch(() => []),
      firstElement: "test",
    };

    console.log("Sinais reais da página:", JSON.stringify(signals, null, 2));

    const result = evaluateLogin(signals);
    console.log("Resultado evaluateLogin:", { loggedIn: result.loggedIn, hint: result.hint });

    // Se a URL contém /login ou /flow, deve ser não-logado
    if (signals.url.includes("/login") || signals.url.includes("/flow")) {
      expect(result.loggedIn).toBe(false);
    }

    // Se tem compositor visível, deve ser logado
    if (signals.hasComposer) {
      expect(result.loggedIn).toBe(true);
    }
  });
});
