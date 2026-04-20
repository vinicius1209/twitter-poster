import { createHash } from "node:crypto";
import type { Page } from "playwright";
import {
  xUserHandle,
  NAV_TIMEOUT,
  DELAY_AFTER_NAVIGATION,
  DEFAULT_MAX_SCROLLS,
  DEFAULT_MAX_TWEETS,
} from "../config.js";
import { insertEvents } from "../db/repositories/events.repo.js";
import { selectors } from "./selectors.js";
import { delay } from "../util/delay.js";
import { getPersistentContext } from "./session.js";
import { enqueue } from "./queue.js";

export type CollectLimits = {
  maxScrolls: number;
  maxTweets: number;
};

const defaultLimits: CollectLimits = {
  maxScrolls: DEFAULT_MAX_SCROLLS,
  maxTweets: DEFAULT_MAX_TWEETS,
};

function hashContent(text: string): string {
  return createHash("sha256").update(text.trim(), "utf8").digest("hex");
}

async function scrollForMore(page: Page, times: number): Promise<void> {
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel(0, 2000);
    await delay(800 + Math.random() * 400);
  }
}

import type { ExtractedTweet } from "../shared/types.js";
export type { ExtractedTweet } from "../shared/types.js";

async function extractTweetsFromPage(
  page: Page,
  limits: CollectLimits,
): Promise<ExtractedTweet[]> {
  const seen = new Set<string>();
  const out: ExtractedTweet[] = [];

  for (let s = 0; s < limits.maxScrolls && out.length < limits.maxTweets; s++) {
    const articles = await page.locator(selectors.tweetArticle).all();
    for (const article of articles) {
      if (out.length >= limits.maxTweets) break;
      const textEl = article.locator(selectors.tweetText).first();
      const text = (await textEl.innerText().catch(() => "")).trim();
      if (!text) continue;
      const key = hashContent(text);
      if (seen.has(key)) continue;
      seen.add(key);

      const linkEl = article.locator(selectors.tweetLink).first();
      const href = await linkEl.getAttribute("href").catch(() => null);
      const tweetUrl = href
        ? href.startsWith("http")
          ? href
          : `https://x.com${href}`
        : null;

      let authorHandle: string | null = null;
      const userLinks = await article.locator('a[href^="/"]').all();
      for (const a of userLinks) {
        const h = await a.getAttribute("href");
        if (h && /^\/[^/]+$/.test(h) && !h.includes("status")) {
          authorHandle = h.replace("/", "");
          break;
        }
      }

      // Extrair URLs de mídia (imagens e vídeos)
      const mediaUrls: string[] = [];
      const images = await article.locator('img[src*="pbs.twimg.com/media"]').all();
      for (const img of images) {
        const src = await img.getAttribute("src").catch(() => null);
        if (src) mediaUrls.push(src);
      }
      const videos = await article.locator('video source, video[src]').all();
      for (const vid of videos) {
        const src = await vid.getAttribute("src").catch(() => null);
        if (src) mediaUrls.push(src);
      }

      out.push({ text, tweetUrl, authorHandle, mediaUrls });
    }
    await scrollForMore(page, 1);
  }

  return out;
}

export function collectLikes(
  limits: CollectLimits = defaultLimits,
): Promise<{ ok: boolean; message: string; inserted: number }> {
  const handle = xUserHandle;
  if (!handle) {
    return Promise.resolve({
      ok: false,
      message: "Defina X_USER_HANDLE no .env",
      inserted: 0,
    });
  }

  return enqueue(async () => {
    const context = await getPersistentContext();
    const page = context.pages()[0] ?? (await context.newPage());
    const url = `https://x.com/${handle}/likes`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await delay(DELAY_AFTER_NAVIGATION);
    const tweets = await extractTweetsFromPage(page, limits);
    const inserted = await insertEvents("likes", tweets, "like");
    return {
      ok: true,
      message: `Coletados ${tweets.length} tweets visíveis; ${inserted} novos no banco.`,
      inserted,
    };
  });
}

export function collectFromProfile(
  profileHandle: string,
  limits: CollectLimits = defaultLimits,
): Promise<{ ok: boolean; message: string; inserted: number }> {
  const h = profileHandle.replace(/^@/, "");
  return enqueue(async () => {
    const context = await getPersistentContext();
    const page = context.pages()[0] ?? (await context.newPage());
    const url = `https://x.com/${h}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await delay(DELAY_AFTER_NAVIGATION);
    const tweets = await extractTweetsFromPage(page, limits);
    const inserted = await insertEvents(`profile:${h}`, tweets, "view");
    return {
      ok: true,
      message: `Perfil @${h}: ${tweets.length} tweets; ${inserted} novos.`,
      inserted,
    };
  });
}
