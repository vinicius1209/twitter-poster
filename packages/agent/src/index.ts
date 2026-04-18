// Re-exports do browser layer (src/browser/)
export { collectLikes, collectFromProfile } from "../../../src/browser/collect.js";
export type { ExtractedTweet, CollectLimits } from "../../../src/browser/collect.js";

export { postTweetViaUi } from "../../../src/browser/post.js";
export type { PostResult } from "../../../src/browser/post.js";

export { checkSessionHealth, evaluateLogin } from "../../../src/browser/healthcheck.js";
export type { SessionHealth, PageSignals } from "../../../src/browser/healthcheck.js";

export { getPersistentContext, closePersistentContext, getBrowserProfilePath } from "../../../src/browser/session.js";

export { enqueue } from "../../../src/browser/queue.js";
export { selectors } from "../../../src/browser/selectors.js";
