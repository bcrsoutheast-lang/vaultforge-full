import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "40px 18px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 520,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 30,
  padding: 30,
  background: "rgba(255,255,255,.04)",
};

const input: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  borderRadius: 18,
  padding: "16px",
  fontSize: 18,
  marginBottom: 18,
};

const button: React.CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 999,
  background: "#f1d874",
  color: "#071326",
  padding: "18px",
  fontWeight: 900,
  fontSize: 20,
  cursor: "pointer",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <main style={shell}>
      <div style={wrap}>
        <div style={card}>
          <div
            style={{
              letterSpacing: 6,
              color: "#f1d874",
              fontWeight: 900,
              marginBottom: 16,
            }}
          >
            VAULTFORGE ACCESS
          </div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,88px)",
              lineHeight: 0.92,
              margin: "0 0 20px",
            }}
          >
            Member Login
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.7)",
              fontSize: 20,
              lineHeight: 1.5,
              marginBottom: 28,
            }}
          >
            Secure access to the VaultForge member command center.
          </p>

          {error && (
            <div
              style={{
                marginBottom: 18,
                padding: 16,
                borderRadius: 18,
                background: "rgba(255,0,0,.12)",
                border: "1px solid rgba(255,0,0,.25)",
                color: "#ffb5b5",
              }}
            >
              Login failed. Check your credentials and try again.
            </div>
          )}

          <form method="POST" action="/api/member/login">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              style={input}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              style={input}
            />

            <button type="submit" style={button}>
              Access VaultForge
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <Link
              href="/"
              style={{
                color: "#9df3bf",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              ← Back Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
