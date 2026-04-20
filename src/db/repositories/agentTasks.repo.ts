import { randomUUID } from "node:crypto";
import { getSupabase } from "../supabase.js";
import type { AgentTask, AgentTaskType, AgentTaskStatus } from "../../shared/types.js";

export async function createTask(
  type: AgentTaskType,
  payload: Record<string, unknown> = {},
  userId?: string,
): Promise<AgentTask> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { error } = await getSupabase().from("agent_tasks").insert({
    id, type, status: "pending", payload,
    created_at: now, user_id: userId ?? null,
  });
  if (error) throw error;
  return { id, type, status: "pending", payload, result: null, error: null, created_at: now, started_at: null, completed_at: null, user_id: userId ?? null };
}

export async function claimNextTask(): Promise<AgentTask | null> {
  const sb = getSupabase();
  const now = new Date().toISOString();

  // Busca a task pending mais antiga
  const { data: pending } = await sb.from("agent_tasks")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!pending || pending.length === 0) return null;

  const task = pending[0] as AgentTask;

  // Tenta clamar atomicamente (se outro agent pegou, o update não afeta nada)
  const { data: claimed } = await sb.from("agent_tasks")
    .update({ status: "running", started_at: now })
    .eq("id", task.id)
    .eq("status", "pending")
    .select("*");

  if (!claimed || claimed.length === 0) return null;
  return claimed[0] as AgentTask;
}

export async function completeTask(id: string, result: Record<string, unknown>): Promise<void> {
  await getSupabase().from("agent_tasks").update({
    status: "completed",
    result,
    completed_at: new Date().toISOString(),
  }).eq("id", id);
}

export async function failTask(id: string, error: string): Promise<void> {
  await getSupabase().from("agent_tasks").update({
    status: "failed",
    error,
    completed_at: new Date().toISOString(),
  }).eq("id", id);
}

export async function getTask(id: string): Promise<AgentTask | null> {
  const { data } = await getSupabase().from("agent_tasks").select("*").eq("id", id).single();
  return (data as AgentTask) ?? null;
}

export async function listTasks(status?: AgentTaskStatus, limit = 20): Promise<AgentTask[]> {
  const sb = getSupabase();
  let query = sb.from("agent_tasks").select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []) as AgentTask[];
}

export async function resetStaleTasks(olderThanMinutes = 5): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const { data } = await getSupabase().from("agent_tasks")
    .update({ status: "pending", started_at: null })
    .eq("status", "running")
    .lt("started_at", cutoff)
    .select("id");
  return data?.length ?? 0;
}
