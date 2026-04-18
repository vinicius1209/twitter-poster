import { randomUUID } from "node:crypto";
import { xUserHandle } from "../config.js";
import { selectors } from "../browser/selectors.js";
import { getPersistentContext } from "../browser/session.js";
import { enqueue } from "../browser/queue.js";
import { delay } from "../util/delay.js";
import { getPostsNeedingMetrics, insertMetric } from "../db/repositories/metrics.repo.js";

function parseAriaNumber(ariaLabel: string | null): number {
  if (!ariaLabel) return 0;
  const match = ariaLabel.replace(/,/g, "").match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function collectMetricsJob(): Promise<{ collected: number; errors: string[] }> {
  const posts = await getPostsNeedingMetrics();
  if (posts.length === 0) return { collected: 0, errors: [] };

  const errors: string[] = [];
  let collected = 0;

  for (const post of posts) {
    try {
      const metrics = await enqueue(async () => {
        const context = await getPersistentContext();
        const page = context.pages()[0] ?? (await context.newPage());

        await page.goto(post.tweet_url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await delay(3000);

        const likeBtn = page.locator(`${selectors.likeButton}, ${selectors.unlikeButton}`).first();
        const retweetBtn = page.locator(selectors.retweetButton).first();
        const replyBtn = page.locator(selectors.replyButton).first();

        const likes = parseAriaNumber(await likeBtn.getAttribute("aria-label").catch(() => null));
        const retweets = parseAriaNumber(await retweetBtn.getAttribute("aria-label").catch(() => null));
        const replies = parseAriaNumber(await replyBtn.getAttribute("aria-label").catch(() => null));

        let views = 0;
        const analyticsEl = page.locator(selectors.analyticsLink).first();
        const analyticsText = await analyticsEl.innerText().catch(() => "");
        const viewsMatch = analyticsText.replace(/,/g, "").match(/(\d+)/);
        if (viewsMatch) views = parseInt(viewsMatch[1], 10);

        let followersAtTime: number | null = null;
        if (xUserHandle) {
          try {
            await page.goto(`https://x.com/${xUserHandle}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
            await delay(2000);
            const followersText = await page.locator(selectors.followersLink).first().innerText().catch(() => "");
            const fMatch = followersText.replace(/,/g, "").match(/(\d+)/);
            if (fMatch) followersAtTime = parseInt(fMatch[1], 10);
          } catch {}
        }

        return { likes, retweets, replies, views, followersAtTime };
      });

      await insertMetric({ id: randomUUID(), scheduledPostId: post.id, tweetUrl: post.tweet_url, ...metrics });
      collected++;
    } catch (err) {
      errors.push(`${post.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await delay(2000);
  }

  return { collected, errors };
}

let metricsTimer: ReturnType<typeof setInterval> | null = null;

export function startMetricsWorker(intervalMs = 6 * 60 * 60 * 1000): void {
  if (metricsTimer) return;
  metricsTimer = setInterval(() => { void collectMetricsJob().catch(console.error); }, intervalMs);
}

export function stopMetricsWorker(): void {
  if (metricsTimer) { clearInterval(metricsTimer); metricsTimer = null; }
}
