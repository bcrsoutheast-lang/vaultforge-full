
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CommandNavigationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(178,24,24,.22), transparent 28%), radial-gradient(circle at 85% 10%, rgba(232,196,107,.16), transparent 24%), linear-gradient(180deg,#020202 0%,#070707 55%,#020202 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "24px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="All Member Pages"
          subtitle="Use this page when you need to move around the member area fast"
        />

        <section
          style={{
            border: "1px solid rgba(232,196,107,.14)",
            borderRadius: 30,
            padding: 24,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015))",
          }}
        >
          <div
            style={{
              color: "#d33a2c",
              letterSpacing: 4,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            NAVIGATION CONTROL
          </div>

          <h1
            style={{
              margin: "0 0 14px",
              fontSize: "clamp(36px,7vw,72px)",
              lineHeight: .95,
              letterSpacing: -2,
            }}
          >
            One place to jump anywhere inside VaultForge.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 20,
              lineHeight: 1.6,
              maxWidth: 900,
            }}
          >
            This page exists so the member area is never hard to navigate while
            we finish wiring the same navigation into every active member page.
          </p>
        </section>
      </div>
    </main>
  );
}
