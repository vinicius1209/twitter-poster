/**
 * Centralização de seletores da UI web do X (podem quebrar com mudanças do site).
 */
export const selectors = {
  tweetArticle: 'article[data-testid="tweet"]',
  tweetText: '[data-testid="tweetText"]',
  userName: '[data-testid="User-Name"]',
  tweetLink: 'a[href*="/status/"]',
  sideNavAccountSwitcher: '[data-testid="SideNav_AccountSwitcher_Button"]',
  signInLink: 'a[href="/login"]',
  homeTimeline: '[data-testid="primaryColumn"]',
  /** Composer na home (quando logado) */
  draftEditor: '[data-testid="tweetTextarea_0"]',
  postButton: '[data-testid="tweetButtonInline"], [data-testid="tweetButton"]',

  // ── Métricas (página de detalhe do tweet e perfil) ──
  /** Botão de like — aria-label contém o número ex: "123 Likes" */
  likeButton: '[data-testid="like"]',
  unlikeButton: '[data-testid="unlike"]',
  /** Botão de retweet */
  retweetButton: '[data-testid="retweet"]',
  /** Botão de reply */
  replyButton: '[data-testid="reply"]',
  /** Link de analytics do tweet (contém views) */
  analyticsLink: 'a[href$="/analytics"]',
  /** Contadores de seguidores no perfil */
  followersLink: 'a[href$="/verified_followers"]',
} as const;
