import Link from "next/link";

export default function AdminRecoveryPage() {
  const page = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
    color: "#f7f8ff",
    padding: "28px 20px 90px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as const;

  const shell = { maxWidth: 1040, margin: "0 auto" } as const;

  const card = {
    border: "1px solid rgba(245,197,66,.42)",
    borderRadius: 26,
    background:
      "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
    padding: 26,
    marginBottom: 20,
  } as const;

  const panel = {
    border: "1px solid rgba(207,216,230,.16)",
    borderRadius: 24,
    background: "rgba(15,21,34,.88)",
    padding: 22,
    marginBottom: 18,
  } as const;

  const nav = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
  };

  const brand = {
    color: "#ffda5e",
    fontWeight: 1000,
    fontSize: 28,
    letterSpacing: "-.04em",
    marginRight: 10,
  } as const;

  const button = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: "1px solid rgba(207,216,230,.18)",
    background: "rgba(18,24,38,.92)",
    color: "#f7f8ff",
    padding: "12px 18px",
    fontWeight: 900,
    textDecoration: "none",
  } as const;

  const goldButton = {
    ...button,
    background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
    color: "#080a10",
    border: "1px solid rgba(255,220,90,.65)",
  } as const;

  const redButton = {
    ...button,
    background: "rgba(90,10,18,.72)",
    color: "#ffb2b2",
    border: "1px solid rgba(255,65,65,.65)",
  } as const;

  const eyebrow = {
    color: "#ffda5e",
    textTransform: "uppercase" as const,
    letterSpacing: ".34em",
    fontSize: 12,
    fontWeight: 1000,
  };

  const h1 = {
    fontSize: "clamp(42px,7vw,82px)",
    lineHeight: ".92",
    letterSpacing: "-.08em",
    margin: "12px 0",
    fontWeight: 1000,
  } as const;

  const h2 = {
    fontSize: "clamp(30px,4.5vw,54px)",
    lineHeight: ".95",
    letterSpacing: "-.065em",
    margin: "10px 0",
    fontWeight: 1000,
  } as const;

  const sub = {
    color: "rgba(235,240,255,.78)",
    fontSize: 20,
    lineHeight: 1.45,
    margin: "8px 0",
  } as const;

  const muted = {
    color: "rgba(235,240,255,.68)",
    fontSize: 15,
    lineHeight: 1.45,
    margin: "6px 0",
  } as const;

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
  } as const;

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={button}>Home</Link>
          <Link href="/command" style={goldButton}>Command</Link>
          <Link href="/investor-room" style={button}>Investor Room</Link>
          <Link href="/my-rooms" style={button}>My Rooms</Link>
          <Link href="/messages" style={button}>Messages</Link>
          <Link href="/logout" style={redButton}>Logout</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>VaultForge Admin Recovery</div>
          <h1 style={h1}>Admin route restored.</h1>
          <p style={sub}>
            This page is a safe recovery version so production can build again. It removes the bad revalidate export that was blocking the whole deployment.
          </p>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Current Safe Links</div>
          <h2 style={h2}>Use working rooms while admin is rebuilt.</h2>
          <p style={sub}>
            Admin controls should be rebuilt later from the real source of truth. This file exists only to stop /admin from killing production deploys.
          </p>

          <div style={grid}>
            <Link href="/command" style={goldButton}>Open Command</Link>
            <Link href="/investor-room" style={button}>Open Investor Room</Link>
            <Link href="/my-rooms" style={button}>Open My Rooms</Link>
            <Link href="/member-controlled-threads" style={button}>Open Controlled Threads</Link>
            <Link href="/messages" style={button}>Open Messages</Link>
            <Link href="/members" style={button}>Open Members</Link>
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Do Not Touch During Recovery</div>
          <p style={muted}>
            No revalidate export. No dynamic export. No client state. No localStorage. No nested modal. No payment alert experiment. This is intentionally simple so the build turns green.
          </p>
        </section>
      </div>
    </main>
  );
}
