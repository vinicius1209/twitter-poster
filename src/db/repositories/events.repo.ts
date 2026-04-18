import { randomUUID, createHash } from "node:crypto";
import { getSupabase } from "../supabase.js";
import type { ExtractedTweet } from "../../browser/collect.js";

function hashContent(text: string): string {
  return createHash("sha256").update(text.trim(), "utf8").digest("hex");
}

export type RawEventRow = {
  id: string;
  source: string;
  author_handle: string | null;
  content_hash: string;
  text_content: string;
  tweet_url: string | null;
  collected_at: string;
  raw_metadata: string | null;
  user_id: string | null;
};

export async function listEvents(limit: number, offset = 0, userId?: string): Promise<{ data: RawEventRow[]; total: number }> {
  const sb = getSupabase();
  let query = sb.from("raw_events").select("*", { count: "exact" })
    .order("collected_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (userId) query = query.eq("user_id", userId);
  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data ?? []) as RawEventRow[], total: count ?? 0 };
}

export async function listEventsBySource(source: string, limit: number, offset = 0, userId?: string): Promise<{ data: RawEventRow[]; total: number }> {
  const sb = getSupabase();
  let query = sb.from("raw_events").select("*", { count: "exact" })
    .eq("source", source)
    .order("collected_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (userId) query = query.eq("user_id", userId);
  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data ?? []) as RawEventRow[], total: count ?? 0 };
}

export async function getEventTextsSince(since: string, limit = 500, userId?: string): Promise<{ id: string; text_content: string }[]> {
  const sb = getSupabase();
  let query = sb.from("raw_events").select("id, text_content")
    .gte("collected_at", since)
    .order("collected_at", { ascending: false })
    .limit(limit);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getRandomEventsSince(since: string, limit = 12, userId?: string): Promise<{ id: string; text_content: string }[]> {
  // Supabase não tem ORDER BY RANDOM(), busca mais e faz shuffle em JS
  const sb = getSupabase();
  let query = sb.from("raw_events").select("id, text_content")
    .gte("collected_at", since)
    .limit(limit * 3);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  const arr = data ?? [];
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, limit);
}

export async function getTopAuthors(since: string, limit = 10, userId?: string): Promise<{ author_handle: string; score: number; count: number }[]> {
  const sb = getSupabase();
  // Supabase não suporta aggregate queries complexas via client, usamos RPC ou query simples
  let query = sb.from("raw_events").select("author_handle")
    .gte("collected_at", since)
    .not("author_handle", "is", null);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const h = row.author_handle as string;
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([author_handle, count]) => ({ author_handle, score: count * 1.0, count }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getEventsByAuthor(authorHandle: string, since: string, limit = 10): Promise<{ text_content: string }[]> {
  const sb = getSupabase();
  const { data, error } = await sb.from("raw_events").select("text_content")
    .eq("author_handle", authorHandle)
    .gte("collected_at", since)
    .order("collected_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getCollectionStats(userId?: string): Promise<{ source: string; count: number; latest: string; hasMedia: number }[]> {
  const sb = getSupabase();
  let query = sb.from("raw_events").select("source, collected_at, raw_metadata");
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;

  const stats = new Map<string, { count: number; latest: string; hasMedia: number }>();
  for (const row of data ?? []) {
    const s = row.source as string;
    const existing = stats.get(s) ?? { count: 0, latest: "", hasMedia: 0 };
    existing.count++;
    if (row.collected_at > existing.latest) existing.latest = row.collected_at;
    if (row.raw_metadata && JSON.stringify(row.raw_metadata).includes('"mediaUrls":["')) existing.hasMedia++;
    stats.set(s, existing);
  }

  return [...stats.entries()]
    .map(([source, s]) => ({ source, ...s }))
    .sort((a, b) => b.count - a.count);
}

export async function insertEvents(
  source: string,
  tweets: ExtractedTweet[],
  signalType: "like" | "view",
  userId?: string,
): Promise<number> {
  const sb = getSupabase();
  const now = new Date().toISOString();
  let inserted = 0;

  for (const t of tweets) {
    const id = randomUUID();
    const { error } = await sb.from("raw_events").upsert({
      id,
      source,
      author_handle: t.authorHandle,
      content_hash: hashContent(t.text),
      text_content: t.text,
      tweet_url: t.tweetUrl,
      collected_at: now,
      raw_metadata: { tweetUrl: t.tweetUrl, mediaUrls: t.mediaUrls },
      user_id: userId ?? null,
    }, { onConflict: "content_hash,source", ignoreDuplicates: true });

    if (!error) {
      inserted++;
      await sb.from("engagement_signals").insert({
        id: randomUUID(),
        event_id: id,
        signal_type: signalType,
        weight: signalType === "like" ? 1.5 : 1.0,
      });
    }
  }

  return inserted;
}
