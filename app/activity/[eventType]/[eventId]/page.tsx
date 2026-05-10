"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../../components/VaultForgeMemberNav";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type EventRecord = Record<string, any>;
type ReplyRecord = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };
const hero: React.CSSProperties = { border: "1px solid rgba(232,196,107,.34)", background: "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))", borderRadius: 34, padding: 26, marginBottom: 22, boxShadow: "0 30px 90px rgba(0,0,0,.34)" };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))", borderRadius: 28, padding: 22, marginBottom: 18, boxShadow: "0 26px 80px rgba(0,0,0,.30)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 };
const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)", color: "#06100a", border: "none", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", cursor: "pointer", margin: "6px 6px 0 0", minHeight: 46 };
const ghost: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.055)", borderRadius: 999, padding: "13px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer", margin: "6px 6px 0 0", minHeight: 46 };
const danger: React.CSSProperties = { ...ghost, border: "1px solid rgba(255,120,120,.38)", color: "#ffd0d0" };
const chip: React.CSSProperties = { display: "inline-flex", border: "1px solid rgba(157,243,191,.25)", color: "#9df3bf", background: "rgba(157,243,191,.07)", borderRadius: 999, padding: "8px 11px", fontWeight: 850, fontSize: 13, margin: "0 7px 7px 0" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.075)", color: "white", padding: 15, fontSize: 16 };
const label: React.CSSProperties = { display: "block", fontWeight: 950, margin: "0 0 8px" };
const eyebrow: React.CSSProperties = { color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.72)", lineHeight: 1.55 };

