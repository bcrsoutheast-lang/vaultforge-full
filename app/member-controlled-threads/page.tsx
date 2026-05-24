"use client";


import Link from "next/link";
import VaultForgeAlertCenter from "../components/VaultForgeAlertCenter";
import { useEffect, useMemo, useState } from "react";

const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";
const ADMIN_INBOX_KEY = "vaultforge_admin_investor_inbox_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";
const INVESTOR_EXECUTION_REQUESTS_KEY = "vaultforge_investor_execution_requests_v1";
const DESIGNATED_ROUTE_MESSAGES_KEY = "vaultforge_designated_route_messages_v1";
const OWNER_DIRECT_MESSAGES_KEY = "vaultforge_owner_direct_messages_v1";
const SIMPLE_REQUESTS_KEY = "vaultforge_requests_v1";
const INVESTOR_ADMIN_MESSAGES_KEY = "vaultforge_investor_admin_messages_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const MEMBER_REQUEST_OVERRIDES_KEY = "vaultforge_member_request_overrides_v1";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const MEMBER_PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile", "vf_profile", "member_profile", "profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const COMPANY_LOGO_BACKUP_KEY = "vaultforge_member_company_logo_v1";

type Lane = "new" | "active" | "admin" | "investor" | "deal" | "pain" | "execution" | "saved" | "archived" | "passed" | "deleted";

type ThreadPatch = Record<string, any>;


function browserValue(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

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


function isOwnerAccount(value?: unknown) {
  const email = lower(value || browserValue("vf_email") || browserValue("member_email") || browserValue("email") || browserValue("vaultforge_investor_email"));
  return email === OWNER_EMAIL.toLowerCase();
}


function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => clean(item)).filter(Boolean);
  return [];
}

function currentEmail() {
  if (typeof window === "undefined") return "";
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
      browserValue("vf_email") ||
      browserValue("member_email") ||
      browserValue("email")
  );
}


function readMemberProfile() {
  if (typeof window === "undefined") return {};

  const backupPhoto = clean(browserValue(PROFILE_PHOTO_BACKUP_KEY));
  const backupLogo = clean(browserValue(COMPANY_LOGO_BACKUP_KEY));

  let merged: any = {};
  for (const key of MEMBER_PROFILE_KEYS) {
    const next = readJson<any>(key, {});
    if (next && typeof next === "object" && !Array.isArray(next)) {
      merged = { ...merged, ...next };
    }
  }

  const directory = readJson<any[]>(MEMBER_DIRECTORY_KEY, []);
  const email = lower(
    merged?.email ||
      browserValue("vf_email") ||
      browserValue("member_email") ||
      browserValue("email")
  );
  const match = Array.isArray(directory)
    ? directory.find((item) => lower(item?.email) === email) || directory[0]
    : null;

  const profile = {
    ...(match || {}),
    ...merged,
    email: clean(merged?.email || match?.email || email),
    name: clean(merged?.name || merged?.fullName || match?.name || match?.fullName || (email ? email.split("@")[0] : "VaultForge Member")),
    company: clean(merged?.company || merged?.companyName || match?.company || match?.companyName || "VaultForge Member"),
    title: clean(merged?.title || merged?.roleTitle || match?.title || match?.roleTitle || ""),
    memberType: clean(merged?.memberType || merged?.member_type || match?.memberType || match?.member_type || "Private Member"),
    basedState: clean(merged?.basedState || merged?.state || match?.basedState || match?.state || "GA"),
    statesOperated: Array.isArray(merged?.statesOperated) ? merged.statesOperated : Array.isArray(match?.statesOperated) ? match.statesOperated : [],
    canProvide: Array.isArray(merged?.canProvide) ? merged.canProvide : Array.isArray(match?.canProvide) ? match.canProvide : [],
    profilePhoto: clean(merged?.profilePhoto || merged?.photoUrl || match?.profilePhoto || match?.photoUrl || backupPhoto),
    companyLogo: clean(merged?.companyLogo || merged?.logoUrl || match?.companyLogo || match?.logoUrl || backupLogo),
    contactPreference: clean(merged?.contactPreference || match?.contactPreference || "VaultForge Message"),
    responseSpeed: clean(merged?.responseSpeed || match?.responseSpeed || "24 Hours"),
    verifiedStatus: clean(merged?.verifiedStatus || match?.verifiedStatus || "Unverified"),
  };

  return profile;
}

