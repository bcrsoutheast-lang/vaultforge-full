"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Lane = "new" | "active" | "admin" | "investor" | "deal" | "pain" | "execution" | "saved" | "archived" | "passed" | "deleted";

type ThreadPatch = Record<string, any>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => clean(item)).filter(Boolean);
  return [];
}

function currentEmail() {
  const profileKeys = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile", "vf_profile", "member_profile", "profile"];
  let profile: any = {};

  for (const key of profileKeys) {
    const next = readJson<any>(key, {});
    if (next && typeof next === "object" && !Array.isArray(next)) profile = { ...profile, ...next };
  }

  return lower(
    profile?.email ||
      profile?.memberEmail ||
      profile?.member_email ||
      localStorage.getItem("vf_email") ||
      localStorage.getItem("member_email") ||
      localStorage.getItem("email")
  );
}

function readThreads() {
  const rows = readJson<any[]>(CONTROLLED_THREADS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function writeThreads(rows: any[]) {
  writeJson(CONTROLLED_THREADS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-controlled-thread-change"));
  window.dispatchEvent(new Event("vaultforge-member-thread-change"));
}

function safeId(thread: any, index = 0) {
  return clean(thread?.id || thread?.threadId || thread?.thread_id || thread?.requestId || thread?.request_id, `member-thread-${index}`);
}

function statusOf(thread: any) {
  return lower(thread?.status || thread?.memberStatus || thread?.stage || "new");
}

function sourceOf(thread: any) {
  return lower(thread?.source || thread?.type || thread?.requestType || thread?.requestTitle || thread?.kind || thread?.roomKind || thread?.roomType || thread?.lane);
}

function isDeleted(thread: any) {
  return ["deleted", "trash", "removed"].includes(statusOf(thread));
}

function isArchived(thread: any) {
  return ["archived", "closed", "complete", "completed"].includes(statusOf(thread));
}

function isSaved(thread: any) {
  return statusOf(thread) === "saved" || Boolean(thread?.saved);
}

function isPassed(thread: any) {
  return ["passed", "pass", "declined", "denied", "member_declined"].includes(statusOf(thread));
}

function isAccepted(thread: any) {
  return ["accepted", "active", "reviewing", "member_replied", "contact_released", "member_review_active", "member_reviewing"].includes(statusOf(thread));
}

function isExecution(thread: any) {
  const source = sourceOf(thread);
  return (
    source.includes("execution") ||
    source.includes("lender") ||
    source.includes("hard_money") ||
    source.includes("contractor") ||
    source.includes("title") ||
    source.includes("closing") ||
    source.includes("insurance") ||
    source.includes("operator") ||
    source.includes("disposition") ||
    source.includes("boots") ||
    source.includes("equity") ||
    source.includes("jv") ||
    source.includes("property_management")
  );
}

function isDeal(thread: any) {
  const source = sourceOf(thread);
  const text = `${source} ${thread?.kind || ""} ${thread?.roomType || ""} ${thread?.roomHeader || ""} ${thread?.title || ""}`.toLowerCase();
  return text.includes("deal") || text.includes("opportunity");
}

function isPain(thread: any) {
  const source = sourceOf(thread);
  const text = `${source} ${thread?.kind || ""} ${thread?.roomType || ""} ${thread?.roomHeader || ""} ${thread?.title || ""}`.toLowerCase();
  return text.includes("pain") || text.includes("problem");
}

function hasAdminReply(thread: any) {
  return list(thread?.messages).some((message: any) => lower(message?.role || message?.from).includes("admin")) || Boolean(thread?.adminReply || thread?.adminNote || thread?.ownerReply);
}

function hasInvestorReply(thread: any) {
  return list(thread?.messages).some((message: any) => lower(message?.role || message?.from).includes("investor")) || Boolean(thread?.investorReply || thread?.investorMessage);
}

function titleFor(thread: any) {
  return clean(thread?.title || thread?.requestTitle || thread?.subject || thread?.topic || "Investor Request");
}

function roomHeaderFor(thread: any) {
  return clean(thread?.roomHeader || thread?.message || thread?.body || thread?.notes || "Routed investor request");
}

function profileFrom(thread: any) {
  return thread?.investorProfile || {
    contactName: thread?.investorName || thread?.contactName || "Investor not listed",
    company: thread?.investorCompany || thread?.company || "Company not listed",
    email: thread?.investorEmail || thread?.email || "Not listed",
    phone: thread?.investorPhone || thread?.phone || "Not listed",
    photoUrl: thread?.investorPhotoUrl || thread?.photoUrl || "",
    investorTypes: thread?.investorTypes || [],
    buyingStrategies: thread?.buyingStrategies || thread?.strategy || [],
    statesInterested: thread?.statesInterested || thread?.state || [],
    minDeal: thread?.minDeal || "",
    maxDeal: thread?.maxDeal || "",
    monthlyVolume: thread?.monthlyVolume || "",
    yearlyVolume: thread?.yearlyVolume || "",
    proofFunds: thread?.proofFunds || "Not listed",
    closeSpeed: thread?.closeSpeed || "Not listed",
  };
}

function assignedToCurrentMember(thread: any, email: string) {
  if (!email) return true;
  if (email === OWNER_EMAIL) return true;

  const possible = [
    thread?.memberEmail,
    thread?.assignedMemberEmail,
    thread?.assignedToEmail,
    thread?.assignedToEmails,
    thread?.routedToEmail,
    thread?.routedToEmails,
    thread?.memberEmails,
    thread?.assignedMembers,
    thread?.matchedMemberEmails,
    thread?.routedMembers,
  ];

  const flattened = possible.flatMap((item) => list(item)).map((item) => item.toLowerCase());
  const direct = possible.map((item) => (typeof item === "string" ? item.toLowerCase() : "")).filter(Boolean);
  const all = [...flattened, ...direct];

  if (!all.length) return true;
  return all.includes(email);
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
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
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
const pulsePanel: React.CSSProperties = {
  ...goldPanel,
  boxShadow: "0 0 0 1px rgba(245,197,66,.38), 0 0 32px rgba(245,197,66,.20)",
};
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontWeight: 950, fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,46px)", lineHeight: .96, letterSpacing: -2, margin: "0 0 12px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 24, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 19, lineHeight: 1.35, margin: 0 };
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ ...panel, marginBottom: 18 }}>
      <div style={eyebrow}>{title}</div>
      {children}
    </section>
  );
}

