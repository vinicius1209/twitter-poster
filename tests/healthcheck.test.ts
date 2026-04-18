import { describe, it, expect } from "vitest";
import { evaluateLogin, type PageSignals } from "../src/browser/healthcheck.js";
import { selectors } from "../src/browser/selectors.js";

// ─── Testes da lógica pura (sem browser) ────────────────────────

describe("evaluateLogin", () => {
  const base: PageSignals = {
    url: "https://x.com/home",
    pageTitle: "Home / X",
    hasAccountSwitcher: false,
    hasComposer: false,
    hasTimeline: false,
    hasLoginLink: false,
    testIdsFound: [],
    firstElement: "timeout",
  };

  it("detecta logado quando compositor está visível", () => {
    const result = evaluateLogin({ ...base, hasComposer: true });
    expect(result.loggedIn).toBe(true);
  });

  it("detecta logado quando account switcher está visível", () => {
    const result = evaluateLogin({ ...base, hasAccountSwitcher: true });
    expect(result.loggedIn).toBe(true);
  });

  it("detecta logado quando timeline está visível", () => {
    const result = evaluateLogin({ ...base, hasTimeline: true });
    expect(result.loggedIn).toBe(true);
  });

  it("detecta logado com múltiplos sinais", () => {
    const result = evaluateLogin({
      ...base,
      hasAccountSwitcher: true,
      hasComposer: true,
      hasTimeline: true,
    });
    expect(result.loggedIn).toBe(true);
  });

  it("NÃO logado quando loginLink presente mesmo com timeline", () => {
    const result = evaluateLogin({
      ...base,
      hasTimeline: true,
      hasLoginLink: true,
    });
    expect(result.loggedIn).toBe(false);
  });

  it("NÃO logado quando nenhum sinal presente", () => {
    const result = evaluateLogin(base);
    expect(result.loggedIn).toBe(false);
  });

  it("NÃO logado quando só loginLink presente", () => {
    const result = evaluateLogin({ ...base, hasLoginLink: true });
    expect(result.loggedIn).toBe(false);
  });

  it("retorna debug com todos os sinais", () => {
    const signals = { ...base, hasComposer: true, firstElement: "composer" };
    const result = evaluateLogin(signals);
    expect(result.debug).toEqual(signals);
  });

  it("hint correto para logado", () => {
    const result = evaluateLogin({ ...base, hasTimeline: true });
    expect(result.hint).toContain("Sessão ativa");
  });

  it("hint correto para não logado", () => {
    const result = evaluateLogin(base);
    expect(result.hint).toContain("Faça login");
  });
});

// ─── Testes dos selectors (validação de formato) ────────────────

describe("selectors", () => {
  it("todos os selectors são strings não-vazias", () => {
    for (const [name, selector] of Object.entries(selectors)) {
      expect(selector, `selector '${name}' está vazio`).toBeTruthy();
      expect(typeof selector).toBe("string");
    }
  });

  it("selectors de login usam data-testid", () => {
    expect(selectors.sideNavAccountSwitcher).toContain("data-testid");
    expect(selectors.draftEditor).toContain("data-testid");
    expect(selectors.homeTimeline).toContain("data-testid");
  });

  it("signInLink aponta para /login", () => {
    expect(selectors.signInLink).toContain("/login");
  });

  it("selectors de tweet usam data-testid", () => {
    expect(selectors.tweetArticle).toContain("data-testid");
    expect(selectors.tweetText).toContain("data-testid");
  });

  it("postButton usa data-testid", () => {
    expect(selectors.postButton).toContain("data-testid");
  });
});
