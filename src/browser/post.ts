import {
  POST_LIMITS,
  NAV_TIMEOUT,
  DELAY_COMPOSER_WAIT,
  DELAY_BEFORE_SUBMIT,
  DELAY_AFTER_SUBMIT,
  TYPING_DELAY,
  xUserHandle,
} from "../config.js";
import { selectors } from "./selectors.js";
import { getPersistentContext } from "./session.js";
import { delay } from "../util/delay.js";
import { enqueue } from "./queue.js";

export type PostResult = { ok: boolean; error?: string; tweetUrl?: string };

/**
 * Publica um post pela UI web (home → compositor → Postar).
 * Após publicar, tenta capturar a URL do tweet visitando o perfil do usuário.
 */
export function postTweetViaUi(body: string): Promise<PostResult> {
  const text = body.trim().slice(0, POST_LIMITS.long);
  if (!text) {
    return Promise.resolve({ ok: false, error: "Texto vazio." });
  }

  return enqueue(async () => {
    const context = await getPersistentContext();
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("https://x.com/home", {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    await delay(DELAY_COMPOSER_WAIT);

    const composer = page.locator(selectors.draftEditor).first();
    await composer.waitFor({ state: "visible", timeout: 30_000 }).catch(() => null);
    const visible = await composer.isVisible().catch(() => false);
    if (!visible) {
      return {
        ok: false,
        error:
          "Compositor não encontrado. Confirme se está logado e se a home carregou.",
      };
    }

    await composer.click();
    await composer.fill("");
    await page.keyboard.type(text, { delay: TYPING_DELAY });
    await delay(DELAY_BEFORE_SUBMIT);

    // Espera o botão Post ficar habilitado (X valida o conteúdo antes)
    const btn = page.locator(selectors.postButton).first();
    await btn.waitFor({ state: "visible", timeout: 10_000 });
    await delay(1000); // X precisa de tempo para habilitar o botão após digitação

    // Tenta clicar até 3x — o botão pode não responder na primeira
    for (let attempt = 0; attempt < 3; attempt++) {
      const isEnabled = await btn.isEnabled().catch(() => false);
      if (isEnabled) {
        await btn.click();
        break;
      }
      await delay(1000);
    }

    await delay(DELAY_AFTER_SUBMIT);

    // Tentar capturar a URL do tweet publicado
    let tweetUrl: string | undefined;
    if (xUserHandle) {
      try {
        await page.goto(`https://x.com/${xUserHandle}`, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await delay(2000);

        // Pega o primeiro tweet do perfil (o mais recente)
        const firstTweetLink = page.locator(selectors.tweetLink).first();
        const href = await firstTweetLink.getAttribute("href").catch(() => null);
        if (href) {
          tweetUrl = href.startsWith("http") ? href : `https://x.com${href}`;
        }
      } catch {
        // Falhou ao capturar URL — não é bloqueante
      }
    }

    return { ok: true, tweetUrl };
  });
}
