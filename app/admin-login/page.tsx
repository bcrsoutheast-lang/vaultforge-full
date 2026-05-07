import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "34px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  background: "linear-gradient(145deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  boxShadow: "0 30px 90px rgba(0,0,0,.45)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "linear-gradient(135deg, rgba(181,92,255,.16), rgba(255,255,255,.07))",
  color: "white",
  padding: 15,
  fontSize: 17,
  marginTop: 8,
  marginBottom: 14,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#061120",
  border: "none",
  borderRadius: 999,
  padding: "14px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "7px 7px 0 0",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

async function loginAction(formData: FormData) {
  "use server";

  const email = cleanEmail(formData.get("email"));
  const passcode = String(formData.get("passcode") || "").trim();
  const expectedPasscode =
    process.env.VAULTFORGE_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    "";

  if (email !== OWNER_EMAIL) {
    redirect("/admin-login?error=email");
  }

  if (expectedPasscode && passcode !== expectedPasscode) {
    redirect("/admin-login?error=passcode");
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("vf_email", OWNER_EMAIL, {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });

  cookieStore.set("vf_member_login", "1", {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });

  cookieStore.set("vf_admin", "1", {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });

  cookieStore.set("isAdmin", "true", {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main style={shell}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input:focus {
          border-color: rgba(181,92,255,.45);
          box-shadow: 0 0 0 3px rgba(181,92,255,.14);
        }

        @media (max-width: 760px) {
          a,
          button,
          input {
            box-sizing: border-box;
          }
        }
      `}</style>
      <div style={wrap}>
        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Owner Access
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                border: "1px solid rgba(181,92,255,.36)",
                color: "#dcb8ff",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(181,92,255,.12)",
              }}
            >
              Owner Command Access
            </span>

            <span
              style={{
                border: "1px solid rgba(157,243,191,.36)",
                color: "#9df3bf",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(157,243,191,.10)",
              }}
            >
              Admin Control Layer
            </span>

            <span
              style={{
                border: "1px solid rgba(245,217,120,.36)",
                color: "#f5d978",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(245,217,120,.10)",
              }}
            >
              Bloomberg-Style Admin
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,88px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Admin login.
          </h1>

          <p style={{ ...muted, fontSize: 19 }}>
            Owner entry point for VaultForge admin control. This restores the admin route without touching member pages.
          </p>

          {error && (
            <div style={{ border: "1px solid rgba(255,120,120,.35)", background: "rgba(255,120,120,.08)", color: "#ffd0d0", borderRadius: 20, padding: 14, margin: "16px 0", fontWeight: 900 }}>
              {error === "passcode" ? "Admin passcode did not match." : "Only the owner email can access admin."}
            </div>
          )}

          <form action={loginAction}>
            <label style={{ fontWeight: 900 }}>Owner Email</label>
            <input name="email" type="email" defaultValue={OWNER_EMAIL} required style={input} />

            <label style={{ fontWeight: 900 }}>Admin Passcode</label>
            <input name="passcode" type="password" placeholder="Admin password" style={input} />

            <button type="submit" style={btn}>
              Enter Admin
            </button>

            <Link href="/login" style={ghost}>
              Member Login
            </Link>

            <Link href="/" style={ghost}>
              Home
            </Link>
          </form>

          <p style={{ ...muted, marginTop: 18, fontSize: 14 }}>
            If no admin password environment variable is configured, owner email login will still set the admin cookies.
          </p>
        </section>
      </div>
    </main>
  );
}