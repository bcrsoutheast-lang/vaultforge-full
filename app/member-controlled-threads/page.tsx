"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function currentEmail() {
  const profile = readJson<any>("vaultforge_profile", {});
  return String(
    profile?.email ||
      localStorage.getItem("vf_email") ||
      localStorage.getItem("member_email") ||
      localStorage.getItem("email") ||
      ""
  )
    .trim()
    .toLowerCase();
}

function readThreads() {
  const rows = readJson<any[]>(CONTROLLED_THREADS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function assignedEmails(thread: any) {
  const out = new Set<string>();
  const direct = [thread?.memberEmail, thread?.assignedMemberEmail, thread?.assignedToEmail];
  direct.forEach((value) => {
    const clean = String(value || "").trim().toLowerCase();
    if (clean) out.add(clean);
  });
  const lists = [thread?.assignedMemberEmails, thread?.assignedToEmails, thread?.memberEmails];
  lists.forEach((list) => {
    if (Array.isArray(list)) list.forEach((value) => {
      const clean = String(value || "").trim().toLowerCase();
      if (clean) out.add(clean);
    });
  });
  const members = [...(Array.isArray(thread?.routedMembers) ? thread.routedMembers : []), ...(Array.isArray(thread?.assignedMembers) ? thread.assignedMembers : [])];
  members.forEach((member) => {
    const clean = String(member?.email || "").trim().toLowerCase();
    if (clean) out.add(clean);
  });
  return Array.from(out);
}

function writeThreads(rows: any[]) {
  writeJson(CONTROLLED_THREADS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-controlled-thread-change"));
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 100 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 24,
  padding: 22,
};
const goldPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(245,197,66,.48)",
  boxShadow: "0 0 26px rgba(245,197,66,.10)",
};
const redPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(255,70,70,.52)",
  boxShadow: "0 0 26px rgba(255,70,70,.10)",
};
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: .96, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 26, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(207,216,230,.18)",
  background: "#111823",
  color: "#f8fafc",
  borderRadius: 16,
  padding: "14px 15px",
  fontSize: 16,
};

