import { getSupabase } from "../supabase.js";

export type DraftRow = {
  id: string;
  body: string;
  status: string;
  inspired_by_event_ids: string | null;
  similarity_note: string | null;
  persona_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function listDrafts(limit = 100, offset = 0, userId?: string): Promise<{ data: DraftRow[]; total: number }> {
  const sb = getSupabase();
  let query = sb.from("drafts").select("*", { count: "exact" })
    .neq("status", "discarded")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (userId) query = query.eq("user_id", userId);
  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data ?? []) as DraftRow[], total: count ?? 0 };
}

export async function getDraft(id: string): Promise<DraftRow | undefined> {
  const { data, error } = await getSupabase().from("drafts").select("*").eq("id", id).single();
  if (error) return undefined;
  return data as DraftRow;
}

export async function updateDraftBody(id: string, body: string, now: string): Promise<void> {
  await getSupabase().from("drafts").update({ body, updated_at: now }).eq("id", id);
}

export async function updateDraftStatus(id: string, status: string, now: string): Promise<void> {
  await getSupabase().from("drafts").update({ status, updated_at: now }).eq("id", id);
}

export async function getRecentDraftBodies(limit = 10, userId?: string): Promise<string[]> {
  const sb = getSupabase();
  let query = sb.from("drafts").select("body")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return (data ?? []).map((r: { body: string }) => r.body);
}

export async function insertDraft(params: {
  id: string;
  body: string;
  status: string;
  inspiredByEventIds: string;
  similarityNote: string | null;
  personaId?: string | null;
  userId?: string | null;
  now: string;
}): Promise<void> {
  await getSupabase().from("drafts").insert({
    id: params.id,
    body: params.body,
    status: params.status,
    inspired_by_event_ids: params.inspiredByEventIds,
    similarity_note: params.similarityNote,
    persona_id: params.personaId ?? null,
    user_id: params.userId ?? null,
    created_at: params.now,
    updated_at: params.now,
  });
}

export async function deleteDraft(id: string): Promise<void> {
  await getSupabase().from("drafts").update({ status: "discarded", updated_at: new Date().toISOString() }).eq("id", id);
}
