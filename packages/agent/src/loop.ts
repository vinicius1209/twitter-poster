import { CoreClient } from "./client.js";
import { executeTask } from "./executor.js";

export async function startPollingLoop(
  client: CoreClient,
  pollIntervalMs: number,
  signal: AbortSignal,
): Promise<void> {
  console.log(`[agent] Polling a cada ${pollIntervalMs / 1000}s...`);

  while (!signal.aborted) {
    try {
      const task = await client.fetchNextTask();

      if (task) {
        console.log(`[agent] Task recebida: ${task.type} (${task.id.slice(0, 8)})`);
        try {
          const result = await executeTask(task);
          await client.reportResult(task.id, result);
          console.log(`[agent] Task ${task.id.slice(0, 8)} completada.`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[agent] Task ${task.id.slice(0, 8)} falhou: ${msg}`);
          await client.reportFailure(task.id, msg);
        }
        // Pausa curta entre tasks
        await sleep(1000, signal);
      } else {
        // Sem tasks — espera o intervalo
        await sleep(pollIntervalMs, signal);
      }
    } catch (err) {
      console.error("[agent] Erro no polling:", err instanceof Error ? err.message : err);
      await sleep(pollIntervalMs, signal);
    }
  }

  console.log("[agent] Polling encerrado.");
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}