function publicMemberProfile(profile: any) {
  return {
    name: clean(profile?.name || "VaultForge Member"),
    company: clean(profile?.company || "Member Company"),
    title: clean(profile?.title || ""),
    memberType: clean(profile?.memberType || "Private Member"),
    basedState: clean(profile?.basedState || profile?.state || ""),
    statesOperated: Array.isArray(profile?.statesOperated) ? profile.statesOperated : [],
    canProvide: Array.isArray(profile?.canProvide) ? profile.canProvide : [],
    companyLogo: clean(profile?.companyLogo || ""),
    profilePhoto: clean(profile?.profilePhoto || ""),
    verifiedStatus: clean(profile?.verifiedStatus || "VaultForge Member"),
    contactPreference: clean(profile?.contactPreference || "VaultForge Message"),
    responseSpeed: clean(profile?.responseSpeed || "24 Hours"),
  };
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
  const body = clean(row?.message || row?.body || row?.notes || row?.requestMessage || row?.roomHeader || "Routed investor request");

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
    { key: DESIGNATED_ROUTE_MESSAGES_KEY, rows: readArrayKey(DESIGNATED_ROUTE_MESSAGES_KEY) },
    { key: OWNER_DIRECT_MESSAGES_KEY, rows: readArrayKey(OWNER_DIRECT_MESSAGES_KEY) },
    { key: SIMPLE_REQUESTS_KEY, rows: readArrayKey(SIMPLE_REQUESTS_KEY) },
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
      <div style={eyebrow}>Structured Message Ticket</div>
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
        {onCancel ? : null}
      </div>
    </div>
  );
}



const MOCK_MEMBER_PAYMENT_KEY = "vaultforge_mock_member_payment_v1";
const MOCK_INVESTOR_PAYMENT_KEY = "vaultforge_mock_investor_payment_v1";
const MOCK_APPROVALS_KEY = "vaultforge_mock_access_approvals_v1";

function mockAccessRecord(email: string, kind: "member" | "investor") {
  const approvals = readJson<Record<string, any>>(MOCK_APPROVALS_KEY, {});
  const key = `${kind}:${String(email || "").toLowerCase()}`;
  return approvals[key] || {};
}

function setMockAccessRecord(email: string, kind: "member" | "investor", patch: any) {
  const approvals = readJson<Record<string, any>>(MOCK_APPROVALS_KEY, {});
  const key = `${kind}:${String(email || "").toLowerCase()}`;
  approvals[key] = { ...(approvals[key] || {}), ...patch, updatedAt: new Date().toISOString() };
  writeJson(MOCK_APPROVALS_KEY, approvals);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("vaultforge-mock-access-change"));
    window.dispatchEvent(new Event("vaultforge-access-change"));
  }
}

function paymentStatusFor(email: string, kind: "member" | "investor") {
  const record = mockAccessRecord(email, kind);
  const paymentKey = kind === "member" ? MOCK_MEMBER_PAYMENT_KEY : MOCK_INVESTOR_PAYMENT_KEY;
  const direct = readJson<any>(paymentKey, {});
  return {
    approved: Boolean(
      record.approved ||
      record.adminApproved ||
      record.approvedForPayment ||
      record.paymentStatus === "ready" ||
      record.accessStatus === "payment_ready" ||
      direct.approved ||
      direct.approvedForPayment ||
      direct.paymentStatus === "ready" ||
      direct.accessStatus === "payment_ready"
    ),
    paid: Boolean(record.paid || record.paymentStatus === "paid" || direct.paid || direct.paymentStatus === "paid"),
    unlocked: Boolean(record.unlocked || record.accessStatus === "active" || direct.unlocked || direct.accessStatus === "active"),
  };
}