function LaneCard({ title, count, note, active, pulse, danger, onClick }: { title: string; count: number; note: string; active: boolean; pulse?: boolean; danger?: boolean; onClick: () => void }) {
  const style = active ? goldPanel : danger && count > 0 ? redPanel : pulse && count > 0 ? pulsePanel : panel;
  return (
    <button type="button" style={{ ...style, textAlign: "left", cursor: "pointer", width: "100%" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={muted}>Click to open</p>
    </button>
  );
}

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
            style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(245,197,66,.35)" }}
          />
        ) : null}

        <div>
          <h3 style={h3}>{profile?.contactName || profile?.name || "Investor name hidden/not listed"}</h3>
          <p style={muted}>{profile?.company || "Company not listed"}</p>
          <p style={muted}>Type: {investorTypes}</p>
          <p style={muted}>Strategy: {strategies}</p>
          <p style={muted}>Markets: {markets}</p>
          <p style={muted}>Buy Box: {profile?.minDeal || "Not listed"} - {profile?.maxDeal || "Not listed"}</p>
          <p style={muted}>Volume: {profile?.monthlyVolume || "Not listed"} / month • {profile?.yearlyVolume || "Not listed"} / year</p>
          <p style={muted}>Proof of Funds: {String(profile?.proofFunds || "Not listed")}</p>
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
              <p style={muted}>Contact stays hidden until you/admin approve release.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ thread, active, onOpen }: { thread: any; active: boolean; onOpen: () => void }) {
  const profile = profileFrom(thread);
  const status = statusOf(thread);
  const hasUnread = Boolean(thread?.unread || thread?.memberUnread || thread?.newForMember || status === "new" || status === "routed" || status === "approved");
  const style = active ? goldPanel : hasUnread && !isArchived(thread) && !isDeleted(thread) && !isPassed(thread) ? pulsePanel : panel;

  return (
    <button type="button" style={{ ...style, textAlign: "left", cursor: "pointer", width: "100%" }} onClick={onOpen}>
      <div style={eyebrow}>{status || "new"} • {sourceOf(thread) || "request"}</div>
      <h3 style={h3}>{titleFor(thread)}</h3>
      <p style={muted}>{roomHeaderFor(thread)}</p>
      <p style={muted}>Investor: {profile?.contactName || thread?.investorName || "Not listed"} • {profile?.company || thread?.investorCompany || "Company not listed"}</p>
      <p style={muted}>State: {thread?.state || "not listed"} • Messages: {(thread?.messages || []).length || 0}</p>
      <p style={muted}>Click to open request detail</p>
    </button>
  );
}

