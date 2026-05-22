"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";
const ADMIN_INBOX_KEY = "vaultforge_admin_investor_inbox_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";
const INVESTOR_EXECUTION_REQUESTS_KEY = "vaultforge_investor_execution_requests_v1";
const INVESTOR_ADMIN_MESSAGES_KEY = "vaultforge_investor_admin_messages_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const MEMBER_REQUEST_OVERRIDES_KEY = "vaultforge_member_request_overrides_v1";
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

function readArrayKey(key: string) {
  const value = readJson<any>(key, []);
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function baseInvestorProfile() {
  const profile = readJson<any>(INVESTOR_APP_KEY, {});
  return profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
}

function inferKind(row: any) {
  const text = `${row?.type || ""} ${row?.requestType || ""} ${row?.requestTitle || ""} ${row?.kind || ""} ${row?.roomKind || ""} ${row?.roomType || ""} ${row?.roomHeader || ""} ${row?.title || ""} ${row?.subject || ""}`.toLowerCase();
  if (text.includes("pain") || text.includes("problem")) return "Pain";
  if (text.includes("deal") || text.includes("opportunity")) return "Deal";
  return clean(row?.kind || row?.roomKind || row?.roomType || "Request", "Request");
}

function normalizeThread(row: any, sourceKey: string, index: number) {
  const id = clean(row?.id || row?.threadId || row?.thread_id || row?.requestId || row?.request_id || `${sourceKey}-${index}`);
  const investorProfile = row?.investorProfile || baseInvestorProfile();
  const kind = inferKind(row);
  const requestTitle = clean(row?.requestTitle || row?.title || row?.subject || row?.topic || `${kind} Request`);
  const body = clean(row?.roomHeader || row?.message || row?.body || row?.notes || row?.requestMessage || "Routed investor request");

  return {
    ...row,
    id,
    threadId: row?.threadId || id,
    sourceStorageKey: row?.sourceStorageKey || sourceKey,
    kind: row?.kind || kind,
    requestTitle,
    title: clean(row?.title || requestTitle, requestTitle),
    subject: clean(row?.subject || requestTitle, requestTitle),
    roomHeader: clean(row?.roomHeader || body, body),
    message: clean(row?.message || body, body),
    body: clean(row?.body || body, body),
    status: clean(row?.status || row?.memberStatus || row?.stage || "new", "new"),
    investorProfile,
    investorName: clean(row?.investorName || investorProfile?.contactName || investorProfile?.name || "Investor not listed"),
    investorCompany: clean(row?.investorCompany || investorProfile?.company || "Company not listed"),
    investorEmail: clean(row?.investorEmail || investorProfile?.email || "Not listed"),
    investorPhotoUrl: clean(row?.investorPhotoUrl || investorProfile?.photoUrl || ""),
    createdAt: clean(row?.createdAt || row?.created_at || new Date().toISOString()),
  };
}

function readMemberOverrides() {
  return readJson<Record<string, any>>(MEMBER_REQUEST_OVERRIDES_KEY, {});
}

function writeMemberOverrides(overrides: Record<string, any>) {
  writeJson(MEMBER_REQUEST_OVERRIDES_KEY, overrides);
}

function readThreads() {
  const sources = [
    { key: CONTROLLED_THREADS_KEY, rows: readArrayKey(CONTROLLED_THREADS_KEY) },
    { key: ADMIN_INBOX_KEY, rows: readArrayKey(ADMIN_INBOX_KEY) },
    { key: INVESTOR_REQUESTS_KEY, rows: readArrayKey(INVESTOR_REQUESTS_KEY) },
    { key: INVESTOR_EXECUTION_REQUESTS_KEY, rows: readArrayKey(INVESTOR_EXECUTION_REQUESTS_KEY) },
    { key: INVESTOR_ADMIN_MESSAGES_KEY, rows: readArrayKey(INVESTOR_ADMIN_MESSAGES_KEY) },
  ];

  const overrides = readMemberOverrides();
  const map = new Map<string, any>();

  sources.forEach((source) => {
    source.rows.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const normalized = normalizeThread(row, source.key, index);
      const id = safeId(normalized, index);
      const patched = { ...normalized, ...(overrides[id] || {}) };
      if (patched?.status === "__deleted_forever") return;
      map.set(id, { ...(map.get(id) || {}), ...patched, id });
    });
  });

  return Array.from(map.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
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


type BloombergMessagePayload = {
  messageType: string;
  urgency: string;
  subject: string;
  body: string;
  amount: string;
  timeline: string;
  conditions: string;
  nextMove: string;
  privateNote: string;
  summary: string;
  sender: string;
  recipient: string;
  header: string;
};

function buildBloombergSummary(payload: Omit<BloombergMessagePayload, "summary">) {
  return [
    `TYPE: ${payload.messageType}`,
    `URGENCY: ${payload.urgency}`,
    `SUBJECT: ${payload.subject || "Not listed"}`,
    `SENDER: ${payload.sender || "Not listed"}`,
    `RECIPIENT: ${payload.recipient || "Not listed"}`,
    `HEADER: ${payload.header || "Not listed"}`,
    "",
    `MESSAGE: ${payload.body || "No message body provided."}`,
    "",
    `AMOUNT / BUDGET: ${payload.amount || "Not listed"}`,
    `TIMELINE: ${payload.timeline || "Not listed"}`,
    `CONDITIONS: ${payload.conditions || "Not listed"}`,
    `NEXT MOVE: ${payload.nextMove || "Not listed"}`,
    payload.privateNote ? `PRIVATE NOTE: ${payload.privateNote}` : "",
  ].filter(Boolean).join("\\n");
}

function BloombergMessageForm({
  sender,
  recipient,
  header,
  defaultSubject,
  submitLabel,
  defaultType,
  onSend,
  onCancel,
}: {
  sender: string;
  recipient: string;
  header: string;
  defaultSubject?: string;
  submitLabel: string;
  defaultType?: string;
  onSend: (payload: BloombergMessagePayload) => void;
  onCancel?: () => void;
}) {
  const [messageType, setMessageType] = useState(defaultType || "Request Update");
  const [urgency, setUrgency] = useState("Normal");
  const [subject, setSubject] = useState(defaultSubject || header || "");
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [conditions, setConditions] = useState("");
  const [nextMove, setNextMove] = useState("");
  const [privateNote, setPrivateNote] = useState("");

  function submit() {
    const base = {
      messageType,
      urgency,
      subject,
      body,
      amount,
      timeline,
      conditions,
      nextMove,
      privateNote,
      sender,
      recipient,
      header,
    };
    const summary = buildBloombergSummary(base);
    onSend({ ...base, summary });
    setBody("");
    setAmount("");
    setTimeline("");
    setConditions("");
    setNextMove("");
    setPrivateNote("");
  }

  return (
    <div style={{ ...panel, marginTop: 14 }}>
      <div style={eyebrow}>Bloomberg Message Ticket</div>
      <h3 style={h3}>{subject || "Structured Request Message"}</h3>

      <div style={{ ...grid, marginTop: 12 }}>
        <div style={panel}>
          <div style={eyebrow}>Sender</div>
          <p style={muted}>{sender || "Auto-filled sender"}</p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>Recipient</div>
          <p style={muted}>{recipient || "Auto-filled recipient"}</p>
        </div>
      </div>

      <div style={{ ...panel, marginTop: 12 }}>
        <div style={eyebrow}>Attached Header</div>
        <p style={sub}>{header || "Request/deal/pain context auto-attached"}</p>
      </div>

      <div style={{ ...grid, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Message Type</span>
          <select style={input} value={messageType} onChange={(event) => setMessageType(event.target.value)}>
            {["Request Info", "Request Update", "Interested / Accept", "Submit Terms", "Pass", "Need Documents", "Release Contact Request", "Funding Offer", "Contractor Bid", "Title / Closing Update", "Admin Note", "Member Reply", "Investor Reply"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Urgency</span>
          <select style={input} value={urgency} onChange={(event) => setUrgency(event.target.value)}>
            {["Normal", "Time Sensitive", "Urgent", "Closing Risk"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Subject</span>
        <input style={input} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Auto-filled from request, editable..." />
      </label>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Message / Terms / Ask</span>
        <textarea style={{ ...input, minHeight: 120 }} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write the actual request, reply, terms, bid, question, or update..." />
      </label>

      <div style={{ ...grid, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Amount / Budget</span>
          <input style={input} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="$ amount, LTC/LTV, bid, budget..." />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Timeline</span>
          <input style={input} value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="Close date, response deadline, work start..." />
        </label>
      </div>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Conditions</span>
        <input style={input} value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder="Subject to docs, walkthrough, proof, title, underwriting..." />
      </label>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Best Next Move</span>
        <input style={input} value={nextMove} onChange={(event) => setNextMove(event.target.value)} placeholder="Schedule call, send docs, release contact, route to member..." />
      </label>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Private Note</span>
        <input style={input} value={privateNote} onChange={(event) => setPrivateNote(event.target.value)} placeholder="Internal note, caution, context. Saved inside structured message." />
      </label>

      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn} onClick={submit}>{submitLabel}</button>
        {onCancel ? <button type="button" style={btn} onClick={onCancel}>Collapse / Done</button> : null}
      </div>
    </div>
  );
}


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
        <button type="button" style={btn} onClick={onBack}>Collapse / Done</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ status: "accepted", stage: "member_accepted", memberAccepted: true, unread: false, updatedAt: new Date().toISOString() })}>Accept / Work It</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ status: "reviewing", stage: "member_reviewing", unread: false, updatedAt: new Date().toISOString() })}>Reviewing</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ contactReleased: true, status: "contact_released", stage: "contact_released", updatedAt: new Date().toISOString() })}>Release Contact</button>
        <button type="button" style={btn} onClick={() => onPatch({ saved: true, status: "saved", stage: "saved", updatedAt: new Date().toISOString() })}>Save</button>
        <button type="button" style={btn} onClick={() => onPatch({ saved: false, status: "archived", stage: "archived", updatedAt: new Date().toISOString() })}>Archive</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ saved: false, status: "passed", stage: "member_passed", updatedAt: new Date().toISOString() })}>Pass</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ saved: false, status: "deleted", stage: "deleted", updatedAt: new Date().toISOString() })}>Delete</button>
        <button type="button" style={redBtn} onClick={onDeleteForever}>Delete Forever</button>
        {statusOf(thread) !== "new" ? <button type="button" style={btn} onClick={() => onPatch({ saved: false, status: "new", stage: "member_inbox", updatedAt: new Date().toISOString() })}>Move To Inbox</button> : null}
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

      <BloombergMessageForm
        sender={currentEmail() || "Member"}
        recipient="Investor / VaultForge Admin"
        header={roomHeaderFor(thread)}
        defaultSubject={titleFor(thread)}
        defaultType="Member Reply"
        submitLabel="Send Structured Reply"
        onSend={(payload) => {
          setReply(payload.summary);
          addMessage("Member", payload.summary, {
            status: payload.messageType === "Need Documents" || payload.messageType === "Request Info" ? "needs_more_info" : "member_replied",
            stage: payload.messageType === "Need Documents" || payload.messageType === "Request Info" ? "member_requested_info" : "member_reply_sent",
            messageType: payload.messageType,
            urgency: payload.urgency,
            investorProfile: profile,
          });
          setReply("");
          setInfoRequest("");
        }}
      />
    </section>
  );
}


