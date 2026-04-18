/**
 * Fila serial para operações de browser.
 * Garante que apenas uma navegação/interação aconteça por vez,
 * evitando race conditions no contexto persistente do Playwright.
 */

type QueuedTask<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const queue: QueuedTask<unknown>[] = [];
let running = false;

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    try {
      const result = await task.fn();
      task.resolve(result);
    } catch (err) {
      task.reject(err);
    }
  }
  running = false;
}

/**
 * Enfileira uma operação de browser e retorna o resultado quando executada.
 * Apenas uma operação roda por vez — as demais aguardam na fila.
 */
export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ fn, resolve, reject } as QueuedTask<unknown>);
    void drain();
  });
}
