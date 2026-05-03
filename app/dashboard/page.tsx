import Link from "next/link";
import { cookies } from "next/headers";

export default function Dashboard() {
  const user = cookies().get("vf_user")?.value;

  if (!user) {
    return <div style={{ padding: 40 }}>Not logged in</div>;
  }

  return (
    <main style={{ minHeight: "100vh", background: "#071326", color: "white", padding: 28, fontFamily: "Arial" }}>
      <section style={{ border: "1px solid rgba(255,255,255,.2)", borderRadius: 24, padding: 28, background: "rgba(255,255,255,.05)", marginBottom: 24 }}>
        <p style={{ color: "#9ff3c6", letterSpacing: 3, fontSize: 13, fontWeight: 700 }}>VAULTFORGE MEMBER AREA</p>
        <h1 style={{ fontSize: 48, margin: "10px 0" }}>Dashboard</h1>
        <p style={{ color: "#cbd5e1", fontSize: 20 }}>Logged in as {user}</p>
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        <Link href="/submit"><button style={button}>Create Deal</button></Link>
        <Link href="/projects"><button style={button}>Projects</button></Link>
        <Link href="/buy-bucket"><button style={button}>Buy Bucket</button></Link>
        <Link href="/network"><button style={button}>Network</button></Link>
      </section>
    </main>
  );
}

const button = {
  width: "100%",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 18,
  padding: "18px 20px",
  background: "rgba(255,255,255,.06)",
  color: "white",
  fontSize: 22,
  textAlign: "left" as const,
};
