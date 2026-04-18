import { createHash, randomUUID } from "node:crypto";
import type { Page } from "playwright";
import {
  xUserHandle,
  NAV_TIMEOUT,
  DELAY_AFTER_NAVIGATION,
  DEFAULT_MAX_SCROLLS,
  DEFAULT_MAX_TWEETS,
} from "../config.js";
import { getDb } from "../db/index.js";
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

export type ExtractedTweet = {
  text: string;
  tweetUrl: string | null;
  authorHandle: string | null;
  mediaUrls: string[];
};

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

function insertEvents(
  source: string,
  tweets: ExtractedTweet[],
  signalType: "like" | "view",
): number {
  const db = getDb();
  const insertEvent = db.prepare(
    `INSERT OR IGNORE INTO raw_events
     (id, source, author_handle, content_hash, text_content, tweet_url, collected_at, raw_metadata)
     VALUES (@id, @source, @author_handle, @content_hash, @text_content, @tweet_url, @collected_at, @raw_metadata)`,
  );
  const insertSignal = db.prepare(
    `INSERT INTO engagement_signals (id, event_id, signal_type, weight)
     VALUES (@id, @event_id, @signal_type, @weight)`,
  );

  const now = new Date().toISOString();
  let inserted = 0;

  const tx = db.transaction(() => {
    for (const t of tweets) {
      const content_hash = hashContent(t.text);
      const id = randomUUID();
      const meta = JSON.stringify({ tweetUrl: t.tweetUrl, mediaUrls: t.mediaUrls });
      const res = insertEvent.run({
        id,
        source,
        author_handle: t.authorHandle,
        content_hash,
        text_content: t.text,
        tweet_url: t.tweetUrl,
        collected_at: now,
        raw_metadata: meta,
      });
      if (res.changes > 0) {
        inserted += 1;
        insertSignal.run({
          id: randomUUID(),
          event_id: id,
          signal_type: signalType,
          weight: signalType === "like" ? 1.5 : 1.0,
        });
      }
    }
  });

  tx();
  return inserted;
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
    const inserted = insertEvents("likes", tweets, "like");
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
    const inserted = insertEvents(`profile:${h}`, tweets, "view");
    return {
      ok: true,
      message: `Perfil @${h}: ${tweets.length} tweets; ${inserted} novos.`,
      inserted,
    };
  });
}
