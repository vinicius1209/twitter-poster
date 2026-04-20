/**
 * Executor de tasks — dispatcha para a função de browser correta.
 */
import type { AgentTask } from "./client.js";
import { collectLikes, collectFromProfile } from "../../../src/browser/collect.js";
import { postTweetViaUi } from "../../../src/browser/post.js";
import { checkSessionHealth } from "../../../src/browser/healthcheck.js";
import { selectors } from "../../../src/browser/selectors.js";
import { getPersistentContext } from "../../../src/browser/session.js";
import { enqueue } from "../../../src/browser/queue.js";
import { delay } from "../../../src/util/delay.js";

export async function executeTask(task: AgentTask): Promise<Record<string, unknown>> {
  const p = task.payload;

  switch (task.type) {
    case "collect_likes": {
      // Coleta retorna dados com insertEvents — precisamos dos tweets raw
      // Usa o browser para scraping e retorna tweets
      const result = await collectLikesRaw(
        (p.userHandle as string) ?? "",
        { maxScrolls: (p.maxScrolls as number) ?? 8, maxTweets: (p.maxTweets as number) ?? 80 },
      );
      return { tweets: result };
    }

    case "collect_profile": {
      const result = await collectFromProfileRaw(
        (p.handle as string) ?? "",
        { maxScrolls: (p.maxScrolls as number) ?? 8, maxTweets: (p.maxTweets as number) ?? 80 },
      );
      return { tweets: result };
    }

    case "publish_post": {
      const result = await postTweetViaUi(
        (p.body as string) ?? "",
        (p.userHandle as string) ?? undefined,
      );
      return result as Record<string, unknown>;
    }

    case "collect_metrics": {
      const posts = (p.posts ?? []) as { id: string; tweet_url: string }[];
      const metrics = await collectMetricsRaw(posts);
      return { metrics };
    }

    case "check_session": {
      const health = await checkSessionHealth();
      return health as Record<string, unknown>;
    }

    default:
      throw new Error(`Task type desconhecido: ${task.type}`);
  }
}

// ── Funções raw (retornam dados sem escrever no DB) ──────────

import { createHash } from "node:crypto";
import type { Page } from "playwright";

async function collectLikesRaw(
  userHandle: string,
  limits: { maxScrolls: number; maxTweets: number },
) {
  if (!userHandle) return [];
  return enqueue(async () => {
    const context = await getPersistentContext();
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(`https://x.com/${userHandle}/likes`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await delay(2000);
    return extractTweetsFromPage(page, limits);
  });
}

async function collectFromProfileRaw(
  handle: string,
  limits: { maxScrolls: number; maxTweets: number },
) {
  const h = handle.replace(/^@/, "");
  return enqueue(async () => {
    const context = await getPersistentContext();
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(`https://x.com/${h}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await delay(2000);
    return extractTweetsFromPage(page, limits);
  });
}

async function collectMetricsRaw(posts: { id: string; tweet_url: string }[]) {
  const results = [];
  for (const post of posts) {
    try {
      const m = await enqueue(async () => {
        const context = await getPersistentContext();
        const page = context.pages()[0] ?? (await context.newPage());
        await page.goto(post.tweet_url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await delay(3000);

        const parseAria = (label: string | null) => {
          if (!label) return 0;
          const match = label.replace(/,/g, "").match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const likes = parseAria(await page.locator(`${selectors.likeButton}, ${selectors.unlikeButton}`).first().getAttribute("aria-label").catch(() => null));
        const retweets = parseAria(await page.locator(selectors.retweetButton).first().getAttribute("aria-label").catch(() => null));
        const replies = parseAria(await page.locator(selectors.replyButton).first().getAttribute("aria-label").catch(() => null));
        const viewsText = await page.locator(selectors.analyticsLink).first().innerText().catch(() => "");
        const viewsMatch = viewsText.replace(/,/g, "").match(/(\d+)/);
        const views = viewsMatch ? parseInt(viewsMatch[1], 10) : 0;

        return { postId: post.id, tweetUrl: post.tweet_url, likes, retweets, replies, views, followersAtTime: null };
      });
      results.push(m);
    } catch (err) {
      console.error(`[agent] metrics error for ${post.id}:`, err instanceof Error ? err.message : err);
    }
    await delay(2000);
  }
  return results;
}

function hashContent(text: string): string {
  return createHash("sha256").update(text.trim(), "utf8").digest("hex");
}

async function extractTweetsFromPage(page: Page, limits: { maxScrolls: number; maxTweets: number }) {
  const seen = new Set<string>();
  const out: { text: string; tweetUrl: string | null; authorHandle: string | null; mediaUrls: string[] }[] = [];

  for (let s = 0; s < limits.maxScrolls && out.length < limits.maxTweets; s++) {
    const articles = await page.locator(selectors.tweetArticle).all();
    for (const article of articles) {
      if (out.length >= limits.maxTweets) break;
      const text = (await article.locator(selectors.tweetText).first().innerText().catch(() => "")).trim();
      if (!text) continue;
      const key = hashContent(text);
      if (seen.has(key)) continue;
      seen.add(key);

      const href = await article.locator(selectors.tweetLink).first().getAttribute("href").catch(() => null);
      const tweetUrl = href ? (href.startsWith("http") ? href : `https://x.com${href}`) : null;

      let authorHandle: string | null = null;
      for (const a of await article.locator('a[href^="/"]').all()) {
        const h = await a.getAttribute("href");
        if (h && /^\/[^/]+$/.test(h) && !h.includes("status")) { authorHandle = h.replace("/", ""); break; }
      }

      const mediaUrls: string[] = [];
      for (const img of await article.locator('img[src*="pbs.twimg.com/media"]').all()) {
        const src = await img.getAttribute("src").catch(() => null);
        if (src) mediaUrls.push(src);
      }

      out.push({ text, tweetUrl, authorHandle, mediaUrls });
    }
    await page.mouse.wheel(0, 2000);
    await delay(800 + Math.random() * 400);
  }

  return out;
}
