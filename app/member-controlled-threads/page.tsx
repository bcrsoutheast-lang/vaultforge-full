"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_LIST_KEY = "vaultforge_investor_applications_v1";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type MemberTab = "inbox" | "active" | "saved" | "archived" | "passed" | "deleted";
type ThreadStatus =
  | "new"
  | "approved"
  | "admin_replied"
  | "member_accepted"
  | "member_replied"
  | "needs_info"
  | "contact_released"
  | "saved"
  | "archived"
  | "passed"
  | "declined"
  | "deleted"
  | string;

type ThreadMessage = {
  id?: string;
  from?: string;
  role?: string;
  body?: string;
  message?: string;
  createdAt?: string;
  at?: string;
};

type ControlledThread = {
  id?: string;
  title?: string;
  subject?: string;
  requestTitle?: string;
  kind?: string;
  requestType?: string;
  requestTitleText?: string;
  itemId?: string;
  state?: string;
  roomHeader?: string;
  roomTitle?: string;
  status?: ThreadStatus;
  stage?: string;
  source?: string;
  investorEmail?: string;
  investorCompany?: string;
  investorName?: string;
  investorPhotoUrl?: string;
  investorProfile?: any;
  contactReleased?: boolean;
  assignedMemberEmail?: string;
  assignedToEmail?: string;
  memberEmail?: string;
  assignedMemberEmails?: string[];
  assignedToEmails?: string[];
  memberEmails?: string[];
  routedMembers?: any[];
  assignedMembers?: any[];
  messages?: ThreadMessage[];
  memberViewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function text(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean && clean !== "undefined" && clean !== "null" ? clean : fallback;
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function arrayFrom(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function nowIso() {
  return new Date().toISOString();
}

function currentEmail() {
  if (!canUseStorage()) return "";
  let profile: any = {};
  for (const key of ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile", "vf_profile", "member_profile", "profile"]) {
    const next = readJson<any>(key, {});
    if (next && typeof next === "object" && !Array.isArray(next)) profile = { ...profile, ...next };
  }

  return lower(
    profile?.email ||
      profile?.memberEmail ||
      profile?.member_email ||
      window.localStorage.getItem("vf_email") ||
      window.localStorage.getItem("member_email") ||
      window.localStorage.getItem("email") ||
      window.localStorage.getItem("vaultforge_email")
  );
}

function currentMemberName() {
  if (!canUseStorage()) return "Member";
  let profile: any = {};
  for (const key of ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile", "vf_profile", "member_profile", "profile"]) {
    const next = readJson<any>(key, {});
    if (next && typeof next === "object" && !Array.isArray(next)) profile = { ...profile, ...next };
  }
  return text(profile?.name || profile?.fullName || profile?.full_name || profile?.company, "Member");
}

function readThreads(): ControlledThread[] {
  const rows = readJson<ControlledThread[]>(CONTROLLED_THREADS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function writeThreads(rows: ControlledThread[]) {
  writeJson(CONTROLLED_THREADS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-controlled-thread-change"));
  window.dispatchEvent(new Event("vaultforge-investor-request-thread-change"));
  window.dispatchEvent(new Event("vaultforge-admin-request-thread-change"));
}

function assignedEmails(thread: ControlledThread) {
  const out = new Set<string>();

  [thread.memberEmail, thread.assignedMemberEmail, thread.assignedToEmail].forEach((value) => {
    const clean = lower(value);
    if (clean) out.add(clean);
  });

  [thread.assignedMemberEmails, thread.assignedToEmails, thread.memberEmails].forEach((list) => {
    arrayFrom(list).forEach((value) => {
      const clean = lower(value);
      if (clean) out.add(clean);
    });
  });

  [...arrayFrom(thread.routedMembers), ...arrayFrom(thread.assignedMembers)].forEach((member) => {
    const clean = lower(member?.email || member?.memberEmail || member?.assignedEmail);
    if (clean) out.add(clean);
  });

  return Array.from(out);
}

function fallbackInvestorProfile(thread: ControlledThread) {
  const direct = thread.investorProfile;
  if (direct && typeof direct === "object" && Object.keys(direct).length) return direct;

  const single = readJson<any>(INVESTOR_APP_KEY, {});
  const list = readJson<any[]>(INVESTOR_LIST_KEY, []);
  const email = lower(thread.investorEmail || single?.email);
  const fromList = Array.isArray(list) ? list.find((row) => lower(row?.email || row?.investorEmail) === email) : null;
  const investor = fromList || single || {};

  return {
    photoUrl: investor?.photoUrl || investor?.profilePhoto || thread.investorPhotoUrl || "",
    contactName: investor?.contactName || investor?.name || thread.investorName || "",
    company: investor?.company || thread.investorCompany || "",
    email: investor?.email || thread.investorEmail || "",
    phone: investor?.phone || "",
    website: investor?.website || "",
    investorTypes: investor?.investorTypes || investor?.assetTypes || [],
    buyingStrategies: investor?.buyingStrategies || investor?.buyingStrategy || investor?.strategy || [],
    assetTypes: investor?.assetTypes || [],
    statesInterested: investor?.statesInterested || investor?.states || [],
    countiesInterested: investor?.countiesInterested || "",
    citiesInterested: investor?.citiesInterested || "",
    minDeal: investor?.minDeal || investor?.min_deal || "",
    maxDeal: investor?.maxDeal || investor?.max_deal || "",
    monthlyVolume: investor?.monthlyVolume || investor?.monthly_volume || "",
    yearlyVolume: investor?.yearlyVolume || investor?.yearly_volume || "",
    closeSpeed: investor?.closeSpeed || investor?.close_speed || "",
    proofFunds: investor?.proofFunds || investor?.proof_funds || investor?.proofOfFunds || "",
    directBuyer: investor?.directBuyer || investor?.direct_buyer || "",
    fundingNeeded: investor?.fundingNeeded || investor?.funding_needed || "",
    notes: investor?.notes || "",
  };
}

function threadId(thread: ControlledThread) {
  return text(thread.id, `member-thread-${thread.title || thread.requestTitle || Date.now()}`);
}

function threadTitle(thread: ControlledThread) {
  return text(thread.title || thread.subject || thread.requestTitle || thread.requestTitleText, "Investor Request");
}

function threadContext(thread: ControlledThread) {
  return text(thread.roomHeader || thread.roomTitle || thread.message || thread.body, "Controlled investor/member/admin request.");
}

function requestLane(thread: ControlledThread) {
  const joined = `${thread.kind || ""} ${thread.requestType || ""} ${thread.requestTitle || ""} ${thread.source || ""}`.toLowerCase();
  if (joined.includes("deal")) return "Deal Request";
  if (joined.includes("pain")) return "Pain Request";
  if (joined.includes("lender") || joined.includes("money") || joined.includes("contractor") || joined.includes("title") || joined.includes("insurance") || joined.includes("operator") || joined.includes("execution")) return "Execution Request";
  return "Investor Request";
}

function statusOf(thread: ControlledThread) {
  return lower(thread.status || thread.stage || "new");
}

function tabForThread(thread: ControlledThread): MemberTab {
  const status = statusOf(thread);
  if (status.includes("deleted")) return "deleted";
  if (status.includes("archive")) return "archived";
  if (status.includes("saved")) return "saved";
  if (status.includes("pass") || status.includes("decline")) return "passed";
  if (status.includes("accept") || status.includes("active") || status.includes("reply") || status.includes("review") || status.includes("release") || status.includes("need")) return "active";
  return "inbox";
}

function latestMessageAt(thread: ControlledThread) {
  const messages = arrayFrom(thread.messages);
  const last = messages[messages.length - 1] as ThreadMessage | undefined;
  return text(last?.createdAt || last?.at || thread.updatedAt || thread.createdAt);
}

function hasUnread(thread: ControlledThread) {
  const viewed = Date.parse(text(thread.memberViewedAt));
  const latest = Date.parse(latestMessageAt(thread));
  if (!latest) return tabForThread(thread) === "inbox";
  if (!viewed) return true;
  return latest > viewed;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 110 };
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
  borderColor: "rgba(0,132,255,.9)",
  boxShadow: "0 0 24px rgba(0,132,255,.35), inset 0 0 0 1px rgba(0,132,255,.32)",
};
const activePanel: React.CSSProperties = {
  ...goldPanel,
  borderColor: "rgba(245,197,66,.78)",
  background: "linear-gradient(180deg,rgba(245,197,66,.10),rgba(18,23,36,.98))",
};
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: .96, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 26, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const small: React.CSSProperties = { color: "#aeb7c7", fontSize: 13, lineHeight: 1.35, margin: "6px 0 0" };
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
const blueBtn: React.CSSProperties = { ...btn, borderColor: "rgba(0,132,255,.55)", background: "#08224c", color: "#7abaff" };
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

function Metric({ title, count, note, active, pulse, onClick }: { title: string; count: number; note: string; active?: boolean; pulse?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...(pulse ? pulsePanel : active ? activePanel : panel), textAlign: "left", cursor: onClick ? "pointer" : "default" }}>
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: "#1687ff" }}>{count}</h2>
      <p style={small}>{note}</p>
    </button>
  );
}

function InvestorProfileCard({ profile, released }: { profile: any; released: boolean }) {
  const investorTypes = Array.isArray(profile?.investorTypes) ? profile.investorTypes.join(" • ") : text(profile?.investorTypes || profile?.assetTypes, "Not listed");
  const strategies = Array.isArray(profile?.buyingStrategies) ? profile.buyingStrategies.join(" • ") : text(profile?.buyingStrategies || profile?.buyingStrategy, "Not listed");
  const markets = Array.isArray(profile?.statesInterested) ? profile.statesInterested.join(" • ") : text(profile?.statesInterested, "Not listed");

  return (
    <div style={panel}>
      <div style={eyebrow}>Investor Profile Attached</div>
      <div style={{ ...row, alignItems: "flex-start" }}>
        {profile?.photoUrl ? (
          <img src={profile.photoUrl} alt="Investor" style={{ width: 86, height: 86, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(245,197,66,.35)" }} />
        ) : null}
        <div>
          <h3 style={h3}>{profile?.contactName || "Investor name not listed"}</h3>
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
              <p style={muted}>Contact stays hidden until VaultForge/member approval releases it.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ thread, selected, onOpen }: { thread: ControlledThread; selected: boolean; onOpen: () => void }) {
  const unread = hasUnread(thread);
  const status = statusOf(thread) || "new";
  return (
    <button type="button" onClick={onOpen} style={{ ...(unread ? pulsePanel : selected ? activePanel : panel), textAlign: "left", cursor: "pointer" }}>
      <div style={row}>
        <span style={{ width: 12, height: 12, borderRadius: 99, background: unread ? "#1687ff" : "#ffdc68", display: "inline-block" }} />
        <div style={eyebrow}>{requestLane(thread)} • {status}</div>
      </div>
      <h3 style={h3}>{threadTitle(thread)}</h3>
      <p style={muted}>{threadContext(thread)}</p>
      <p style={small}>State: {thread.state || "not listed"} • Updated: {latestMessageAt(thread) || "not listed"}</p>
    </button>
  );
}

function ThreadDetail({ thread, onPatch, onDeleteForever }: { thread: ControlledThread; onPatch: (patch: Partial<ControlledThread>) => void; onDeleteForever: () => void }) {
  const [reply, setReply] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const profile = fallbackInvestorProfile(thread);
  const messages = arrayFrom(thread.messages) as ThreadMessage[];
  const released = Boolean(thread.contactReleased);

  function addMessage(role: string, from: string, body: string, patch: Partial<ControlledThread>) {
    const cleanBody = text(body);
    if (!cleanBody) return;
    const message: ThreadMessage = {
      id: `member-thread-message-${Date.now()}`,
      from,
      role,
      body: cleanBody,
      createdAt: nowIso(),
    };
    onPatch({
      ...patch,
      messages: [...messages, message],
      updatedAt: nowIso(),
    });
  }

  function sendReply() {
    addMessage("member", currentMemberName(), reply, { status: "member_replied", stage: "active_thread" });
    setReply("");
  }

  function requestMoreInfo() {
    addMessage("member", currentMemberName(), infoRequest || "Need more information before accepting.", { status: "needs_info", stage: "member_requested_more_info" });
    setInfoRequest("");
  }

  return (
    <div style={goldPanel}>
      <div style={eyebrow}>Request Detail • {requestLane(thread)} • {thread.status || "new"}</div>
      <h2 style={h2}>{threadTitle(thread)}</h2>
      <p style={sub}>{threadContext(thread)}</p>
      <p style={muted}>Thread ID: {threadId(thread)} • State: {thread.state || "not listed"}</p>

      <div style={{ ...grid, marginTop: 18 }}>
        <InvestorProfileCard profile={profile} released={released} />

        <div style={panel}>
          <div style={eyebrow}>Next Move</div>
          <p style={muted}>Accept moves this into your active thread lane. Pass removes it from active work. Messages stay attached to this exact request so investor/admin/member can follow the same room.</p>
          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={goldBtn} onClick={() => onPatch({ status: "member_accepted", stage: "active_thread", acceptedAt: nowIso(), updatedAt: nowIso() })}>Accept / Interested</button>
            <button type="button" style={blueBtn} onClick={() => onPatch({ status: "member_reviewing", stage: "reviewing", updatedAt: nowIso() })}>Reviewing</button>
            <button type="button" style={goldBtn} onClick={() => onPatch({ status: "contact_released", stage: "contact_released", contactReleased: true, updatedAt: nowIso() })}>Release Contact</button>
            <button type="button" style={btn} onClick={() => onPatch({ status: "saved", stage: "saved", updatedAt: nowIso() })}>Save</button>
            <button type="button" style={btn} onClick={() => onPatch({ status: "archived", stage: "archived", updatedAt: nowIso() })}>Archive</button>
            <button type="button" style={redBtn} onClick={() => onPatch({ status: "passed", stage: "member_passed", updatedAt: nowIso() })}>Pass</button>
            <button type="button" style={redBtn} onClick={() => onPatch({ status: "deleted", stage: "deleted", updatedAt: nowIso() })}>Delete</button>
            {statusOf(thread).includes("deleted") ? <button type="button" style={redBtn} onClick={onDeleteForever}>Delete Forever</button> : null}
          </div>
        </div>
      </div>

      <div style={{ ...panel, marginTop: 18 }}>
        <div style={eyebrow}>Request / Thread Messages</div>
        {messages.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {messages.map((message, index) => (
              <div key={message.id || `message-${index}`} style={panel}>
                <p style={small}>{message.from || message.role || "VaultForge"} • {message.createdAt || message.at || ""}</p>
                <p style={sub}>{message.body || message.message || ""}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={muted}>No messages yet. Your reply will stay attached to this request.</p>
        )}

        <div style={{ ...grid, marginTop: 16 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={eyebrow}>Reply To Request Thread</span>
            <textarea style={{ ...input, minHeight: 130 }} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to investor/admin inside this request thread..." />
            <button type="button" style={goldBtn} onClick={sendReply}>Send Thread Reply</button>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={eyebrow}>Need More Info</span>
            <textarea style={{ ...input, minHeight: 130 }} value={infoRequest} onChange={(event) => setInfoRequest(event.target.value)} placeholder="Ask for missing docs, numbers, timeline, proof of funds, access, photos, or deal details..." />
            <button type="button" style={blueBtn} onClick={requestMoreInfo}>Send Need More Info</button>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function MemberControlledThreadsPage() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<ControlledThread[]>([]);
  const [tab, setTab] = useState<MemberTab>("inbox");
  const [selectedId, setSelectedId] = useState("");

  function refresh() {
    setEmail(currentEmail());
    setThreads(readThreads());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-controlled-thread-change", refresh);
    window.addEventListener("vaultforge-investor-request-thread-change", refresh);
    window.addEventListener("vaultforge-admin-request-thread-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-controlled-thread-change", refresh);
      window.removeEventListener("vaultforge-investor-request-thread-change", refresh);
      window.removeEventListener("vaultforge-admin-request-thread-change", refresh);
    };
  }, []);

  const visibleThreads = useMemo(() => {
    const isOwner = email === OWNER_EMAIL;
    return threads.filter((thread) => {
      if (isOwner) return true;
      const assigned = assignedEmails(thread);
      return !assigned.length || !email || assigned.includes(email);
    });
  }, [threads, email]);

  const grouped = useMemo(() => {
    const groups: Record<MemberTab, ControlledThread[]> = { inbox: [], active: [], saved: [], archived: [], passed: [], deleted: [] };
    visibleThreads.forEach((thread) => groups[tabForThread(thread)].push(thread));
    Object.keys(groups).forEach((key) => {
      groups[key as MemberTab].sort((a, b) => String(latestMessageAt(b) || b.createdAt || "").localeCompare(String(latestMessageAt(a) || a.createdAt || "")));
    });
    return groups;
  }, [visibleThreads]);

  const selectedThread = useMemo(() => {
    const all = visibleThreads;
    const selected = all.find((thread) => threadId(thread) === selectedId);
    if (selected) return selected;
    return grouped[tab][0] || all[0] || null;
  }, [visibleThreads, grouped, tab, selectedId]);

  function replaceThreads(next: ControlledThread[]) {
    setThreads(next);
    writeThreads(next);
  }

  function patchThread(id: string, patch: Partial<ControlledThread>) {
    const next = threads.map((thread) => threadId(thread) === id ? { ...thread, ...patch, id: threadId(thread), updatedAt: text(patch.updatedAt, nowIso()) } : thread);
    replaceThreads(next);
  }

  function markViewed(thread: ControlledThread) {
    const id = threadId(thread);
    setSelectedId(id);
    patchThread(id, { memberViewedAt: nowIso() });
  }

  function deleteForever(id: string) {
    const next = threads.filter((thread) => threadId(thread) !== id);
    setSelectedId("");
    replaceThreads(next);
  }

  const inboxCount = grouped.inbox.length;
  const activeCount = grouped.active.length;
  const savedCount = grouped.saved.length;
  const archivedCount = grouped.archived.length;
  const passedCount = grouped.passed.length;
  const deletedCount = grouped.deleted.length;
  const unreadCount = visibleThreads.filter(hasUnread).length;

  return (
    <main style={pageStyle}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Member Request Command</div>
          <h1 style={h1}>One clean member operating lane.</h1>
          <p style={sub}>Routed investor Deal/Pain/execution requests land here, then move in order: Inbox → Active Thread → Message / Accept / Pass → Saved / Archived / Deleted.</p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/command" style={goldBtn}>Member Command</Link>
            <Link href="/messages" style={btn}>Messages</Link>
            <Link href="/profile" style={btn}>Profile</Link>
            <Link href="/admin" style={btn}>Admin</Link>
          </div>
          <p style={muted}>Detected member/admin email: {email || "not detected"}</p>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div style={grid}>
            <Metric title="New Inbox" count={inboxCount} note="routed investor requests" active={tab === "inbox"} pulse={grouped.inbox.some(hasUnread)} onClick={() => setTab("inbox")} />
            <Metric title="Active Threads" count={activeCount} note="accepted/reviewing conversations" active={tab === "active"} pulse={grouped.active.some(hasUnread)} onClick={() => setTab("active")} />
            <Metric title="Unread" count={unreadCount} note="new admin/investor messages" pulse={unreadCount > 0} onClick={() => setTab("inbox")} />
            <Metric title="Saved" count={savedCount} note="saved requests" active={tab === "saved"} onClick={() => setTab("saved")} />
            <Metric title="Archived" count={archivedCount} note="archived requests" active={tab === "archived"} onClick={() => setTab("archived")} />
            <Metric title="Passed" count={passedCount} note="passed/declined requests" active={tab === "passed"} onClick={() => setTab("passed")} />
            <Metric title="Deleted" count={deletedCount} note="deleted queue" active={tab === "deleted"} onClick={() => setTab("deleted")} />
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 18 }}>
          <div style={eyebrow}>Member Queues</div>
          <div style={row}>
            {(["inbox", "active", "saved", "archived", "passed", "deleted"] as MemberTab[]).map((nextTab) => (
              <button key={nextTab} type="button" style={tab === nextTab ? goldBtn : btn} onClick={() => { setTab(nextTab); setSelectedId(""); }}>
                {nextTab.toUpperCase()} ({grouped[nextTab].length})
              </button>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(280px,.9fr) minmax(320px,1.4fr)", gap: 18, alignItems: "start" }}>
          <div style={panel}>
            <div style={eyebrow}>{tab} Request Cards</div>
            <div style={{ display: "grid", gap: 12 }}>
              {grouped[tab].length ? grouped[tab].map((thread) => (
                <RequestCard key={threadId(thread)} thread={thread} selected={selectedThread ? threadId(selectedThread) === threadId(thread) : false} onOpen={() => markViewed(thread)} />
              )) : (
                <div style={panel}>
                  <h3 style={h3}>No {tab} requests.</h3>
                  <p style={muted}>When admin routes matching investor requests to this member lane, they appear here.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            {selectedThread ? (
              <ThreadDetail
                thread={selectedThread}
                onPatch={(patch) => patchThread(threadId(selectedThread), patch)}
                onDeleteForever={() => deleteForever(threadId(selectedThread))}
              />
            ) : (
              <div style={panel}>
                <h2 style={h2}>Select a request.</h2>
                <p style={sub}>Request detail, investor profile, next move, cleanup controls, and messages will show here.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
