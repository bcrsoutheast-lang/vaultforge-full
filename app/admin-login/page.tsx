import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "34px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  background: "linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 26,
  boxShadow: "0 30px 90px rgba(0,0,0,.45)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
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
  background: "#f5d978",
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
  background: "rgba(255,255,255,.04)",
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
      <div style={wrap}>
        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Owner Access
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
