import { getSupabase } from "../supabase.js";

export type MentorStyle = {
  id: string;
  handle: string;
  tweet_count: number;
  avg_length: number | null;
  uses_emojis: boolean;
  uses_hashtags: boolean;
  uses_threads: boolean;
  tone_description: string | null;
  common_topics: string | null;
  writing_patterns: string | null;
  sample_phrases: string | null;
  analyzed_at: string;
};

export async function getMentorStyle(handle: string): Promise<MentorStyle | null> {
  const { data } = await getSupabase().from("mentor_styles")
    .select("*").eq("handle", handle).single();
  return data as MentorStyle | null;
}

export async function upsertMentorStyle(params: {
  id: string;
  handle: string;
  tweetCount: number;
  avgLength: number | null;
  usesEmojis: boolean;
  usesHashtags: boolean;
  usesThreads: boolean;
  toneDescription: string | null;
  commonTopics: string | null;
  writingPatterns: string | null;
  samplePhrases: string | null;
}): Promise<void> {
  await getSupabase().from("mentor_styles").upsert({
    id: params.id,
    handle: params.handle,
    tweet_count: params.tweetCount,
    avg_length: params.avgLength,
    uses_emojis: params.usesEmojis ? 1 : 0,
    uses_hashtags: params.usesHashtags ? 1 : 0,
    uses_threads: params.usesThreads ? 1 : 0,
    tone_description: params.toneDescription,
    common_topics: params.commonTopics,
    writing_patterns: params.writingPatterns,
    sample_phrases: params.samplePhrases,
    analyzed_at: new Date().toISOString(),
  }, { onConflict: "handle" });
}

export async function listMentorStyles(): Promise<MentorStyle[]> {
  const { data } = await getSupabase().from("mentor_styles")
    .select("*").order("analyzed_at", { ascending: false });
  return (data ?? []) as MentorStyle[];
}
