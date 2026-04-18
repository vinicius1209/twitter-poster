import { WORKER_MAX_ATTEMPTS, WORKER_BACKOFF_SECONDS, xUserHandle } from "../config.js";
import { postTweetViaUi } from "../browser/post.js";
import { delay } from "../util/delay.js";
import { updateDraftStatus } from "../db/repositories/drafts.repo.js";
import {
  getNextScheduledPost,
  setScheduledAttempts,
  markScheduledPosted,
  markScheduledFailed,
  reschedulePost,
  updateScheduledTweetUrl,
} from "../db/repositories/scheduled.repo.js";

let timer: ReturnType<typeof setInterval> | null = null;

export function startPublishWorker(intervalMs = 20_000): void {
  if (timer) return;
  timer = setInterval(() => { void tickPublishQueue(); }, intervalMs);
  void tickPublishQueue();
}

export function stopPublishWorker(): void {
  if (timer) { clearInterval(timer); timer = null; }
}

async function tickPublishQueue(): Promise<void> {
  const now = new Date().toISOString();
  const row = await getNextScheduledPost(now);
  if (!row) return;

  const attempt = row.attempts + 1;
  await setScheduledAttempts(row.id, attempt);

  const result = await postTweetViaUi(row.body, xUserHandle || undefined);

  if (result.ok) {
    await markScheduledPosted(row.id);
    if (result.tweetUrl) await updateScheduledTweetUrl(row.id, result.tweetUrl);
    if (row.draft_id) await updateDraftStatus(row.draft_id, "posted", now);
  } else {
    const err = result.error ?? "Erro desconhecido";
    if (attempt >= WORKER_MAX_ATTEMPTS) {
      await markScheduledFailed(row.id, `${err} (após ${WORKER_MAX_ATTEMPTS} tentativas)`);
    } else {
      const backoffSec = WORKER_BACKOFF_SECONDS[attempt - 1] ?? 600;
      const nextRun = new Date(Date.now() + backoffSec * 1000).toISOString();
      await reschedulePost(row.id, nextRun, `Tentativa ${attempt}/${WORKER_MAX_ATTEMPTS}: ${err}`);
    }
  }

  await delay(2000);
}
