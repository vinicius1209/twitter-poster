/**
 * HTTP client para comunicação Agent → Core API.
 */

export type AgentTask = {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
};

export class CoreClient {
  constructor(
    private coreUrl: string,
    private token: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T | null> {
    const res = await fetch(`${this.coreUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
        ...init?.headers,
      },
    });
    if (res.status === 204) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Core API error ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  async fetchNextTask(): Promise<AgentTask | null> {
    return this.request<AgentTask>("/api/agent/tasks/next");
  }

  async reportResult(taskId: string, result: Record<string, unknown>): Promise<void> {
    await this.request(`/api/agent/tasks/${taskId}/result`, {
      method: "POST",
      body: JSON.stringify({ ok: true, result }),
    });
  }

  async reportFailure(taskId: string, error: string): Promise<void> {
    await this.request(`/api/agent/tasks/${taskId}/result`, {
      method: "POST",
      body: JSON.stringify({ ok: false, error }),
    });
  }
}
