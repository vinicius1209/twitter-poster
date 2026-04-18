import { getDb, type MetricRow, type ScheduledPostRow } from "../index.js";

export function insertMetric(params: {
  id: string;
  scheduledPostId: string;
  tweetUrl: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  followersAtTime: number | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO post_metrics (id, scheduled_post_id, tweet_url, likes, retweets, replies, views, followers_at_time, collected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .run(
      params.id,
      params.scheduledPostId,
      params.tweetUrl,
      params.likes,
      params.retweets,
      params.replies,
      params.views,
      params.followersAtTime,
    );
}

export function getLatestMetricByPost(scheduledPostId: string): MetricRow | undefined {
  return getDb()
    .prepare(
      "SELECT * FROM post_metrics WHERE scheduled_post_id = ? ORDER BY collected_at DESC LIMIT 1",
    )
    .get(scheduledPostId) as MetricRow | undefined;
}

export function getPostsNeedingMetrics(): { id: string; tweet_url: string }[] {
  return getDb()
    .prepare(`
      SELECT sp.id, sp.tweet_url
      FROM scheduled_posts sp
      WHERE sp.status = 'posted'
        AND sp.tweet_url IS NOT NULL
        AND (
          NOT EXISTS (SELECT 1 FROM post_metrics pm WHERE pm.scheduled_post_id = sp.id)
          OR (SELECT MAX(collected_at) FROM post_metrics pm WHERE pm.scheduled_post_id = sp.id) < datetime('now', '-24 hours')
        )
      ORDER BY sp.run_at DESC
      LIMIT 20
    `)
    .all() as { id: string; tweet_url: string }[];
}

export type MetricsDashboardData = {
  totalPosts: number;
  totalLikes: number;
  totalRetweets: number;
  totalViews: number;
  bestPost: { body: string; likes: number; views: number; run_at: string } | null;
  posts: (ScheduledPostRow & { latestMetric: MetricRow | null })[];
};

export function getMetricsDashboard(): MetricsDashboardData {
  const db = getDb();

  const postedPosts = db
    .prepare("SELECT * FROM scheduled_posts WHERE status = 'posted' ORDER BY run_at DESC LIMIT 50")
    .all() as ScheduledPostRow[];

  let totalLikes = 0;
  let totalRetweets = 0;
  let totalViews = 0;
  let bestPost: MetricsDashboardData["bestPost"] = null;

  const posts = postedPosts.map((post) => {
    const metric = db
      .prepare("SELECT * FROM post_metrics WHERE scheduled_post_id = ? ORDER BY collected_at DESC LIMIT 1")
      .get(post.id) as MetricRow | undefined;

    if (metric) {
      totalLikes += metric.likes;
      totalRetweets += metric.retweets;
      totalViews += metric.views;
      if (!bestPost || metric.likes > bestPost.likes) {
        bestPost = { body: post.body, likes: metric.likes, views: metric.views, run_at: post.run_at };
      }
    }

    return { ...post, latestMetric: metric ?? null };
  });

  return {
    totalPosts: postedPosts.length,
    totalLikes,
    totalRetweets,
    totalViews,
    bestPost,
    posts,
  };
}
