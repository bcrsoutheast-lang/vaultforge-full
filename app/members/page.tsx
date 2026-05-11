"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function metadataOf(member: Member) {
  return typeof member?.metadata === "object" && member.metadata ? member.metadata : {};
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(clean).filter(Boolean);
  return [];
}

function memberEmail(member: Member) {
  return cleanEmail(member.email || member.member_email || metadataOf(member).email);
}

function memberName(member: Member) {
  const metadata = metadataOf(member);
  return clean(member.full_name || member.name || member.display_name || metadata.name || memberEmail(member) || "VaultForge Member");
}

function company(member: Member) {
  const metadata = metadataOf(member);
  return clean(member.company || member.company_name || metadata.company || "VaultForge Network");
}

function photo(member: Member) {
  const metadata = metadataOf(member);
  return clean(member.profile_photo_url || member.photo_url || member.avatar_url || metadata.profile_photo_url || metadata.photo_url);
}

function memberTypes(member: Member) {
  const metadata = metadataOf(member);
  return arr(member.member_types || member.member_type || member.roles || metadata.member_types);
}

function markets(member: Member) {
  const metadata = metadataOf(member);
  return arr(member.markets || member.states || member.operating_states || metadata.markets);
}

function strategies(member: Member) {
  const metadata = metadataOf(member);
  return arr(member.strategies || member.strategy || metadata.strategies);
}

function canProvide(member: Member) {
  const metadata = metadataOf(member);
  return arr(member.can_provide || metadata.can_provide);
}

function isNetworkAccepted(member: Member) {
  const metadata = metadataOf(member);
  return Boolean(member.network_accepted || member.accepted_to_network || member.available_to_network || metadata.network_accepted || metadata.accepted_to_network);
}

function routingScore(member: Member) {
  const direct = Number(member.routing_score || metadataOf(member).routing_score);
  if (Number.isFinite(direct) && direct > 0) return Math.min(100, Math.round(direct));

  let score = 45;
  if (memberTypes(member).length) score += 10;
  if (markets(member).length) score += 10;
  if (strategies(member).length) score += 10;
  if (canProvide(member).length) score += 10;
  if (photo(member)) score += 5;
  if (isNetworkAccepted(member)) score += 10;
  return Math.min(100, score);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,.26)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
};

export default function MembersPage() {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState("Loading members...");
  const [search, setSearch] = useState("");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading members...");

    try {
      const urls = [
        `/api/admin/members?email=${encodeURIComponent(viewer)}&owner=1`,
        `/api/profile?email=${encodeURIComponent(viewer)}`,
      ];

      const collected: Member[] = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store", headers: { "x-vf-email": viewer, "x-vf-admin": "1" } });
          const data = await safeJson(res);

          if (Array.isArray(data.members)) collected.push(...data.members);
          if (Array.isArray(data.profiles)) collected.push(...data.profiles);
          if (data.profile) collected.push(data.profile.raw || data.profile);
        } catch {
          // Keep loading other sources.
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((member) => {
        const key = memberEmail(member) || clean(member.id);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setMembers(unique);
      setStatus(unique.length ? "" : "No members found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load members.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;

    return members.filter((member) =>
      [
        memberName(member),
        company(member),
        memberEmail(member),
        memberTypes(member).join(" "),
        markets(member).join(" "),
        strategies(member).join(" "),
        canProvide(member).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [members, search]);

  return (
    <main style={page}>
      <style>{`
        button:hover, a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/dashboard" style={{ color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em" }}>
            VAULTFORGE
          </Link>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/profile" style={ghost}>Profile</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </nav>

        <section style={card}>
          <p style={eyebrow}>VaultForge Network</p>
          <h1 style={{ fontSize: "clamp(50px,10vw,92px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Member command directory.
          </h1>
          <p style={{ ...muted, fontSize: 18 }}>
            Member contact now uses the same controlled communication style as Pain, Alerts, Activity, Routing, and Introductions.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Members: {members.length}</span>
            <span style={chip}>Network accepted: {members.filter(isNetworkAccepted).length}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={load} style={button}>Refresh Members</button>
            <Link href="/profile" style={ghost}>Edit Profile</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
          </div>
        </section>

        <section style={card}>
          <p style={eyebrow}>Search Network</p>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members, markets, roles, strategies..." style={input} />
        </section>

        {status ? <section style={card}>{status}</section> : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 16 }}>
          {filtered.map((member) => {
            const mEmail = memberEmail(member);
            const mPhoto = photo(member);
            const accepted = isNetworkAccepted(member);

            return (
              <article key={mEmail || clean(member.id)} style={card}>
                {mPhoto ? (
                  <div style={{ borderRadius: 24, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)", marginBottom: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mPhoto} alt={memberName(member)} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={eyebrow}>{accepted ? "Network Accepted" : "Member Profile"}</p>
                    <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 8px" }}>{memberName(member)}</h2>
                    <strong>{company(member)}</strong>
                    <p style={muted}>{mEmail}</p>
                  </div>
                  <div style={{ width: 78, height: 78, borderRadius: 24, display: "grid", placeItems: "center", border: "1px solid rgba(232,196,107,.32)", background: "rgba(232,196,107,.08)" }}>
                    <strong style={{ fontSize: 30 }}>{routingScore(member)}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  {[...memberTypes(member), ...markets(member), ...strategies(member)].slice(0, 12).map((item) => (
                    <span key={item} style={chip}>{item}</span>
                  ))}
                </div>

                {canProvide(member).length ? (
                  <div style={{ marginTop: 10 }}>
                    <p style={eyebrow}>Can Provide</p>
                    {canProvide(member).slice(0, 10).map((item) => (
                      <span key={item} style={chip}>{item}</span>
                    ))}
                  </div>
                ) : null}

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  {mEmail ? (
                    <Link href={`/connect-member/${encodeURIComponent(mEmail)}`} style={button}>
                      Message / Request Connection
                    </Link>
                  ) : null}
                  <Link href="/messages" style={ghost}>Messages</Link>
                  <Link href="/routing-inbox" style={ghost}>Route / Match</Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