function MockPaymentButton({
  kind,
  email,
  label,
  price,
}: {
  kind: "member" | "investor";
  email: string;
  label: string;
  price: string;
}) {
  const [tick, setTick] = useState(0);
  const status = paymentStatusFor(email, kind);
  const ownerBypass = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const canPay = status.approved || ownerBypass;
  const unlocked = status.paid || status.unlocked;

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-mock-access-change", refresh);
    window.addEventListener("vaultforge-access-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-mock-access-change", refresh);
      window.removeEventListener("vaultforge-access-change", refresh);
    };
  }, []);

  return (
    <section className={canPay && !unlocked ? "vf-pulse" : ""} style={canPay && !unlocked ? goldPanel : panel}>
      <div style={eyebrow}>{label}</div>
      <h2 style={h2}>{unlocked ? "Room Unlocked" : canPay ? "PAYMENT READY — CLICK MOCK PAY" : "LOCKED — Waiting On Admin Approval"}</h2>
      <div style={{ ...panel, marginTop: 10, borderColor: canPay && !unlocked ? "rgba(255,220,104,.92)" : "rgba(255,70,70,.42)" }}>
        <div style={eyebrow}>{unlocked ? "Access Active" : canPay ? ownerBypass ? "Owner/Test Bypass — Payment Available" : "Admin Approved — Payment Available" : "Locked Preview"}</div>
        <p style={muted}>{unlocked ? "This room is unlocked." : canPay ? "This card should be visibly pulsing. Click Mock Pay to unlock for testing." : "Regular users should see this locked until admin approval."}</p>
      </div>
      <p style={{ ...sub, marginTop: 12 }}>
        {unlocked
          ? "Mock payment is complete. This room is unlocked for testing."
          : canPay
            ? `${price} mock payment is ready. Click to unlock this room for testing.`
            : "Submit profile and wait for admin approval. This room remains locked until approval and payment."}
      </p>
      <div style={{ ...row, marginTop: 14 }}>
        <button
          type="button"
          style={canPay ? goldBtn : btn}
          disabled={!canPay || unlocked}
          onClick={() => {
            setMockAccessRecord(email, kind, {
              approved: true,
              paid: true,
              unlocked: true,
              paymentStatus: "paid",
              accessStatus: "active",
            });
            const paymentKey = kind === "member" ? MOCK_MEMBER_PAYMENT_KEY : MOCK_INVESTOR_PAYMENT_KEY;
            writeJson(paymentKey, {
              email,
              paid: true,
              unlocked: true,
              paymentStatus: "paid",
              accessStatus: "active",
              paidAt: new Date().toISOString(),
            });
            setTick((value) => value + 1);
          }}
        >
          {unlocked ? "Paid / Unlocked" : canPay ? `Mock Pay ${price}` : "Locked Until Approved"}
        </button>

        <button
          type="button"
          style={btn}
          onClick={() => {
            setMockAccessRecord(email, kind, {
              approved: true,
              adminApproved: true,
              paymentStatus: "ready",
              accessStatus: "payment_ready",
            });
            setTick((value) => value + 1);
          }}
        >
          Test Approve
        </button>
      </div>
      <p style={muted}>Test mode only. This does not touch Stripe, auth, middleware, or billing.</p>
    </section>
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






function MemberTopPulseCards({
  dealCount,
  painCount,
  requestCount,
  messageCount,
  onDeals,
  onPain,
  onRequests,
  onMessages,
}: {
  dealCount: number;
  painCount: number;
  requestCount: number;
  messageCount: number;
  onDeals: () => void;
  onPain: () => void;
  onRequests: () => void;
  onMessages: () => void;
}) {
  const total = dealCount + painCount + requestCount + messageCount;

  const cardStyle = (count: number, border: string): React.CSSProperties => ({
    ...panel,
    borderColor: count > 0 ? border : "rgba(207,216,230,.16)",
    boxShadow: count > 0 ? `0 0 0 1px ${border}, 0 0 28px rgba(245,197,66,.10)` : "none",
    textAlign: "left",
    cursor: "pointer",
    width: "100%",
  });

  return (
    <section style={{ ...goldPanel, marginBottom: 18 }}>
      <div style={eyebrow}>Member Alerts • {total} Active</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 12 }}>
        <button type="button" className={dealCount > 0 ? "vf-pulse" : ""} style={cardStyle(dealCount, "rgba(245,197,66,.85)")} onClick={onDeals}>
          <div style={eyebrow}>Deals</div>
          <h2 style={h2}>{dealCount}</h2>
          <p style={muted}>deal opportunity rooms</p>
          <p style={muted}>Tap to open</p>
        </button>

        <button type="button" className={painCount > 0 ? "vf-pulse" : ""} style={cardStyle(painCount, "rgba(255,70,70,.70)")} onClick={onPain}>
          <div style={eyebrow}>Pain</div>
          <h2 style={h2}>{painCount}</h2>
          <p style={muted}>problem/pain signals</p>
          <p style={muted}>Tap to open</p>
        </button>

        <button type="button" className={requestCount > 0 ? "vf-pulse" : ""} style={cardStyle(requestCount, "rgba(0,132,255,.75)")} onClick={onRequests}>
          <div style={eyebrow}>Requests</div>
          <h2 style={h2}>{requestCount}</h2>
          <p style={muted}>routed investor/member work</p>
          <p style={muted}>Tap to open</p>
        </button>

        <button type="button" className={messageCount > 0 ? "vf-pulse" : ""} style={cardStyle(messageCount, "rgba(48,255,135,.70)")} onClick={onMessages}>
          <div style={eyebrow}>Messages</div>
          <h2 style={h2}>{messageCount}</h2>
          <p style={muted}>reply threads</p>
          <p style={muted}>Tap to open</p>
        </button>
      </div>
    </section>
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


function prettyInvestorText(value: unknown, fallback = "") {
  return clean(value, fallback)
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/TYPE:/g, "Type:")
    .replace(/URGENCY:/g, "Urgency:")
    .replace(/SUBJECT:/g, "Subject:")
    .replace(/SENDER:/g, "Sender:")
    .replace(/RECIPIENT:/g, "Recipient:")
    .replace(/HEADER:/g, "Header:")
    .replace(/MESSAGE:/g, "Message:")
    .replace(/AMOUNT \/ BUDGET:/g, "Amount / Budget:")
    .replace(/TIMELINE:/g, "Timeline:")
    .replace(/CONDITIONS:/g, "Conditions:")
    .replace(/NEXT MOVE:/g, "Next Move:")
    .replace(/PRIVATE NOTE:/g, "Private Note:");
}

function humanNeedLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace("Arv", "ARV")
    .replace("Jv", "JV")
    .replace("Ltv", "LTV")
    .replace("Ltc", "LTC");
}

function parsedInvestorTicketFields(message: string) {
  const pretty = prettyInvestorText(message);
  const out: Record<string, string> = {};
  const pairs: [string, RegExp][] = [
    ["Type", /Type:\s*([^\n]+)/i],
    ["Urgency", /Urgency:\s*([^\n]+)/i],
    ["Subject", /Subject:\s*([^\n]+)/i],
    ["Sender", /Sender:\s*([^\n]+)/i],
    ["Recipient", /Recipient:\s*([^\n]+)/i],
    ["Header", /Header:\s*([^\n]+)/i],
    ["Message", /Message:\s*([^\n]+)/i],
    ["Amount / Budget", /Amount \/ Budget:\s*([^\n]+)/i],
    ["Timeline", /Timeline:\s*([^\n]+)/i],
    ["Conditions", /Conditions:\s*([^\n]+)/i],
    ["Next Move", /Next Move:\s*([^\n]+)/i],
    ["Private Note", /Private Note:\s*([^\n]+)/i],
  ];

  pairs.forEach(([label, regex]) => {
    const match = pretty.match(regex);
    if (match?.[1]) out[label] = clean(match[1]);
  });

  return out;
}

function structuredInvestorNeeds(thread: any) {
  const details = thread?.details && typeof thread.details === "object" ? thread.details : {};
  const parsed = parsedInvestorTicketFields(thread?.body || thread?.message || thread?.notes || thread?.roomHeader || "");
  const rows: { label: string; value: string }[] = [];

  Object.entries(details).forEach(([key, value]) => {
    const text = clean(value);
    if (text && !["Not listed", "NA", "N/A"].includes(text)) rows.push({ label: humanNeedLabel(key), value: text });
  });

  Object.entries(parsed).forEach(([label, value]) => {
    const text = clean(value);
    if (text && !["Not listed", "NA", "N/A"].includes(text) && !rows.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
      rows.push({ label, value: text });
    }
  });

  return rows.slice(0, 14);
}

