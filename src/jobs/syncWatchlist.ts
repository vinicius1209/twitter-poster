import { getWatchlistHandles } from "../db/repositories/authors.repo.js";
import { createTask } from "../db/repositories/agentTasks.repo.js";

/**
 * Cria tasks de coleta para cada perfil da watchlist.
 * Não chama browser diretamente — delega ao agent via task queue.
 */
export async function syncWatchlistAccounts(): Promise<{
  results: { handle: string; taskId: string }[];
}> {
  const rows = await getWatchlistHandles();
  const results = [];

  for (const r of rows) {
    const task = await createTask("collect_profile", { handle: r.handle, maxScrolls: 6, maxTweets: 40 });
    results.push({ handle: r.handle, taskId: task.id });
  }

  return { results };
}
