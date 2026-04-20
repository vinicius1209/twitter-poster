import { createTask } from "../db/repositories/agentTasks.repo.js";
import { getPostsNeedingMetrics } from "../db/repositories/metrics.repo.js";

/**
 * Cria uma task de coleta de métricas para o agent.
 * Não chama browser diretamente — delega ao agent via task queue.
 */
export async function collectMetricsJob(): Promise<{ collected: number; errors: string[] }> {
  const posts = await getPostsNeedingMetrics();
  if (posts.length === 0) return { collected: 0, errors: [] };

  await createTask("collect_metrics", { posts });
  return { collected: 0, errors: [`Task criada para ${posts.length} posts. Aguardando agent.`] };
}

// Worker removido — métricas agora são coletadas via task queue
export function startMetricsWorker(): void {
  // No-op: métricas são coletadas quando o usuário clica na UI ou via agent polling
}

export function stopMetricsWorker(): void {
  // No-op
}