function investorNeedAI(thread: any) {
  const text = `${thread?.requestTitle || ""} ${thread?.title || ""} ${thread?.body || ""} ${thread?.message || ""} ${thread?.roomHeader || ""} ${JSON.stringify(thread?.details || {})}`.toLowerCase();

  if (text.includes("lender") || text.includes("hard money") || text.includes("capital") || text.includes("funding") || text.includes("loan")) {
    return {
      lane: "Private lender / capital partner",
      warning: "Verify capital amount, purchase price, ARV, repair budget, close deadline, collateral, docs, and exit strategy.",
      next: "Ask investor for any missing numbers and decide if you can fund, refer, or request more docs.",
      urgency: text.includes("urgent") || text.includes("closing") || text.includes("deadline") ? "High" : "Medium",
    };
  }

  if (text.includes("contractor") || text.includes("rehab") || text.includes("scope") || text.includes("construction")) {
    return {
      lane: "Contractor / operator",
      warning: "Verify trade, scope, access, photos, bid deadline, start date, permit status, and budget.",
      next: "Reply with whether you can bid, need photos/scope, or can refer a qualified contractor/operator.",
      urgency: text.includes("urgent") || text.includes("stalled") ? "High" : "Medium",
    };
  }

  if (text.includes("title") || text.includes("closing") || text.includes("escrow") || text.includes("legal")) {
    return {
      lane: "Title / closing specialist",
      warning: "Verify issue type, close date, contract, title report, payoff, party status, and escrow contact.",
      next: "Ask for title issue summary and closing date before contact release.",
      urgency: "High",
    };
  }

  if (text.includes("operator") || text.includes("boots") || text.includes("ground") || text.includes("site")) {
    return {
      lane: "Operator / boots-on-ground",
      warning: "Verify task, location, deadline, access details, proof required, and compensation.",
      next: "Reply if you can handle the local task or need more site details.",
      urgency: text.includes("same day") || text.includes("urgent") ? "High" : "Medium",
    };
  }

  if (text.includes("jv") || text.includes("partner")) {
    return {
      lane: "JV / partner match",
      warning: "Verify role needed, contribution, deal stage, proposed split, timeline, and proof.",
      next: "Clarify partner role and whether you can contribute capital, operations, or buyer path.",
      urgency: "Medium",
    };
  }

  if (text.includes("insurance")) {
    return {
      lane: "Insurance / risk lane",
      warning: "Verify coverage type, property condition, deadline, lender requirement, and known issues.",
      next: "Ask for property condition and coverage deadline.",
      urgency: "Medium",
    };
  }

  return {
    lane: "Designated member lane",
    warning: "Request is missing clean structured need fields.",
    next: "Ask investor for exact need, market, urgency, amount, conditions, and desired next move.",
    urgency: "Normal",
  };
}

function InvestorNeedsBlock({ thread }: { thread: any }) {
  const needs = structuredInvestorNeeds(thread);
  const ai = investorNeedAI(thread);

  return (
    <div style={{ ...goldPanel, marginTop: 18 }}>
      <div style={eyebrow}>Investor Needs / Smart AI Read</div>
      <h3 style={h3}>{ai.lane}</h3>

      <div style={grid}>
        <div style={panel}>
          <div style={eyebrow}>Urgency</div>
          <p style={muted}>{ai.urgency}</p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>AI Warning</div>
          <p style={muted}>{ai.warning}</p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>Best Next Move</div>
          <p style={muted}>{ai.next}</p>
        </div>
      </div>

      <div style={{ ...grid, marginTop: 12 }}>
        {needs.length ? needs.map((need) => (
          <div key={`${need.label}-${need.value}`} style={panel}>
            <div style={eyebrow}>{need.label}</div>
            <p style={muted}>{need.value}</p>
          </div>
        )) : (
          <div style={panel}>
            <div style={eyebrow}>Missing Structured Info</div>
            <p style={muted}>Ask for amount, timeline, market, conditions, and next move.</p>
          </div>
        )}
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
      <p style={{ ...muted, whiteSpace: "pre-wrap" }}>{prettyInvestorText(roomHeaderFor(thread))}</p>
      <p style={muted}>Investor: {profile?.contactName || thread?.investorName || "Not listed"} • {profile?.company || thread?.investorCompany || "Company not listed"}</p>
      <p style={muted}>State: {thread?.state || "not listed"} • Messages: {(thread?.messages || []).length || 0}</p>
      <p style={muted}>AI Lane: {investorNeedAI(thread).lane} • Urgency: {investorNeedAI(thread).urgency}</p>
      <p style={muted}>Click to open request detail</p>
    </button>
  );
}

