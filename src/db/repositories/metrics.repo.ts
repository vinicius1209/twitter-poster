import { getSupabase } from "../supabase.js";
import type { ScheduledPostRow } from "./scheduled.repo.js";

export type MetricRow = {
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

export async function insertMetric(params: {
  id: string; scheduledPostId: string; tweetUrl: string;
  likes: number; retweets: number; replies: number; views: number;
  followersAtTime: number | null; userId?: string;
}): Promise<void> {
  await getSupabase().from("post_metrics").insert({
    id: params.id, scheduled_post_id: params.scheduledPostId,
    tweet_url: params.tweetUrl, likes: params.likes,
    retweets: params.retweets, replies: params.replies,
    views: params.views, followers_at_time: params.followersAtTime,
    user_id: params.userId ?? null, collected_at: new Date().toISOString(),
  });
}

export async function getPostsNeedingMetrics(): Promise<{ id: string; tweet_url: string }[]> {
  const { data } = await getSupabase().from("scheduled_posts")
    .select("id, tweet_url")
    .eq("status", "posted")
    .not("tweet_url", "is", null)
    .order("run_at", { ascending: false })
    .limit(20);
  return (data ?? []) as { id: string; tweet_url: string }[];
}

export type MetricsDashboardData = {
  totalPosts: number;
  totalLikes: number;
  totalRetweets: number;
  totalViews: number;
  bestPost: { body: string; likes: number; views: number; run_at: string } | null;
  posts: (ScheduledPostRow & { latestMetric: MetricRow | null })[];
};

export async function getMetricsDashboard(userId?: string): Promise<MetricsDashboardData> {
  const sb = getSupabase();

  let query = sb.from("scheduled_posts").select("*")
    .eq("status", "posted")
    .order("run_at", { ascending: false })
    .limit(50);
  if (userId) query = query.eq("user_id", userId);
  const { data: posts } = await query;
  const postedPosts = (posts ?? []) as ScheduledPostRow[];

  let totalLikes = 0, totalRetweets = 0, totalViews = 0;
  let bestPost: MetricsDashboardData["bestPost"] = null;

  const result = [];
  for (const post of postedPosts) {
    const { data: metrics } = await sb.from("post_metrics")
      .select("*")
      .eq("scheduled_post_id", post.id)
      .order("collected_at", { ascending: false })
      .limit(1);
    const metric = (metrics?.[0] as MetricRow) ?? null;

    if (metric) {
      totalLikes += metric.likes;
      totalRetweets += metric.retweets;
      totalViews += metric.views;
      if (!bestPost || metric.likes > bestPost.likes) {
        bestPost = { body: post.body, likes: metric.likes, views: metric.views, run_at: post.run_at };
      }
    }

    result.push({ ...post, latestMetric: metric });
  }

  return { totalPosts: postedPosts.length, totalLikes, totalRetweets, totalViews, bestPost, posts: result };
}
