/**
 * Preview de tweet no estilo visual do X/Twitter.
 * Thread: cards com linha vertical conectando os avatares (como no X real).
 */

type Props = {
  body: string;
  handle?: string;
  displayName?: string;
  isThread?: boolean;
};

export function TweetPreview({ body, handle = "you", displayName = "You", isThread = false }: Props) {
  const posts = isThread ? body.split(/\n---\n/).filter(p => p.trim()) : [body];

  return (
    <div style={{
      background: "#000",
      border: "1px solid #2f3336",
      borderRadius: "16px",
      overflow: "hidden",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {posts.map((post, i) => {
        const isLast = i === posts.length - 1;
        const showConnector = !isLast && posts.length > 1;
        const charCount = post.trim().length;

        return (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderTop: i > 0 ? "1px solid #2f3336" : undefined,
              display: "flex",
              gap: "12px",
            }}
          >
            {/* Avatar column with connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: "0.85rem",
              }}>
                {displayName[0]?.toUpperCase() ?? "?"}
              </div>
              {showConnector && (
                <div style={{
                  width: 2, flex: 1, minHeight: 12,
                  background: "#333639", marginTop: 4,
                }} />
              )}
            </div>

            {/* Content column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                <span style={{ color: "#e7e9ea", fontWeight: 700, fontSize: "0.94rem" }}>
                  {displayName}
                </span>
                <span style={{ color: "#71767b", fontSize: "0.84rem" }}>
                  @{handle}
                </span>
                {posts.length > 1 && (
                  <span style={{
                    marginLeft: "auto", fontSize: "0.7rem", color: "#71767b",
                    background: "#1d1f23", padding: "1px 6px", borderRadius: "10px",
                  }}>
                    {i + 1}/{posts.length}
                  </span>
                )}
              </div>

              {/* Body */}
              <div style={{
                color: "#e7e9ea",
                fontSize: "0.94rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {post.trim()}
              </div>

              {/* Char counter */}
              <div style={{
                fontSize: "0.7rem", color: charCount > 280 ? "#f4212e" : "#71767b",
                textAlign: "right", marginTop: "4px",
              }}>
                {charCount}/280
              </div>

              {/* Footer */}
              <div style={{
                display: "flex", gap: "40px", marginTop: "4px",
                color: "#71767b", fontSize: "0.82rem",
              }}>
                <span>💬</span>
                <span>🔄</span>
                <span>❤️</span>
                <span>📊</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
