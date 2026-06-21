export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        flexDirection: "column",
        gap: 16,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          background: "linear-gradient(135deg, #7c3aed, #c084fc)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          boxShadow: "0 0 24px rgba(124,58,237,0.3)",
        }}
      >
        ⚡
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Kairo Admin
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            maxWidth: 360,
            lineHeight: 1.7,
          }}
        >
          Access the admin panel at{" "}
          <code
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              padding: "2px 7px",
              borderRadius: 5,
              fontSize: 13,
            }}
          >
            /admin/{"<your-secret-key>"}/dashboard
          </code>
        </div>
      </div>
    </div>
  );
}