function MessageBubble({ message }: { message: any }) {
  const role = clean(message?.role || message?.from || "System");
  return (
    <div style={panel}>
      <div style={eyebrow}>{role} • {clean(message?.createdAt || message?.at || "")}</div>
      <p style={sub}>{clean(message?.body || message?.message || message?.text || "")}</p>
    </div>
  );
}

function RequestDetail({ thread, onPatch, onDeleteForever, onBack }: { thread: any; onPatch: (patch: ThreadPatch) => void; onDeleteForever: () => void; onBack: () => void }) {
  const [reply, setReply] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const profile = profileFrom(thread);
  const released = Boolean(thread?.contactReleased);

  function addMessage(role: string, body: string, patch: ThreadPatch = {}) {
    if (!body.trim()) return;
    const message = {
      id: `member-thread-message-${Date.now()}`,
      from: role,
      role: role.toLowerCase(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    onPatch({
      ...patch,
      messages: [...(thread.messages || []), message],
      unread: true,
      investorUnread: true,
      adminUnread: true,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section style={goldPanel}>
      <div style={eyebrow}>Open Request Detail</div>
      <h2 style={h2}>{titleFor(thread)}</h2>
      <p style={sub}>{roomHeaderFor(thread)}</p>
      <p style={muted}>Status: {statusOf(thread) || "new"} • Source: {sourceOf(thread) || "request"} • State: {thread?.state || "not listed"}</p>
      <p style={muted}>Thread ID: {safeId(thread)}</p>

      <div style={{ ...row, marginTop: 16 }}>
        <button type="button" style={btn} onClick={onBack}>Back to Cards</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ status: "accepted", stage: "member_accepted", memberAccepted: true, unread: false, updatedAt: new Date().toISOString() })}>Accept / Work It</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ status: "reviewing", stage: "member_reviewing", unread: false, updatedAt: new Date().toISOString() })}>Reviewing</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ contactReleased: true, status: "contact_released", stage: "contact_released", updatedAt: new Date().toISOString() })}>Release Contact</button>
        <button type="button" style={btn} onClick={() => onPatch({ saved: true, status: "saved", stage: "saved", updatedAt: new Date().toISOString() })}>Save</button>
        <button type="button" style={btn} onClick={() => onPatch({ status: "archived", stage: "archived", updatedAt: new Date().toISOString() })}>Archive</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "passed", stage: "member_passed", updatedAt: new Date().toISOString() })}>Pass</button>
        {isDeleted(thread) ? (
          <button type="button" style={redBtn} onClick={onDeleteForever}>Delete Forever</button>
        ) : (
          <button type="button" style={redBtn} onClick={() => onPatch({ status: "deleted", stage: "deleted", updatedAt: new Date().toISOString() })}>Delete</button>
        )}
        {statusOf(thread) !== "new" ? <button type="button" style={btn} onClick={() => onPatch({ status: "new", stage: "member_inbox", updatedAt: new Date().toISOString() })}>Move To Inbox</button> : null}
      </div>

      <div style={{ ...grid, marginTop: 18 }}>
        <InvestorProfileCard profile={profile} photoUrl={thread?.investorPhotoUrl || profile?.photoUrl} released={released} />

        <div style={panel}>
          <div style={eyebrow}>Next Move</div>
          <h3 style={h3}>{isAccepted(thread) ? "Active working thread" : "Needs member decision"}</h3>
          <p style={muted}>Accept to move this into Active Threads. Pass moves it out of active. Need More Info sends a message back on the same controlled request thread.</p>
          <p style={muted}>Deal/Pain/Execution context stays attached so replies do not scatter into random inboxes.</p>
        </div>
      </div>

      <div style={{ ...panel, marginTop: 18 }}>
        <div style={eyebrow}>Thread Messages</div>
        {(thread.messages || []).length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {(thread.messages || []).map((message: any, index: number) => <MessageBubble key={message?.id || index} message={message} />)}
          </div>
        ) : (
          <p style={muted}>No messages yet. Send a reply or request more info below.</p>
        )}
      </div>

      <div style={{ ...grid, marginTop: 18 }}>
        <div style={panel}>
          <div style={eyebrow}>Reply To Request</div>
          <textarea style={{ ...input, minHeight: 130 }} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply inside this exact request thread..." />
          <div style={{ ...row, marginTop: 12 }}>
            <button type="button" style={goldBtn} onClick={() => { addMessage("Member", reply, { status: "member_replied", stage: "member_reply_sent" }); setReply(""); }}>Send Reply</button>
          </div>
        </div>

        <div style={panel}>
          <div style={eyebrow}>Need More Info</div>
          <textarea style={{ ...input, minHeight: 130 }} value={infoRequest} onChange={(event) => setInfoRequest(event.target.value)} placeholder="Ask admin/investor for missing documents, terms, photos, proof, address, deal sheet..." />
          <div style={{ ...row, marginTop: 12 }}>
            <button type="button" style={goldBtn} onClick={() => { addMessage("Member Need More Info", infoRequest || "Member needs more information before moving forward.", { status: "needs_more_info", stage: "member_requested_info" }); setInfoRequest(""); }}>Request Info</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MemberControlledThreadsPage() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [lane, setLane] = useState<Lane>("new");
  const [activeId, setActiveId] = useState("");

  function refresh() {
    setEmail(currentEmail());
    setThreads(readThreads());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-controlled-thread-change", refresh);
    window.addEventListener("vaultforge-member-thread-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-controlled-thread-change", refresh);
      window.removeEventListener("vaultforge-member-thread-change", refresh);
    };
  }, []);

  const visibleThreads = useMemo(() => {
    return threads.filter((thread, index) => {
      const id = safeId(thread, index);
      return Boolean(id) && assignedToCurrentMember(thread, email);
    });
  }, [threads, email]);

  const categorized = useMemo(() => {
    const live = visibleThreads.filter((thread) => !isDeleted(thread) && !isArchived(thread) && !isSaved(thread) && !isPassed(thread));
    const newRequests = live.filter((thread) => !isAccepted(thread));
    const active = live.filter((thread) => isAccepted(thread));
    return {
      new: newRequests,
      active,
      admin: visibleThreads.filter((thread) => hasAdminReply(thread) && !isDeleted(thread)),
      investor: visibleThreads.filter((thread) => hasInvestorReply(thread) && !isDeleted(thread)),
      deal: visibleThreads.filter((thread) => isDeal(thread) && !isDeleted(thread)),
      pain: visibleThreads.filter((thread) => isPain(thread) && !isDeleted(thread)),
      execution: visibleThreads.filter((thread) => isExecution(thread) && !isDeleted(thread)),
      saved: visibleThreads.filter(isSaved),
      archived: visibleThreads.filter(isArchived),
      passed: visibleThreads.filter(isPassed),
      deleted: visibleThreads.filter(isDeleted),
    } as Record<Lane, any[]>;
  }, [visibleThreads]);

  const openRows = categorized[lane] || [];
  const activeThread = activeId ? visibleThreads.find((thread, index) => safeId(thread, index) === activeId) : null;

  function patchThread(id: string, patch: ThreadPatch) {
    const next = threads.map((thread, index) => {
      const threadId = safeId(thread, index);
      return threadId === id ? { ...thread, ...patch, id: thread?.id || id } : thread;
    });
    setThreads(next);
    writeThreads(next);
  }

  function deleteForever(id: string) {
    const next = threads.filter((thread, index) => safeId(thread, index) !== id);
    setThreads(next);
    writeThreads(next);
    setActiveId("");
  }

  return (
    <main style={pageStyle}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Member Request Command</div>
          <h1 style={h1}>Routed requests, replies, and next moves.</h1>
          <p style={sub}>One member lane: New Request → Open Detail → Accept / Pass / Message → Active Thread → Cleanup.</p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/command" style={goldBtn}>Member Command</Link>
            <Link href="/message-command" style={btn}>Message Command</Link>
            <Link href="/investor-room" style={btn}>Investor Room</Link>
            <Link href="/admin" style={btn}>Admin</Link>
          </div>

          <p style={muted}>Detected member/admin email: {email || "not detected"}</p>
        </section>

        <Section title="Member Request Cards">
          <div style={grid}>
            <LaneCard title="New Requests" count={categorized.new.length} note="routed investor requests needing a member decision" active={lane === "new"} pulse={categorized.new.length > 0} onClick={() => { setLane("new"); setActiveId(""); }} />
            <LaneCard title="Active Threads" count={categorized.active.length} note="accepted requests being worked" active={lane === "active"} onClick={() => { setLane("active"); setActiveId(""); }} />
            <LaneCard title="Admin Replies" count={categorized.admin.length} note="admin messages attached to requests" active={lane === "admin"} pulse={categorized.admin.length > 0} onClick={() => { setLane("admin"); setActiveId(""); }} />
            <LaneCard title="Investor Replies" count={categorized.investor.length} note="investor replies attached to requests" active={lane === "investor"} pulse={categorized.investor.length > 0} onClick={() => { setLane("investor"); setActiveId(""); }} />
            <LaneCard title="Deal Opportunities" count={categorized.deal.length} note="deal/opportunity routed cards" active={lane === "deal"} onClick={() => { setLane("deal"); setActiveId(""); }} />
            <LaneCard title="Pain Requests" count={categorized.pain.length} note="problem-solving routed cards" active={lane === "pain"} onClick={() => { setLane("pain"); setActiveId(""); }} />
            <LaneCard title="Execution Requests" count={categorized.execution.length} note="lender/title/contractor/operator style requests" active={lane === "execution"} onClick={() => { setLane("execution"); setActiveId(""); }} />
            <LaneCard title="Saved" count={categorized.saved.length} note="saved request cards" active={lane === "saved"} onClick={() => { setLane("saved"); setActiveId(""); }} />
            <LaneCard title="Archived" count={categorized.archived.length} note="completed or hidden request cards" active={lane === "archived"} onClick={() => { setLane("archived"); setActiveId(""); }} />
            <LaneCard title="Passed" count={categorized.passed.length} note="declined/passed requests" active={lane === "passed"} danger={categorized.passed.length > 0} onClick={() => { setLane("passed"); setActiveId(""); }} />
            <LaneCard title="Deleted" count={categorized.deleted.length} note="cleanup folder with delete forever" active={lane === "deleted"} danger={categorized.deleted.length > 0} onClick={() => { setLane("deleted"); setActiveId(""); }} />
          </div>
        </Section>

        {activeThread ? (
          <RequestDetail
            thread={activeThread}
            onBack={() => setActiveId("")}
            onPatch={(patch) => patchThread(safeId(activeThread), patch)}
            onDeleteForever={() => deleteForever(safeId(activeThread))}
          />
        ) : (
          <Section title={`${lane.toUpperCase()} Cards`}>
            {openRows.length ? (
              <div style={grid}>
                {openRows.map((thread, index) => {
                  const id = safeId(thread, index);
                  return <RequestCard key={id} thread={thread} active={activeId === id} onOpen={() => setActiveId(id)} />;
                })}
              </div>
            ) : (
              <div style={panel}>
                <h2 style={h2}>No cards in this lane.</h2>
                <p style={sub}>When admin routes/approves investor requests, they appear as visible member cards here.</p>
              </div>
            )}
          </Section>
        )}
      </div>
    </main>
  );
}
