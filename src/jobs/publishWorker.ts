import { xUserHandle } from "../config.js";
import { delay } from "../util/delay.js";
import { getNextScheduledPost, setScheduledAttempts } from "../db/repositories/scheduled.repo.js";
import { createTask } from "../db/repositories/agentTasks.repo.js";

let timer: ReturnType<typeof setInterval> | null = null;

export function startPublishWorker(intervalMs = 20_000): void {
  if (timer) return;
  timer = setInterval(() => { void tickPublishQueue(); }, intervalMs);
  void tickPublishQueue();
}

export function stopPublishWorker(): void {
  if (timer) { clearInterval(timer); timer = null; }
}

/**
 * Verifica se há posts agendados para publicar.
 * Em vez de chamar o browser diretamente, cria uma task para o agent.
 */
async function tickPublishQueue(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const row = await getNextScheduledPost(now);
    if (!row) return;

    await setScheduledAttempts(row.id, row.attempts + 1);

    await createTask("publish_post", {
      body: row.body,
      scheduledPostId: row.id,
      draftId: row.draft_id,
      userHandle: xUserHandle || undefined,
    });

    console.log(`[publishWorker] Task criada para post ${row.id}`);
  } catch (err) {
    console.error("[publishWorker] erro:", err instanceof Error ? err.message : err);
  }

  await delay(2000);
}