function MemberSequenceCard({
  step,
  title,
  note,
  active,
}: {
  step: string;
  title: string;
  note: string;
  active?: boolean;
}) {
  return (
    <div style={active ? goldPanel : panel}>
      <div style={eyebrow}>{step}</div>
      <h3 style={h3}>{title}</h3>
      <p style={muted}>{note}</p>
    </div>
  );
}

function MemberOperatingGuide() {
  return (
    <section style={{ ...goldPanel, marginBottom: 18 }}>
      <div style={eyebrow}>Member Operating Sequence</div>
      <h2 style={h2}>Work routed requests in order.</h2>
      <p style={sub}>
        This is the member-side execution lane. Every card should move from request review to active work, messaging, contact release, and cleanup.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        <MemberSequenceCard step="01 Inbox" title="New Requests" note="Fresh investor/admin routed requests needing a member decision." active />
        <MemberSequenceCard step="02 Decision" title="Accept / Pass / Review" note="Accept moves the request into Active Threads. Pass removes it from active work." />
        <MemberSequenceCard step="03 Message" title="Structured Reply" note="Use the Bloomberg ticket form so replies carry sender, recipient, header, urgency, timeline, amount, and next move." />
        <MemberSequenceCard step="04 Contact" title="Release Contact" note="Only release contact after member/admin approval. The investor profile remains attached." />
        <MemberSequenceCard step="05 Execution" title="Work The Request" note="Funding, title, contractor, operator, insurance, JV, or boots-on-ground work happens inside the active thread." />
        <MemberSequenceCard step="06 Cleanup" title="Save / Archive / Delete" note="Keep the workspace clean without scattering messages or losing request context." />
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requestedLane = params.get("lane") as Lane | null;
    const allowed: Lane[] = ["new", "active", "admin", "investor", "deal", "pain", "execution", "saved", "archived", "passed", "deleted"];
    if (requestedLane && allowed.includes(requestedLane)) setLane(requestedLane);
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
    const overrides = readMemberOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...patch, updatedAt: new Date().toISOString() };
    writeMemberOverrides(overrides);

    let found = false;
    const next = readArrayKey(CONTROLLED_THREADS_KEY).map((thread, index) => {
      const threadId = safeId(thread, index);
      if (threadId !== id) return thread;
      found = true;
      return { ...thread, ...patch, id: thread?.id || id, updatedAt: new Date().toISOString() };
    });

    if (!found) {
      const current = threads.find((thread, index) => safeId(thread, index) === id) || { id };
      next.unshift({ ...current, ...patch, id, updatedAt: new Date().toISOString() });
    }

    setThreads(readThreads());
    writeThreads(next);
  }

  function deleteForever(id: string) {
    const overrides = readMemberOverrides();
    overrides[id] = { ...(overrides[id] || {}), status: "__deleted_forever", updatedAt: new Date().toISOString() };
    writeMemberOverrides(overrides);

    const next = readArrayKey(CONTROLLED_THREADS_KEY).filter((thread, index) => safeId(thread, index) !== id);
    writeThreads(next);
    setThreads(readThreads());
    setActiveId("");
  }

  return (
    <main style={pageStyle}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Member Request Command</div>
          <h1 style={h1}>Member request command center.</h1>
          <p style={sub}>One clean lane: New Request → Decision → Structured Message → Active Thread → Contact Release → Cleanup.</p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/command" style={goldBtn}>Member Command</Link>
            <Link href="/message-command" style={btn}>Message Command</Link>
            <Link href="/investor-room" style={btn}>Investor Room</Link>
            <Link href="/admin" style={btn}>Admin</Link>
          </div>

          <p style={muted}>Detected member/admin email: {email || "not detected"}</p>
        </section>

        <MemberOperatingGuide />

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