function MessageBubble({ message }: { message: any }) {
  const role = clean(message?.role || message?.from || "System");
  return (
    <div style={panel}>
      <div style={eyebrow}>{role} • {clean(message?.createdAt || message?.at || "")}</div>
      <p style={{ ...sub, whiteSpace: "pre-wrap" }}>{prettyInvestorText(message?.body || message?.message || message?.text || "")}</p>
    </div>
  );
}


function MemberIdentityPanel({ profile }: { profile: any }) {
  const logo = clean(profile?.companyLogo || profile?.profilePhoto || "");
  const states = Array.isArray(profile?.statesOperated) && profile.statesOperated.length ? profile.statesOperated.join(" • ") : clean(profile?.basedState || "State not listed");
  const provide = Array.isArray(profile?.canProvide) && profile.canProvide.length ? profile.canProvide.join(" • ") : "Capabilities not listed";

  return (
        <section style={{ ...goldPanel, marginBottom: 18 }}>
      <div style={{ ...row, alignItems: "flex-start" }}>
        {logo ? (
          <img
            src={logo}
            alt="Member company"
            style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(245,197,66,.45)" }}
          />
        ) : null}

        <div>
          <div style={eyebrow}>Member Command Identity</div>
          <h2 style={h2}>{clean(profile?.company || profile?.name || "VaultForge Member")}</h2>
          <p style={sub}>{clean(profile?.name || "Member")} • {clean(profile?.memberType || "Private Member")}</p>
          <p style={muted}>{states}</p>
          <p style={muted}>Can provide: {provide}</p>
          <p style={muted}>Contact preference: {clean(profile?.contactPreference || "VaultForge Message")} • Response: {clean(profile?.responseSpeed || "24 Hours")}</p>
        </div>
      </div>
    </section>
  );
}

