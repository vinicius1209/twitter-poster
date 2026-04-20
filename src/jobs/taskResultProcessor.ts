import { randomUUID } from "node:crypto";
import type { AgentTask, ExtractedTweet } from "../shared/types.js";
import { insertEvents } from "../db/repositories/events.repo.js";
import { markScheduledPosted, markScheduledFailed, updateScheduledTweetUrl } from "../db/repositories/scheduled.repo.js";
import { updateDraftStatus } from "../db/repositories/drafts.repo.js";
import { insertMetric } from "../db/repositories/metrics.repo.js";

/**
 * Processa o resultado de uma task completada pelo agent.
 * Escreve os dados no Supabase conforme o tipo da task.
 */
export async function processTaskResult(task: AgentTask): Promise<void> {
  const result = task.result;
  if (!result) return;

  switch (task.type) {
    case "collect_likes": {
      const tweets = (result.tweets ?? []) as ExtractedTweet[];
      await insertEvents("likes", tweets, "like", task.user_id ?? undefined);
      break;
    }

    case "collect_profile": {
      const tweets = (result.tweets ?? []) as ExtractedTweet[];
      const handle = (task.payload.handle as string) ?? "unknown";
      await insertEvents(`profile:${handle}`, tweets, "view", task.user_id ?? undefined);
      break;
    }

    case "publish_post": {
      const scheduledPostId = task.payload.scheduledPostId as string | undefined;
      const draftId = task.payload.draftId as string | undefined;
      const ok = result.ok as boolean;
      const tweetUrl = result.tweetUrl as string | undefined;
      const error = result.error as string | undefined;

      if (scheduledPostId) {
        if (ok) {
          await markScheduledPosted(scheduledPostId);
          if (tweetUrl) await updateScheduledTweetUrl(scheduledPostId, tweetUrl);
        } else {
          await markScheduledFailed(scheduledPostId, error ?? "Agent failed");
        }
      }
      if (draftId && ok) {
        await updateDraftStatus(draftId, "posted", new Date().toISOString());
      }
      break;
    }

    case "collect_metrics": {
      const metrics = (result.metrics ?? []) as {
        postId: string; tweetUrl: string;
        likes: number; retweets: number; replies: number; views: number;
        followersAtTime: number | null;
      }[];
      for (const m of metrics) {
        await insertMetric({
          id: randomUUID(),
          scheduledPostId: m.postId,
          tweetUrl: m.tweetUrl,
          likes: m.likes, retweets: m.retweets,
          replies: m.replies, views: m.views,
          followersAtTime: m.followersAtTime,
          userId: task.user_id ?? undefined,
        });
      }
      break;
    }

    case "check_session":
      // Resultado armazenado na task — frontend lê via getTask()
      break;
  }
}
