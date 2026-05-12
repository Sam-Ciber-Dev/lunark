export const metadata = { title: "404 — Not Found" };

// Mirrors the look of a stock browser/Next.js 404 page: deliberately minimal,
// no Navbar, no Footer, no Lunark branding. A device that has been blocked
// (manually by an admin or automatically by the threat-detection system)
// should not be aware that the site even exists.
export default function BlockedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 500,
            margin: 0,
            padding: "0 24px 0 0",
            borderRight: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          404
        </h1>
        <p style={{ fontSize: "14px", margin: 0, opacity: 0.8 }}>
          This page could not be found.
        </p>
      </div>
    </div>
  );
}