function MemberPublicProfileCard({ profile }: { profile: any }) {
  const pub = publicMemberProfile(profile);
  return (
    <div style={panel}>
      <div style={eyebrow}>Member Profile Attached</div>
      <div style={{ ...row, alignItems: "flex-start" }}>
        {pub.companyLogo || pub.profilePhoto ? (
          <img
            src={pub.companyLogo || pub.profilePhoto}
            alt="Member profile"
            style={{ width: 82, height: 82, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(245,197,66,.35)" }}
          />
        ) : null}

        <div>
          <h3 style={h3}>{pub.company}</h3>
          <p style={muted}>{pub.memberType}{pub.title ? ` • ${pub.title}` : ""}</p>
          <p style={muted}>States: {pub.statesOperated.length ? pub.statesOperated.join(" • ") : pub.basedState || "Not listed"}</p>
          <p style={muted}>Capabilities: {pub.canProvide.length ? pub.canProvide.join(" • ") : "Not listed"}</p>
          <p style={muted}>Personal email and phone stay hidden until contact release.</p>
        </div>
      </div>
    </div>
  );
}


function RequestDetail({ thread, onPatch, onDeleteForever, onBack }: { thread: any; onPatch: (patch: ThreadPatch) => void; onDeleteForever: () => void; onBack: () => void }) {
  const [reply, setReply] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const profile = profileFrom(thread);
  const memberProfile = typeof window === "undefined" ? {} : readMemberProfile();
  const memberPublic = publicMemberProfile(memberProfile);
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
      memberProfilePublic: memberPublic,
      memberCompany: memberPublic.company,
      memberLogo: memberPublic.companyLogo,
      memberProfilePhoto: memberPublic.profilePhoto,
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

      <InvestorNeedsBlock thread={thread} />

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

        <MemberPublicProfileCard profile={memberProfile} />

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
            memberProfilePublic: memberPublic,
            memberCompany: memberPublic.company,
            memberLogo: memberPublic.companyLogo,
            memberProfilePhoto: memberPublic.profilePhoto,
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
      <div style={eyebrow}>Member Area Instructions</div>
      <h2 style={h2}>Everything has a place.</h2>
      <p style={sub}>
        This member area now works like the Investor Room: top alert cards first, then one clean operating board. Alerts, routing, intelligence, admin replies, and investor replies stay behind the scenes inside the correct request card.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        <MemberSequenceCard step="01 New Requests" title="Review Routed Work" note="Fresh investor/admin routed requests land here first. Open the card before taking action." active />
        <MemberSequenceCard step="02 Decision" title="Accept / Review / Pass" note="Accept moves it into Active Threads. Pass removes it from active work. Review keeps it visible while you evaluate." />
        <MemberSequenceCard step="03 Request Detail" title="Investor Profile Attached" note="Every detail card should show the request type, Deal/Pain/execution context, investor profile, and what the investor needs." />
        <MemberSequenceCard step="04 Structured Message" title="Reply With Context" note="Messages include sender, recipient, request header, urgency, amount, timeline, conditions, next move, and private note." />
        <MemberSequenceCard step="05 Contact Release" title="Protect The Network" note="Contact stays locked until admin/member approval. Release contact only when the request is ready." />
        <MemberSequenceCard step="06 Active Work" title="Execution Thread" note="Funding, title, contractor, operator, insurance, JV, or boots-on-ground work stays inside the same active thread." />
        <MemberSequenceCard step="07 Cleanup" title="Save / Archive / Delete" note="Save for follow-up, archive completed or inactive work, delete clutter, and delete forever only when it should be removed." />
      </div>
    </section>
  );
}




function MemberLaneGuide() {
  return (
    <section style={{ ...panel, marginBottom: 18 }}>
      <div style={eyebrow}>Member Operating Map</div>
      <h2 style={h2}>Cards grouped by what they do.</h2>
      <p style={sub}>
        Top cards alert you. Lower cards organize the work: requests, active threads, deal/pain lanes, execution, and cleanup.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        <div style={panel}><div style={eyebrow}>New Requests</div><p style={muted}>Fresh routed work needing your decision.</p></div>
        <div style={panel}><div style={eyebrow}>Active Work</div><p style={muted}>Accepted work threads you are handling.</p></div>
        <div style={panel}><div style={eyebrow}>Deal / Pain Requests</div><p style={muted}>Opportunity and problem cards with investor needs and AI read attached.</p></div>
        <div style={panel}><div style={eyebrow}>Execution Requests</div><p style={muted}>Lender, contractor, title, operator, insurance, JV, and boots-on-ground requests.</p></div>
        <div style={panel}><div style={eyebrow}>Cleanup</div><p style={muted}>Saved, archived, passed, and deleted folders keep the workspace clean.</p></div>
      </div>
    </section>
  );
}




export default function MemberControlledThreadsPage() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [lane, setLane] = useState<Lane>("new");
  const [activeId, setActiveId] = useState("");
  const [mounted, setMounted] = useState(false);

  function refresh() {
    setEmail(currentEmail());
    setThreads(readThreads());
  }

  useEffect(() => {
    setMounted(true);
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

  const isOwner = isOwnerAccount(email);
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


  const topDealCount = categorized.deal.length;
  const topPainCount = categorized.pain.length;
  const topRequestCount = categorized.new.length + categorized.active.length + categorized.execution.length;
  const topMessageCount = categorized.admin.length + categorized.investor.length + visibleThreads.filter((thread) => (thread?.messages || []).length > 0).length;

  const openRows = categorized[lane] || [];
  const activeThread = activeId ? visibleThreads.find((thread, index) => safeId(thread, index) === activeId) : null;
  const memberProfile = readMemberProfile();

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

  if (!mounted) {
    return (
      <main style={pageStyle}>
        <div style={wrap}>

        <MemberTopPulseCards
          dealCount={topDealCount}
          painCount={topPainCount}
          requestCount={topRequestCount}
          messageCount={topMessageCount}
          onDeals={() => { setLane("deal"); setActiveId(""); }}
          onPain={() => { setLane("pain"); setActiveId(""); }}
          onRequests={() => { setLane("new"); setActiveId(""); }}
          onMessages={() => { setLane("investor"); setActiveId(""); }}
        />

<VaultForgeAlertCenter audience="member" title="Member Alerts" />
          <section style={hero}>
            <div style={eyebrow}>VaultForge Member Request Command</div>
            <h1 style={h1}>Preparing member room.</h1>
            <p style={sub}>Loading browser workspace safely.</p>
          </section>
</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      

<style>{`
@keyframes vfPulsePay {
  0% { box-shadow: 0 0 0 0 rgba(255,220,104,.0), 0 0 0 rgba(255,220,104,.0); transform: scale(1); outline: 1px solid rgba(245,197,66,.35); }
  35% { box-shadow: 0 0 0 8px rgba(255,220,104,.26), 0 0 42px rgba(255,220,104,.55); transform: scale(1.018); outline: 3px solid rgba(245,197,66,.85); }
  70% { box-shadow: 0 0 0 3px rgba(255,220,104,.10), 0 0 24px rgba(255,220,104,.28); transform: scale(1.006); outline: 2px solid rgba(245,197,66,.62); }
  100% { box-shadow: 0 0 0 0 rgba(255,220,104,.0), 0 0 0 rgba(255,220,104,.0); transform: scale(1); outline: 1px solid rgba(245,197,66,.35); }
}
@keyframes vfAlertFlash {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
  100% { filter: brightness(1); }
}
.vf-pulse {
  animation: vfPulsePay .95s ease-in-out infinite, vfAlertFlash .95s ease-in-out infinite;
  border-color: rgba(255,220,104,.95) !important;
}
`}</style>


      <div style={wrap}>
<section style={hero}>
          <div style={eyebrow}>VaultForge Member Request Command</div>
          <div style={{ ...row, alignItems: "center" }}>
            {memberProfile?.companyLogo ? (
              <img src={memberProfile.companyLogo} alt="Company logo" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.45)" }} />
            ) : memberProfile?.profilePhoto ? (
              <img src={memberProfile.profilePhoto} alt="Profile" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.45)" }} />
            ) : null}
            <h1 style={h1}>{clean(memberProfile?.company || memberProfile?.name || "Member execution command center.")}</h1>
          </div>
          <p style={sub}>New Request → Open Detail → Accept / Pass / Message → Active Thread → Contact Release → Save / Archive / Delete.</p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/command" style={goldBtn}>Member Command</Link>
            <Link href="/message-command" style={btn}>Message Command</Link>
            {isOwner ? <Link href="/investor-room" style={btn}>Investor Room</Link> : null}
            {isOwner ? <Link href="/admin" style={btn}>Admin</Link> : null}
          </div>

          <p style={muted}>Detected member/admin email: {email || "not detected"}</p>
        </section>

        <MockPaymentButton
          kind="member"
          email={email || currentEmail()}
          label="Member Payment Unlock"
          price="$49"
        />

        <MemberIdentityPanel profile={memberProfile} />

        <MemberOperatingGuide />

        <MemberLaneGuide />

        <Section title="Member Operating Board">
          <div style={grid}>
            <LaneCard title="New Requests" count={categorized.new.length} note="fresh routed work needing a decision" active={lane === "new"} pulse={categorized.new.length > 0} onClick={() => { setLane("new"); setActiveId(""); }} />
            <LaneCard title="Active Work" count={categorized.active.length} note="accepted threads being worked" active={lane === "active"} pulse={categorized.active.length > 0} onClick={() => { setLane("active"); setActiveId(""); }} />
            <LaneCard title="Deal Requests" count={categorized.deal.length} note="deal/opportunity cards" active={lane === "deal"} pulse={categorized.deal.length > 0} onClick={() => { setLane("deal"); setActiveId(""); }} />
            <LaneCard title="Pain Requests" count={categorized.pain.length} note="problem-solving cards" active={lane === "pain"} pulse={categorized.pain.length > 0} onClick={() => { setLane("pain"); setActiveId(""); }} />
            <LaneCard title="Execution Requests" count={categorized.execution.length} note="lender/title/contractor/operator requests" active={lane === "execution"} pulse={categorized.execution.length > 0} onClick={() => { setLane("execution"); setActiveId(""); }} />
            <LaneCard title="Saved" count={categorized.saved.length} note="saved request cards" active={lane === "saved"} onClick={() => { setLane("saved"); setActiveId(""); }} />
            <LaneCard title="Archived" count={categorized.archived.length} note="completed or hidden request cards" active={lane === "archived"} onClick={() => { setLane("archived"); setActiveId(""); }} />
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
          <Section title={`${lane.toUpperCase()} Work Cards`}>
            {openRows.length ? (
              <div style={grid}>
                {openRows.map((thread, index) => {
                  const id = safeId(thread, index);
                  return <RequestCard key={id} thread={thread} active={activeId === id} onOpen={() => setActiveId(id)} />;
                })}
              </div>
            ) : (
              <div style={panel}>
                <h2 style={h2}>No cards in this group.</h2>
                <p style={sub}>This group is empty right now. When admin routes or approves a matching investor request, the card appears here with profile, request header, message thread, and action buttons.</p>
              </div>
            )}
          </Section>
        )}
      </div>
    </main>
  );
}