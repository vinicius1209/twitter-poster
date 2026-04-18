import { getSupabase } from "../supabase.js";

export type TopicRunRow = {
  id: string;
  window_hours: number;
  summary: string;
  topics_json: string | null;
  user_id: string | null;
  created_at: string;
};

export async function listTopicRuns(limit = 20, userId?: string): Promise<TopicRunRow[]> {
  const sb = getSupabase();
  let query = sb.from("topic_runs").select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return (data ?? []) as TopicRunRow[];
}

export async function getLatestTopicRun(userId?: string): Promise<TopicRunRow | null> {
  const sb = getSupabase();
  let query = sb.from("topic_runs").select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return (data?.[0] as TopicRunRow) ?? null;
}

export async function insertTopicRun(params: {
  id: string; windowHours: number; summary: string; topicsJson: string; now: string; userId?: string;
}): Promise<void> {
  await getSupabase().from("topic_runs").insert({
    id: params.id, window_hours: params.windowHours,
    summary: params.summary, topics_json: params.topicsJson,
    created_at: params.now, user_id: params.userId ?? null,
  });
}
