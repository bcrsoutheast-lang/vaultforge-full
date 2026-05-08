"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.20), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.14), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(232,196,107,.06), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
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
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
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
  cursor: "pointer",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function getEmail() {
  if (typeof window === "undefined") return OWNER_EMAIL;

  try {
    return (
      window.localStorage.getItem("vf_email") ||
      window.sessionStorage.getItem("vf_email") ||
      OWNER_EMAIL
    )
      .trim()
      .toLowerCase();
  } catch {
    return OWNER_EMAIL;
  }
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

function bucketTone(bucket: string) {
  const b = bucket.toLowerCase();
  if (b === "active") return "#9df3bf";
  if (b === "pending") return "#f5d978";
  if (b === "suspended" || b === "deleted") return "#ff9f9f";
  return "#dcb8ff";
}

function hasRealEmail(member: Member) {
  const email = cleanEmail(member.email || member.member_email);
  return email.includes("@") && !email.endsWith("@example.com");
}

function memberName(member: Member) {
  return asText(
    member.full_name || member.name || member.member_name || member.display_name,
    "Unnamed Member"
  );
}

function memberKey(member: Member) {
  return cleanEmail(member.email || member.member_email) || asText(member.id || member._source_id || member.auth_user_id);
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
  );
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("Loading real admin members...");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [rawSource, setRawSource] = useState("");

  async function load() {
    setStatus("Loading real admin members...");
    setToast("");

    try {
      const email = getEmail();

      const res = await fetch(`/api/admin/members?email=${encodeURIComponent(email)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": "1",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load admin members.");
      }

      setMembers(Array.isArray(data.members) ? data.members : []);
      setCounts(data.counts || {});
      setRawSource(data.source || data.sources_checked?.join(", ") || "api/admin/members");
      setStatus("");
    } catch (error: any) {
      setMembers([]);
      setCounts({});
      setStatus(error?.message || "Could not load real admin members.");
    }
  }

  async function memberAction(member: Member, action: string) {
    const email = cleanEmail(member.email || member.member_email);
    const id = asText(member.id || member._source_id || member.auth_user_id);
    const key = `${email || id}-${action}`;

    if (!email && !id) {
      setToast("Cannot update this record because it has no email or id.");
      return;
    }

    setBusyKey(key);
    setToast("");

    try {
      const adminEmail = getEmail();

      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": adminEmail,
          "x-vf-admin": "1",
        },
        body: JSON.stringify({ email, id, action, admin_email: adminEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Member action failed.");
      }

      setToast(data?.message || `Member ${action} complete.`);
      await load();
    } catch (error: any) {
      setToast(error?.message || "Member action failed.");
    } finally {
      setBusyKey("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const realMembers = useMemo(() => members.filter(hasRealEmail), [members]);
  const demoMembers = useMemo(() => members.filter((member) => !hasRealEmail(member)), [members]);

  const derivedCounts = useMemo(() => {
    return {
      total: realMembers.length,
      pending: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "pending").length,
      active: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "active").length,
      suspended: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "suspended").length,
      deleted: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "deleted").length,
      locked: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "locked").length,
    };
  }, [realMembers]);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Admin · Real Members Only</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Member activation console.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Demo members are hidden. This page only displays real records returned by <strong>/api/admin/members</strong>.
          </p>

          <Link href="/member-preview" style={btn}>Preview Members Area</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/profile" style={ghost}>Edit Profile / Alerts</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/logout" style={danger}>Logout</Link>
          <button type="button" onClick={load} style={btn}>Refresh Real Members</button>
        </section>

        {toast && (
          <section
            style={{
              ...hero,
              color:
                toast.toLowerCase().includes("failed") || toast.toLowerCase().includes("cannot")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            {toast}
          </section>
        )}

        <section style={{ ...grid, marginBottom: 22 }}>
          <StatCard label="Real Members" value={derivedCounts.total || Number(counts.total || 0)} detail="Real emails only. Demo @example.com hidden." />
          <StatCard label="Pending" value={derivedCounts.pending || Number(counts.pending || 0)} detail="Waiting activation or payment." />
          <StatCard label="Active" value={derivedCounts.active || Number(counts.active || 0)} detail="Approved/active members." />
          <StatCard label="Suspended" value={derivedCounts.suspended || Number(counts.suspended || 0)} detail="Disabled records." />
          <StatCard label="Deleted" value={derivedCounts.deleted || Number(counts.deleted || 0)} detail="Soft-deleted records." />
        </section>

        <section style={{ ...hero, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={greenEyebrow}>API Source</div>
          <p style={muted}>
            Source: {rawSource || "not loaded yet"}
            <br />
            Raw records returned: {members.length}
            <br />
            Demo/fake records hidden: {demoMembers.length}
          </p>
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && realMembers.length === 0 && (
          <section style={hero}>
            <strong>No real members found.</strong>
            <p style={muted}>
              If you created a new login and filled a profile, then the profile page is saving somewhere this API is not checking,
              or signup/profile completion is not writing email into a profile/member table.
            </p>
            <p style={muted}>
              Next file to fix is <strong>app/api/profile/route.ts</strong> so profile completion writes into the same source table admin reads.
            </p>
          </section>
        )}

        <section style={{ display: "grid", gap: 18 }}>
          {realMembers.map((member) => {
            const email = cleanEmail(member.email || member.member_email);
            const bucket = asText(member.admin_bucket, "locked");
            const tone = bucketTone(bucket);
            const key = memberKey(member);

            return (
              <article key={key} style={{ ...card, borderColor: `${tone}66` }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <span style={{ ...chip, color: tone, borderColor: `${tone}88` }}>{bucket}</span>
                  <span style={chip}>{asText(member._source_table, "unknown table")}</span>
                  <span style={chip}>Profile: {member.profile_complete ? "Complete" : "Incomplete"}</span>
                  <span style={chip}>Payment: {asText(member.payment_status, "unpaid")}</span>
                  <span style={chip}>Access: {asText(member.access_status, "locked")}</span>
                </div>

                <h2 style={{ fontSize: "clamp(30px,7vw,52px)", lineHeight: 1, margin: "0 0 10px" }}>
                  {memberName(member)}
                </h2>

                <p style={{ ...muted, fontSize: 18 }}>
                  <strong style={{ color: "#9df3bf" }}>{email}</strong>
                  <br />
                  ID: {asText(member.id || member._source_id || member.auth_user_id, "—")}
                  <br />
                  Created: {formatDate(member.created_at)}
                  <br />
                  Updated: {formatDate(member.updated_at)}
                </p>

                <div>
                  <button type="button" disabled={busyKey === `${email}-activate`} onClick={() => memberAction(member, "activate")} style={btn}>
                    Activate
                  </button>
                  <button type="button" disabled={busyKey === `${email}-mark_paid`} onClick={() => memberAction(member, "mark_paid")} style={btn}>
                    Mark Paid
                  </button>
                  <button type="button" disabled={busyKey === `${email}-mark_unpaid`} onClick={() => memberAction(member, "mark_unpaid")} style={ghost}>
                    Mark Unpaid
                  </button>
                  <button type="button" disabled={busyKey === `${email}-lock`} onClick={() => memberAction(member, "lock")} style={ghost}>
                    Lock
                  </button>
                  <button type="button" disabled={busyKey === `${email}-suspend`} onClick={() => memberAction(member, "suspend")} style={danger}>
                    Suspend
                  </button>
                  <button type="button" disabled={busyKey === `${email}-restore`} onClick={() => memberAction(member, "restore")} style={ghost}>
                    Restore
                  </button>
                  <button type="button" disabled={busyKey === `${email}-delete`} onClick={() => memberAction(member, "delete")} style={danger}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