function InvestorProfileCard({ profile, photoUrl, released }: { profile: any; photoUrl?: string; released: boolean }) {
  const investorTypes = Array.isArray(profile?.investorTypes) ? profile.investorTypes.join(" • ") : profile?.investorTypes || "Not listed";
  const strategies = Array.isArray(profile?.buyingStrategies) ? profile.buyingStrategies.join(" • ") : profile?.buyingStrategies || "Not listed";
  const markets = Array.isArray(profile?.statesInterested) ? profile.statesInterested.join(" • ") : profile?.statesInterested || "Not listed";

  return (
    <div style={panel}>
      <div style={eyebrow}>Investor Profile Attached</div>
      <div style={{ ...row, alignItems: "flex-start" }}>
        {photoUrl || profile?.photoUrl ? (
          <img
            src={photoUrl || profile?.photoUrl}
            alt="Investor"
            style={{
              width: 92,
              height: 92,
              objectFit: "cover",
              borderRadius: 22,
              border: "1px solid rgba(245,197,66,.35)",
            }}
          />
        ) : null}

        <div>
          <h3 style={h3}>{profile?.contactName || "Investor name hidden/not listed"}</h3>
          <p style={muted}>{profile?.company || "Company not listed"}</p>
          <p style={muted}>Type: {investorTypes}</p>
          <p style={muted}>Strategy: {strategies}</p>
          <p style={muted}>Markets: {markets}</p>
          <p style={muted}>Buy Box: {profile?.minDeal || "Not listed"} - {profile?.maxDeal || "Not listed"}</p>
          <p style={muted}>Volume: {profile?.monthlyVolume || "Not listed"} / month • {profile?.yearlyVolume || "Not listed"} / year</p>
          <p style={muted}>Proof of Funds: {profile?.proofFunds || "Not listed"}</p>
          <p style={muted}>Close Speed: {profile?.closeSpeed || "Not listed"}</p>

          <div style={{ ...panel, marginTop: 14 }}>
            <div style={eyebrow}>{released ? "Contact Released" : "Contact Hidden"}</div>
            {released ? (
              <>
                <p style={muted}>Email: {profile?.email || "Not listed"}</p>
                <p style={muted}>Phone: {profile?.phone || "Not listed"}</p>
                <p style={muted}>Website: {profile?.website || "Not listed"}</p>
              </>
            ) : (
              <p style={muted}>
                Contact stays hidden until you/admin approve release. This keeps VaultForge controlled and private.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadCard({
  thread,
  onPatch,
}: {
  thread: any;
  onPatch: (patch: any) => void;
}) {
  const [reply, setReply] = useState("");
  const profile = thread.investorProfile || {};

  function addReply() {
    if (!reply.trim()) return;

    const message = {
      id: `thread-message-${Date.now()}`,
      from: "Member",
      role: "member",
      body: reply,
      createdAt: new Date().toISOString(),
    };

    onPatch({
      status: "member_replied",
      stage: "member_review_active",
      messages: [...(thread.messages || []), message],
      updatedAt: new Date().toISOString(),
    });

    setReply("");
  }

  return (
    <div style={goldPanel}>
      <div style={eyebrow}>{thread.status || "approved"} • {thread.stage || "controlled intro"}</div>
      <h2 style={h2}>{thread.title || "Controlled Investor Thread"}</h2>
      <p style={sub}>{thread.roomHeader || "Approved investor request"}</p>
      <p style={muted}>Source: {thread.source || "request"} • State: {thread.state || "not listed"}</p>
      {(thread.routedMembers || thread.assignedMembers || []).length ? (
        <div style={{ ...panel, marginTop: 14 }}>
          <div style={eyebrow}>Why this reached you</div>
          {(thread.routedMembers || thread.assignedMembers || []).map((member: any) => (
            <p key={member.email || member.id} style={muted}>{member.name || "Member"} • {member.company || "Company"} • {member.memberType || "Role"} • Match: {member.matchReason || "network fit"}</p>
          ))}
        </div>
      ) : null}

      <div style={{ ...grid, marginTop: 16 }}>
        <InvestorProfileCard profile={profile} photoUrl={thread.investorPhotoUrl} released={Boolean(thread.contactReleased)} />

        <div style={panel}>
          <div style={eyebrow}>Thread Controls</div>
          <p style={muted}>Review the investor profile before releasing contact or continuing conversation.</p>

          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={goldBtn} onClick={() => onPatch({ status: "reviewing", stage: "member_reviewing", updatedAt: new Date().toISOString() })}>
              Mark Reviewing
            </button>
            <button type="button" style={goldBtn} onClick={() => onPatch({ contactReleased: true, status: "contact_released", stage: "contact_released", updatedAt: new Date().toISOString() })}>
              Release Contact
            </button>
            <button type="button" style={btn} onClick={() => onPatch({ status: "saved", stage: "saved", updatedAt: new Date().toISOString() })}>
              Save
            </button>
            <button type="button" style={btn} onClick={() => onPatch({ status: "archived", stage: "archived", updatedAt: new Date().toISOString() })}>
              Archive
            </button>
            <button type="button" style={redBtn} onClick={() => onPatch({ status: "declined", stage: "member_declined", updatedAt: new Date().toISOString() })}>
              Decline
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...panel, marginTop: 16 }}>
        <div style={eyebrow}>Messages</div>
        {(thread.messages || []).length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {(thread.messages || []).map((message: any) => (
              <div key={message.id} style={panel}>
                <p style={muted}>{message.from || message.role || "System"} • {message.createdAt || ""}</p>
                <p style={sub}>{message.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={muted}>No messages yet.</p>
        )}

        <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
          <span style={eyebrow}>Member Reply</span>
          <textarea
            style={{ ...input, minHeight: 130 }}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Reply without revealing direct contact unless approved..."
          />
        </label>

        <div style={{ ...row, marginTop: 12 }}>
          <button type="button" style={goldBtn} onClick={addReply}>Send Reply</button>
        </div>
      </div>
    </div>
  );
}

export default function MemberControlledThreadsPage() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<any[]>([]);

  function refresh() {
    setEmail(currentEmail());
    setThreads(readThreads());
  }

  useEffect(() => {
    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-controlled-thread-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-controlled-thread-change", refresh);
    };
  }, []);

  const visibleThreads = useMemo(() => {
    const admin = email === OWNER_EMAIL;
    if (admin) return threads;

    return threads.filter((thread) => {
      const assigned = assignedEmails(thread);
      return !assigned.length || assigned.includes(email);
    });
  }, [threads, email]);

  const activeThreads = visibleThreads.filter((thread) => !["archived", "declined", "deleted"].includes(String(thread.status || "").toLowerCase()));
  const savedThreads = visibleThreads.filter((thread) => String(thread.status || "").toLowerCase() === "saved");
  const archivedThreads = visibleThreads.filter((thread) => String(thread.status || "").toLowerCase() === "archived");
  const declinedThreads = visibleThreads.filter((thread) => String(thread.status || "").toLowerCase() === "declined");

  function patchThread(id: string, patch: any) {
    const next = threads.map((thread) => (thread.id === id ? { ...thread, ...patch } : thread));
    setThreads(next);
    writeThreads(next);
    window.dispatchEvent(new Event("vaultforge-controlled-thread-change"));
  }

  return (
    <main style={pageStyle}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Member Controlled Threads</div>
          <h1 style={h1}>Investor requests routed to members.</h1>
          <p style={sub}>
            Review investor profiles, keep contact hidden, reply inside controlled threads, and release contact only when approved.
          </p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/command" style={goldBtn}>Member Command</Link>
            <Link href="/message-command" style={btn}>Message Command</Link>
            <Link href="/investor-room" style={btn}>Investor Room</Link>
            <Link href="/admin" style={btn}>Admin</Link>
          </div>

          <p style={muted}>Detected member/admin email: {email || "not detected"}</p>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div style={grid}>
            <div style={goldPanel}><div style={eyebrow}>Active Threads</div><h2 style={h2}>{activeThreads.length}</h2><p style={muted}>approved investor requests</p></div>
            <div style={panel}><div style={eyebrow}>Saved</div><h2 style={h2}>{savedThreads.length}</h2><p style={muted}>saved threads</p></div>
            <div style={panel}><div style={eyebrow}>Archived</div><h2 style={h2}>{archivedThreads.length}</h2><p style={muted}>archived threads</p></div>
            <div style={redPanel}><div style={eyebrow}>Declined</div><h2 style={h2}>{declinedThreads.length}</h2><p style={muted}>declined threads</p></div>
          </div>
        </section>

        <section>
          <div style={eyebrow}>Active Controlled Threads</div>
          <div style={{ display: "grid", gap: 18 }}>
            {activeThreads.length ? (
              activeThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} onPatch={(patch) => patchThread(thread.id, patch)} />
              ))
            ) : (
              <div style={panel}>
                <h2 style={h2}>No controlled investor threads yet.</h2>
                <p style={sub}>When admin approves an investor Deal/Pain or execution request, it will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}