function clean(value: unknown) { return String(value || "").trim(); }
function cleanEmail(value: unknown) { return clean(value).toLowerCase(); }
function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return match.slice(name.length + 1); }
}
function getEmail() {
  if (typeof window === "undefined") return "";
  return cleanEmail(localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || readCookie("vf_email") || readCookie("vf_admin_email") || "");
}
function isOwner(email: string) { return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true"; }
function labelText(value: unknown) { const text = clean(value || "event").replace(/_/g, " "); return text.slice(0, 1).toUpperCase() + text.slice(1); }
function first(...values: unknown[]) { for (const value of values) { const text = clean(value); if (text) return text; } return ""; }
function dateText(value: unknown) { const text = clean(value); if (!text) return "—"; const date = new Date(text); if (Number.isNaN(date.getTime())) return text; return date.toLocaleString(); }
async function safeJson(res: Response) { try { return await res.json(); } catch { return {}; } }

function Stat({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section style={card}>
      <div style={eyebrow}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </section>
  );
}

export default function ActivityEventRoom({ params }: { params: { eventType: string; eventId: string } }) {
  const eventTypeParam = clean(params.eventType);
  const eventId = clean(params.eventId);

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [replies, setReplies] = useState<ReplyRecord[]>([]);
  const [directReplyTo, setDirectReplyTo] = useState(OWNER_EMAIL);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading event room...");
  const [replyStatus, setReplyStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setStatus("Loading event room...");
    setReplyStatus("");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);
      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const res = await fetch(`/api/activity/event?event_type=${encodeURIComponent(eventTypeParam)}&event_id=${encodeURIComponent(eventId)}&email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load event context.");
      }

      setEvent(data.event || null);
      setReplies(Array.isArray(data.replies) ? data.replies : []);
      setDirectReplyTo(cleanEmail(data.direct_reply_to || data.event?.recipient_email || OWNER_EMAIL) || OWNER_EMAIL);
      setStatus("");
    } catch (error: any) {
      setEvent({
        id: eventId,
        type: eventTypeParam,
        title: `${labelText(eventTypeParam)} event`,
        note: "Event lookup failed, but this room can still hold follow-up after the API is connected.",
        priority: "medium",
        recipient_email: OWNER_EMAIL,
        created_at: new Date().toISOString(),
      });
      setDirectReplyTo(OWNER_EMAIL);
      setStatus(error?.message || "Could not load event room.");
    }
  }

  useEffect(() => { load(); }, [eventTypeParam, eventId]);

  const title = first(event?.title, event?.event_title, `${labelText(eventTypeParam)} event`);
  const note = first(event?.note, event?.event_description, event?.message, "Operational activity recorded in the VaultForge intelligence layer.");
  const signalId = first(event?.signal_id, event?.related_alert_id, event?.metadata?.signal_id);
  const itemId = first(event?.item_id, event?.deal_id, event?.project_id, event?.pain_id, event?.related_deal_id, event?.metadata?.item_id);
  const priority = first(event?.priority, event?.metadata?.priority, "medium");
  const memberEmail = cleanEmail(event?.member_email || event?.email || event?.sender_email || event?.from_email || event?.metadata?.member_email);
  const image = first(event?.image_url, event?.photo_url, event?.primary_photo_url, event?.metadata?.image_url);
  const type = first(event?.type, event?.event_type, eventTypeParam);

  const canReply = useMemo(() => email.includes("@") && directReplyTo.includes("@") && reply.trim().length > 1, [email, directReplyTo, reply]);

  async function sendReply() {
    if (busy) return;
    setBusy(true);
    setReplyStatus("");

    try {
      if (!email.includes("@")) throw new Error("Login email missing. Please log in again.");
      if (!directReplyTo.includes("@")) throw new Error("Reply target missing.");
      if (!reply.trim()) throw new Error("Write a reply before sending.");

      const res = await fetch("/api/messages/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-recipient-email": directReplyTo,
        },
        body: JSON.stringify({
          from_email: email,
          sender_email: email,
          to_email: directReplyTo,
          recipient_email: directReplyTo,
          target_email: directReplyTo,
          subject: `Reply: ${title}`,
          message: reply,
          body: reply,
          message_type: "activity_event_reply",
          source: "activity_event_room",
          event_type: eventTypeParam,
          event_id: eventId,
          item_id: itemId || null,
          signal_id: signalId || null,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not save reply.");
      }

      setReplies((current) => [{ id: `local-${Date.now()}`, from_email: email, to_email: directReplyTo, message: reply, body: reply, created_at: new Date().toISOString() }, ...current]);
      setReply("");
      setReplyStatus(data?.message || "Reply saved.");
    } catch (error: any) {
      setReplyStatus(error?.message || "Could not save reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) { a, button { width: 100%; box-sizing: border-box; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Activity Event" subtitle="Operational event room" />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Event Room</div>
          <h1 style={{ fontSize: "clamp(52px,11vw,96px)", lineHeight: 0.9, margin: "0 0 18px" }}>{title}</h1>
          <p style={{ ...muted, fontSize: 20 }}>{note}</p>

          <div>
            <span style={chip}>Type: {labelText(type)}</span>
            <span style={chip}>Priority: {priority}</span>
            <span style={chip}>Event: {eventId}</span>
            {signalId && <span style={chip}>Signal: {signalId}</span>}
            {itemId && <span style={chip}>Item: {itemId}</span>}
            {memberEmail && <span style={chip}>Member: {memberEmail}</span>}
            <span style={chip}>Reply To: {directReplyTo || "missing"}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <Link href="/activity" style={ghost}>Back to Activity</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          {signalId && <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link>}
          {signalId && <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link>}
          {itemId && <Link href={`/deal-room/${encodeURIComponent(itemId)}`} style={ghost}>Work Area</Link>}
          <Link href={`/messages/new?to=${encodeURIComponent(directReplyTo)}&signal_id=${encodeURIComponent(signalId)}&item_id=${encodeURIComponent(itemId)}&subject=${encodeURIComponent(`Reply: ${title}`)}`} style={btn}>Message / Reply</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        {status && <section style={{ ...card, color: status.toLowerCase().includes("could") || status.toLowerCase().includes("failed") ? "#ffd0d0" : "#9df3bf" }}>{status}</section>}

        <section style={grid}>
          <Stat title="What it is" value={labelText(type)} detail="This identifies whether the item came from routing, an intro, a response, pain, or activity." />
          <Stat title="Who is involved" value={memberEmail || email || "Unknown"} detail={`Direct reply target: ${directReplyTo}`} />
          <Stat title="Where it goes" value={signalId ? "Routing Room" : itemId ? "Work Area" : "Activity"} detail="Use the buttons above to move into the exact operational page." />
        </section>

        <section style={card}>
          <div style={eyebrow}>Context / Photo</div>
          {image ? (
            <img src={image} alt="VaultForge event context" style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(255,255,255,.14)", marginBottom: 16 }} />
          ) : (
            <div style={{ minHeight: 220, borderRadius: 24, border: "1px solid rgba(255,255,255,.12)", background: "linear-gradient(135deg, rgba(232,196,107,.14), rgba(181,92,255,.12), rgba(157,243,191,.08))", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.68)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>No image tied to this event yet</div>
          )}
          <p style={muted}>This room is the bridge between the activity stream and the exact deal, pain, routing, introduction, or response record.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Reply / Follow-up</div>
          {replyStatus && <p style={{ color: replyStatus.toLowerCase().includes("could") || replyStatus.toLowerCase().includes("missing") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>{replyStatus}</p>}
          <label style={label}>Write a reply or information request</label>
          <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Ask for details, reply to the intro, request next steps, ask for photos, address, price, timeline, or contact release..." style={{ ...input, minHeight: 190, lineHeight: 1.5 }} />
          <button type="button" onClick={sendReply} disabled={!canReply || busy} style={{ ...btn, width: "100%", marginTop: 16, opacity: !canReply || busy ? 0.58 : 1 }}>{busy ? "Saving Reply..." : `Save Reply to ${directReplyTo}`}</button>
        </section>

        <section style={card}>
          <div style={eyebrow}>Conversation / Response Chain</div>
          {replies.length === 0 ? (
            <p style={muted}>No replies are attached yet. Use the reply box above to start the event thread.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {replies.map((item, index) => (
                <article key={clean(item.id) || index} style={{ ...card, marginBottom: 0 }}>
                  <div>
                    <span style={chip}>{clean(item.from_email || item.sender_email || item.member_email || "unknown sender")}</span>
                    <span style={chip}>{dateText(item.created_at)}</span>
                  </div>
                  <p style={{ ...muted, fontSize: 18 }}>{clean(item.message || item.body || item.note || item.event_description || "Reply saved.")}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={{ ...card, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={eyebrow}>Current Safety Mode</div>
          <p style={muted}>This room records replies and operational context. It does not release private contact information automatically.</p>
        </section>
      </div>
    </main>
  );
}
