/** Tipos compartilhados entre backend e frontend. */

export type RawEvent = {
  id: string;
  source: string;
  author_handle: string | null;
  text_content: string;
  tweet_url: string | null;
  collected_at: string;
};

export type Draft = {
  id: string;
  body: string;
  status: string;
  inspired_by_event_ids: string | null;
  similarity_note: string | null;
  persona_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduledPost = {
  id: string;
  draft_id: string | null;
  body: string;
  run_at: string;
  status: string;
  attempts: number;
  last_error: string | null;
  tweet_url: string | null;
  created_at: string;
};

export type TopicRun = {
  id: string;
  window_hours: number;
  summary: string;
  topics_json: string | null;
  created_at: string;
};

export type Author = {
  id: string;
  handle: string;
  display_name: string | null;
  priority: number;
  created_at: string;
};

export type Persona = {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  tone: string;
  icon: string;
  is_default: boolean;
  created_at: string;
};

export type PostMetric = {
  id: string;
  scheduled_post_id: string;
  tweet_url: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  followers_at_time: number | null;
  collected_at: string;
};

export type MetricsSummary = {
  totalPosts: number;
  totalLikes: number;
  totalRetweets: number;
  totalViews: number;
  bestPost: { body: string; likes: number; views: number; run_at: string } | null;
  posts: (ScheduledPost & { latestMetric: PostMetric | null })[];
};

export type SessionHealth = {
  ok: boolean;
  loggedIn: boolean;
  url: string;
  hint: string;
  debug?: Record<string, unknown>;
};
