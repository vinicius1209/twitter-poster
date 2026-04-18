import { randomUUID } from "node:crypto";
import { xUserHandle } from "../config.js";
import { selectors } from "../browser/selectors.js";
import { getPersistentContext } from "../browser/session.js";
import { enqueue } from "../browser/queue.js";
import { delay } from "../util/delay.js";
import { getPostsNeedingMetrics, insertMetric } from "../db/repositories/metrics.repo.js";

/**
 * Extrai número de um aria-label tipo "123 Likes" ou "1,234 replies".
 */
function parseAriaNumber(ariaLabel: string | null): number {
  if (!ariaLabel) return 0;
  const match = ariaLabel.replace(/,/g, "").match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function collectMetricsJob(): Promise<{
  collected: number;
  errors: string[];
}> {
  const posts = getPostsNeedingMetrics();
  if (posts.length === 0) return { collected: 0, errors: [] };

  const errors: string[] = [];
  let collected = 0;

  for (const post of posts) {
    try {
      const metrics = await enqueue(async () => {
        const context = await getPersistentContext();
        const page = context.pages()[0] ?? (await context.newPage());

        // Navegar ao tweet
        await page.goto(post.tweet_url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await delay(3000);

        // Extrair métricas via aria-label dos botões de ação
        const likeBtn = page.locator(`${selectors.likeButton}, ${selectors.unlikeButton}`).first();
        const retweetBtn = page.locator(selectors.retweetButton).first();
        const replyBtn = page.locator(selectors.replyButton).first();

        const likesLabel = await likeBtn.getAttribute("aria-label").catch(() => null);
        const retweetsLabel = await retweetBtn.getAttribute("aria-label").catch(() => null);
        const repliesLabel = await replyBtn.getAttribute("aria-label").catch(() => null);

        const likes = parseAriaNumber(likesLabel);
        const retweets = parseAriaNumber(retweetsLabel);
        const replies = parseAriaNumber(repliesLabel);

        // Views: tentar pegar do link de analytics
        let views = 0;
        const analyticsEl = page.locator(selectors.analyticsLink).first();
        const analyticsText = await analyticsEl.innerText().catch(() => "");
        const viewsMatch = analyticsText.replace(/,/g, "").match(/(\d+)/);
        if (viewsMatch) views = parseInt(viewsMatch[1], 10);

        // Followers: navegar ao perfil
        let followersAtTime: number | null = null;
        if (xUserHandle) {
          try {
            await page.goto(`https://x.com/${xUserHandle}`, {
              waitUntil: "domcontentloaded",
              timeout: 20_000,
            });
            await delay(2000);
            const followersEl = page.locator(selectors.followersLink).first();
            const followersText = await followersEl.innerText().catch(() => "");
            const fMatch = followersText.replace(/,/g, "").match(/(\d+)/);
            if (fMatch) followersAtTime = parseInt(fMatch[1], 10);
          } catch {
            // Não bloqueia se não conseguir followers
          }
        }

        return { likes, retweets, replies, views, followersAtTime };
      });

      insertMetric({
        id: randomUUID(),
        scheduledPostId: post.id,
        tweetUrl: post.tweet_url,
        ...metrics,
      });
      collected++;
    } catch (err) {
      errors.push(`${post.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    await delay(2000); // Pausa entre coletas
  }

  return { collected, errors };
}

// Worker de métricas — roda a cada 6h
let metricsTimer: ReturnType<typeof setInterval> | null = null;

export function startMetricsWorker(intervalMs = 6 * 60 * 60 * 1000): void {
  if (metricsTimer) return;
  metricsTimer = setInterval(() => {
    void collectMetricsJob().catch(console.error);
  }, intervalMs);
}

export function stopMetricsWorker(): void {
  if (metricsTimer) {
    clearInterval(metricsTimer);
    metricsTimer = null;
  }
}
