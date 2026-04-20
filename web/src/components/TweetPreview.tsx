/**
 * Preview de tweet no estilo visual do X/Twitter.
 * Mostra como o post ficaria publicado.
 */

type Props = {
  body: string;
  handle?: string;
  displayName?: string;
  isThread?: boolean;
};

export function TweetPreview({ body, handle = "you", displayName = "You", isThread = false }: Props) {
  const posts = isThread ? body.split(/\n---\n/) : [body];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {posts.map((post, i) => (
        <div
          key={i}
          style={{
            background: "#000",
            border: "1px solid #2f3336",
            borderTop: i > 0 ? "none" : undefined,
            borderRadius: i === 0 && posts.length > 1 ? "16px 16px 0 0" : i === posts.length - 1 && posts.length > 1 ? "0 0 16px 16px" : posts.length === 1 ? "16px" : "0",
            padding: "12px 16px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "0.85rem",
              flexShrink: 0,
            }}>
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#e7e9ea", fontWeight: 700, fontSize: "0.94rem" }}>
                {displayName}
              </span>
              <span style={{ color: "#71767b", fontSize: "0.84rem" }}>
                @{handle}
              </span>
            </div>
            {isThread && posts.length > 1 && (
              <span style={{
                marginLeft: "auto", fontSize: "0.72rem", color: "#71767b",
                background: "#1d1f23", padding: "2px 8px", borderRadius: "12px",
              }}>
                {i + 1}/{posts.length}
              </span>
            )}
          </div>

          {/* Thread connector line */}
          {i < posts.length - 1 && posts.length > 1 && (
            <div style={{
              position: "relative",
            }}>
              <div style={{
                position: "absolute", left: 19, bottom: -12, width: 2, height: 12,
                background: "#333639",
              }} />
            </div>
          )}

          {/* Body */}
          <div style={{
            color: "#e7e9ea",
            fontSize: "0.94rem",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginTop: "4px",
          }}>
            {post.trim()}
          </div>

          {/* Footer — engagement mockup */}
          <div style={{
            display: "flex", gap: "48px", marginTop: "12px", paddingTop: "4px",
          }}>
            {[
              { icon: "💬", label: "Reply" },
              { icon: "🔄", label: "Repost" },
              { icon: "❤️", label: "Like" },
              { icon: "📊", label: "View" },
            ].map((a) => (
              <span key={a.label} style={{ color: "#71767b", fontSize: "0.8rem", cursor: "default" }}>
                {a.icon}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
