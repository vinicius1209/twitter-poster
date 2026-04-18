import { getSupabase } from "../supabase.js";

export type ScheduledPostRow = {
  id: string;
  draft_id: string | null;
  body: string;
  run_at: string;
  status: string;
  attempts: number;
  last_error: string | null;
  tweet_url: string | null;
  user_id: string | null;
  created_at: string;
};

export async function listScheduled(limit = 100, offset = 0, userId?: string): Promise<{ data: ScheduledPostRow[]; total: number }> {
  const sb = getSupabase();
  let query = sb.from("scheduled_posts").select("*", { count: "exact" })
    .order("run_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (userId) query = query.eq("user_id", userId);
  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data ?? []) as ScheduledPostRow[], total: count ?? 0 };
}

export async function getScheduled(id: string): Promise<ScheduledPostRow | undefined> {
  const { data } = await getSupabase().from("scheduled_posts").select("*").eq("id", id).single();
  return data as ScheduledPostRow | undefined;
}

export async function insertScheduled(params: {
  id: string; draftId: string | null; body: string; runAt: string; now: string; userId?: string;
}): Promise<void> {
  await getSupabase().from("scheduled_posts").insert({
    id: params.id, draft_id: params.draftId, body: params.body,
    run_at: params.runAt, status: "scheduled", attempts: 0,
    created_at: params.now, user_id: params.userId ?? null,
  });
}

export async function getNextScheduledPost(now: string): Promise<{ id: string; body: string; attempts: number; draft_id: string | null } | undefined> {
  const { data } = await getSupabase().from("scheduled_posts")
    .select("id, body, attempts, draft_id")
    .eq("status", "scheduled")
    .lte("run_at", now)
    .order("run_at", { ascending: true })
    .limit(1)
    .single();
  return data ?? undefined;
}

export async function setScheduledAttempts(id: string, attempts: number): Promise<void> {
  await getSupabase().from("scheduled_posts").update({ attempts }).eq("id", id);
}

export async function markScheduledPosted(id: string): Promise<void> {
  await getSupabase().from("scheduled_posts").update({ status: "posted", last_error: null }).eq("id", id);
}

export async function markScheduledFailed(id: string, error: string): Promise<void> {
  await getSupabase().from("scheduled_posts").update({ status: "failed", last_error: error }).eq("id", id);
}

export async function reschedulePost(id: string, nextRunAt: string, error: string): Promise<void> {
  await getSupabase().from("scheduled_posts").update({ run_at: nextRunAt, last_error: error }).eq("id", id);
}

export async function updateScheduledTweetUrl(id: string, tweetUrl: string): Promise<void> {
  await getSupabase().from("scheduled_posts").update({ tweet_url: tweetUrl }).eq("id", id);
}

export async function cancelScheduled(id: string): Promise<number> {
  const { data } = await getSupabase().from("scheduled_posts")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "scheduled")
    .select("id");
  return data?.length ?? 0;
}

export async function getPostedWithUrls(): Promise<ScheduledPostRow[]> {
  const { data } = await getSupabase().from("scheduled_posts")
    .select("*")
    .eq("status", "posted")
    .not("tweet_url", "is", null)
    .order("run_at", { ascending: false });
  return (data ?? []) as ScheduledPostRow[];
}
