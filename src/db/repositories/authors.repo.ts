import { getSupabase } from "../supabase.js";

export type AuthorRow = {
  id: string;
  handle: string;
  display_name: string | null;
  priority: number;
  user_id: string | null;
  created_at: string;
};

export async function listAuthors(userId?: string): Promise<AuthorRow[]> {
  const sb = getSupabase();
  let query = sb.from("authors").select("*").order("priority", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return (data ?? []) as AuthorRow[];
}

export async function getWatchlistHandles(userId?: string): Promise<{ handle: string }[]> {
  const sb = getSupabase();
  let query = sb.from("authors").select("handle").gt("priority", 0).order("priority", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return (data ?? []) as { handle: string }[];
}

export async function upsertAuthor(params: {
  id: string; handle: string; displayName: string | null; priority: number; now: string; userId?: string;
}): Promise<AuthorRow | undefined> {
  const sb = getSupabase();
  await sb.from("authors").upsert({
    id: params.id, handle: params.handle, display_name: params.displayName,
    priority: params.priority, created_at: params.now, user_id: params.userId ?? null,
  }, { onConflict: "handle" });
  const { data } = await sb.from("authors").select("*").eq("handle", params.handle).single();
  return data as AuthorRow | undefined;
}

export async function deleteAuthor(handle: string): Promise<number> {
  const { data } = await getSupabase().from("authors").delete().eq("handle", handle).select("id");
  return data?.length ?? 0;
}
