import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.30)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.14), rgba(157,243,191,.07), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(157,243,191,.06), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  margin: "7px 7px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
};

export default function MemberPreviewPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Admin Preview</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Members Area Preview.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            This preview does not require payment. Use it from Admin to inspect the member-side command center layout.
          </p>

          <Link href="/admin" style={ghost}>Back To Admin</Link>
          <Link href="/pain" style={btn}>Pain Feed</Link>
          <Link href="/routing" style={ghost}>Routing</Link>
          <Link href="/pain-messages" style={ghost}>Pain Messages</Link>
          <Link href="/messages" style={ghost}>Messages</Link>
        </section>

        <section style={grid}>
          <article style={card}>
            <div style={eyebrow}>Pain Button</div>
            <h2>Submit and route distress signals.</h2>
            <p style={muted}>Residential, commercial, land, photos, AI analysis, routing tags, and urgency.</p>
            <Link href="/pain-submit" style={btn}>Open Pain Button</Link>
          </article>

          <article style={card}>
            <div style={eyebrow}>Routing Brain</div>
            <h2>AI routing intelligence.</h2>
            <p style={muted}>Match scores, route explanations, urgency, operator/investor/lender/contractor fit.</p>
            <Link href="/routing" style={btn}>Open Routing</Link>
          </article>

          <article style={card}>
            <div style={eyebrow}>Messages</div>
            <h2>Execution conversations.</h2>
            <p style={muted}>Pain-specific threads and general member messages.</p>
            <Link href="/pain-messages" style={btn}>Open Pain Messages</Link>
          </article>

          <article style={card}>
            <div style={eyebrow}>Alerts</div>
            <h2>Signal notifications.</h2>
            <p style={muted}>Smart alerts and routing notifications for member activity.</p>
            <Link href="/alerts" style={btn}>Open Alerts</Link>
          </article>
        </section>
      </div>
    </main>
  );
}
