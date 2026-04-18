import { collectFromProfile } from "../browser/collect.js";
import { getWatchlistHandles } from "../db/repositories/authors.repo.js";

export async function syncWatchlistAccounts(): Promise<{
  results: { handle: string; inserted: number; message: string }[];
}> {
  const rows = await getWatchlistHandles();
  const results: { handle: string; inserted: number; message: string }[] = [];

  for (const r of rows) {
    const res = await collectFromProfile(r.handle, { maxScrolls: 6, maxTweets: 40 });
    results.push({ handle: r.handle, inserted: res.inserted, message: res.message });
  }

  return { results };
}
