"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Folder = "active" | "unread" | "saved" | "archived" | "deleted";
type Lane = "Owner" | "Investor" | "Member" | "Deal Room" | "Pain Room" | "General";

type ProfileSnapshot = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  memberType: string;
  basedState: string;
  basedCity: string;
  basedCounty: string;
  verifiedStatus: string;
  contactPreference: string;
  responseSpeed: string;
  profilePhoto: string;
  companyLogo: string;
};

type RoomSnapshot = {
  id: string;
  kind: string;
  title: string;
  owner: string;
  source: string;
};

type Thread = {
  id: string;
  lane: Lane;
  from: string;
  recipient: string;
  title: string;
  room: string;
  message: string;
  folder: Folder;
  unread: boolean;
  createdAt: string;
  senderProfile?: ProfileSnapshot;
  recipientProfile?: Partial<ProfileSnapshot>;
  roomSnapshot?: RoomSnapshot;
};

const THREADS_KEY = "vf_message_center_threads_v1";
const FOREVER_KEY = "vf_message_center_deleted_forever_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const COMPANY_LOGO_BACKUP_KEY = "vaultforge_member_company_logo_v1";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const nav: React.CSSProperties = { ...row, marginBottom: 20 };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em" };

const button: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const goldButton: React.CSSProperties = {
  ...button,
  background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
  color: "#080a10",
  border: "1px solid rgba(255,220,90,.65)",
};

const redButton: React.CSSProperties = {
  ...button,
  background: "rgba(90,10,18,.72)",
  color: "#ffb2b2",
  border: "1px solid rgba(255,65,65,.65)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 26,
  background: "rgba(15,21,34,.88)",
  padding: 24,
  marginBottom: 20,
};

const goldCard: React.CSSProperties = {
  ...card,
  borderColor: "rgba(245,197,66,.42)",
  background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
};

const tile: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.35)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
  color: "#f7f8ff",
  textAlign: "left",
};

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 };
const threadGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))", gap: 14 };

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  borderRadius: 18,
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000, display: "block", marginBottom: 8 };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 28, lineHeight: 1, letterSpacing: "-.05em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };
const avatar: React.CSSProperties = { width: 52, height: 52, objectFit: "cover", borderRadius: 999, border: "1px solid rgba(245,197,66,.45)", background: "rgba(0,0,0,.35)" };

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function currentEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("vaultforge_email") ||
    window.localStorage.getItem("email") ||
    window.localStorage.getItem("vf_member_email") ||
    window.localStorage.getItem("vf_current_email") ||
    ""
  );
}

function defaultProfile(): ProfileSnapshot {
  const email = currentEmail();
  return {
    id: email || "local_member",
    name: "VaultForge Member",
    company: "Company not listed",
    email,
    phone: "",
    title: "",
    memberType: "Member",
    basedState: "",
    basedCity: "",
    basedCounty: "",
    verifiedStatus: "Unverified",
    contactPreference: "VaultForge Message",
    responseSpeed: "24 Hours",
    profilePhoto: "",
    companyLogo: "",
  };
}

function normalizeProfile(row: any): ProfileSnapshot {
  const base = defaultProfile();
  const backupPhoto = typeof window !== "undefined" ? clean(window.localStorage.getItem(PROFILE_PHOTO_BACKUP_KEY)) : "";
  const backupLogo = typeof window !== "undefined" ? clean(window.localStorage.getItem(COMPANY_LOGO_BACKUP_KEY)) : "";
  const email = clean(row?.email || row?.memberEmail || row?.senderEmail || base.email);
  return {
    id: clean(row?.id || email || base.id, base.id),
    name: clean(row?.name || row?.fullName || row?.full_name || base.name, base.name),
    company: clean(row?.company || row?.companyName || base.company, base.company),
    email,
    phone: clean(row?.phone || row?.phoneNumber || base.phone),
    title: clean(row?.title || row?.roleTitle || base.title),
    memberType: clean(row?.memberType || row?.member_type || base.memberType, base.memberType),
    basedState: clean(row?.basedState || row?.state || row?.homeState || base.basedState),
    basedCity: clean(row?.basedCity || row?.city || base.basedCity),
    basedCounty: clean(row?.basedCounty || row?.county || base.basedCounty),
    verifiedStatus: clean(row?.verifiedStatus || base.verifiedStatus, base.verifiedStatus),
    contactPreference: clean(row?.contactPreference || base.contactPreference, base.contactPreference),
    responseSpeed: clean(row?.responseSpeed || base.responseSpeed, base.responseSpeed),
    profilePhoto: clean(row?.profilePhoto || row?.photoUrl || row?.avatar || backupPhoto),
    companyLogo: clean(row?.companyLogo || row?.logoUrl || backupLogo),
  };
}

function readProfile(): ProfileSnapshot {
  if (typeof window === "undefined") return defaultProfile();
  for (const key of PROFILE_KEYS) {
    const found = parseJson<any | null>(window.localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalizeProfile(found);
  }
  return defaultProfile();
}

function parseThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  const rows = parseJson<any[]>(window.localStorage.getItem(THREADS_KEY), []);
  return Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        lane: row?.lane || "General",
        from: clean(row?.from || row?.senderProfile?.email || row?.senderProfile?.name || "Not listed", "Not listed"),
        recipient: clean(row?.recipient || "VaultForge Owner", "VaultForge Owner"),
        title: clean(row?.title || "Untitled Message", "Untitled Message"),
        room: clean(row?.room || row?.roomSnapshot?.title || "General", "General"),
        message: clean(row?.message || "No message entered.", "No message entered."),
        folder: row?.folder || "active",
        unread: Boolean(row?.unread),
        createdAt: clean(row?.createdAt || new Date().toLocaleString(), new Date().toLocaleString()),
      }))
    : [];
}

function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("vaultforge-message-change"));
}

function deletedForeverIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseJson<string[]>(window.localStorage.getItem(FOREVER_KEY), []);
}

function saveDeletedForever(id: string) {
  if (typeof window === "undefined") return;
  const ids = Array.from(new Set([...deletedForeverIds(), id]));
  window.localStorage.setItem(FOREVER_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("vaultforge-message-change"));
}

function cleanParam(value: string | null) {
  return String(value || "").trim();
}

function laneFromParam(value: string | null): Lane {
  const text = cleanParam(value).toLowerCase();
  if (text === "deal" || text === "deals" || text === "deal room") return "Deal Room";
  if (text === "pain" || text === "pain room") return "Pain Room";
  if (text === "investor") return "Investor";
  if (text === "member") return "Member";
  if (text === "general") return "General";
  return "Owner";
}

function folderTitle(folder: Folder) {
  if (folder === "active") return "Active Threads";
  if (folder === "unread") return "Unread Threads";
  if (folder === "saved") return "Saved Threads";
  if (folder === "archived") return "Archived Threads";
  return "Deleted Threads";
}

function profileDisplay(profile?: Partial<ProfileSnapshot>) {
  if (!profile) return "Profile not attached";
  return [profile.name, profile.company, profile.email, profile.memberType, profile.basedState].filter(Boolean).join(" • ") || "Profile not attached";
}

function StatCard({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...tile, cursor: "pointer", minHeight: 150, borderColor: active ? "rgba(245,197,66,.75)" : "rgba(245,197,66,.35)" }}>
      <div style={eyebrow}>{label}</div>
      <div style={{ color: "#1e90ff", fontSize: 44, fontWeight: 1000, margin: "8px 0" }}>{count}</div>
      <p style={muted}>thread(s)</p>
      <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [folder, setFolder] = useState<Folder>("active");
  const [selected, setSelected] = useState<Thread | null>(null);
  const [profile, setProfile] = useState<ProfileSnapshot>(() => defaultProfile());

  const [lane, setLane] = useState<Lane>("Owner");
  const [from, setFrom] = useState("");
  const [recipient, setRecipient] = useState("VaultForge Owner");
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomKind, setRoomKind] = useState("");

  useEffect(() => {
    const forever = new Set(deletedForeverIds());
    const loaded = parseThreads().filter((thread) => !forever.has(thread.id));
    const currentProfile = readProfile();

    setThreads(loaded);
    setProfile(currentProfile);

    const params = new URLSearchParams(window.location.search);
    const incomingFrom = cleanParam(params.get("from")) || currentProfile.email || currentProfile.name;
    const incomingRecipient = cleanParam(params.get("recipient")) || cleanParam(params.get("owner")) || "VaultForge Owner";
    const incomingTitle = cleanParam(params.get("title"));
    const incomingRoom = cleanParam(params.get("room"));
    const incomingKind = cleanParam(params.get("kind"));
    const incomingRoomId = cleanParam(params.get("roomId")) || cleanParam(params.get("id"));

    if (incomingKind) setLane(laneFromParam(incomingKind));
    if (incomingFrom) setFrom(incomingFrom);
    if (incomingRecipient) setRecipient(incomingRecipient);
    if (incomingTitle) setTitle(incomingTitle);
    if (incomingRoom) setRoom(incomingRoom);
    if (incomingRoomId) setRoomId(incomingRoomId);
    if (incomingKind) setRoomKind(incomingKind);
    setMessage("");
  }, []);

  const grouped = useMemo(() => ({
    active: threads.filter((thread) => thread.folder === "active"),
    unread: threads.filter((thread) => thread.unread && thread.folder !== "deleted"),
    saved: threads.filter((thread) => thread.folder === "saved"),
    archived: threads.filter((thread) => thread.folder === "archived"),
    deleted: threads.filter((thread) => thread.folder === "deleted"),
  }), [threads]);

  const visible = folder === "unread" ? grouped.unread : grouped[folder];

  function persist(next: Thread[]) {
    setThreads(next);
    saveThreads(next);
  }

  function createThread() {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle && !cleanMessage) return;

    const sender = readProfile();
    const finalRoom = room.trim() || "General";
    const finalTitle = cleanTitle || `Message about ${finalRoom}`;
    const finalRecipient = recipient.trim() || "VaultForge Owner";

    const thread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lane,
      from: from.trim() || sender.email || sender.name || "Not listed",
      recipient: finalRecipient,
      title: finalTitle,
      room: finalRoom,
      message: cleanMessage || "No message entered.",
      folder: "active",
      unread: true,
      createdAt: new Date().toLocaleString(),
      senderProfile: sender,
      recipientProfile: { name: finalRecipient, email: finalRecipient.includes("@") ? finalRecipient : "", memberType: "Owner" },
      roomSnapshot: { id: roomId || finalRoom, kind: roomKind || lane, title: finalRoom, owner: finalRecipient, source: "messages" },
    };

    const next = [thread, ...threads];
    persist(next);
    setSelected(thread);
    setFolder("active");
    setTitle("");
    setRoom("");
    setMessage("");
  }

  function moveThread(id: string, nextFolder: Folder) {
    const next = threads.map((thread) => thread.id === id ? { ...thread, folder: nextFolder, unread: nextFolder === "unread" ? true : thread.unread } : thread);
    persist(next);
    if (selected?.id === id) setSelected({ ...selected, folder: nextFolder });
    setFolder(nextFolder);
  }

  function markRead(id: string, unread: boolean) {
    const next = threads.map((thread) => thread.id === id ? { ...thread, unread } : thread);
    persist(next);
    if (selected?.id === id) setSelected({ ...selected, unread });
  }

  function deleteForever(id: string) {
    saveDeletedForever(id);
    const next = threads.filter((thread) => thread.id !== id);
    persist(next);
    setSelected(null);
    setFolder("deleted");
  }

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={button}>Home</Link>
          <Link href="/investor-room" style={button}>Investor Room</Link>
          <Link href="/command" style={button}>Command</Link>
          <Link href="/messages" style={goldButton}>Messages</Link>
          <Link href="/profile" style={button}>Profile</Link>
          <Link href="/logout" style={redButton}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={h1}>Messages attached to member profiles and rooms.</h1>
          <p style={sub}>Every new thread now carries sender profile, recipient, title, room, lane, and message context.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Current Sender Profile</div>
          <div style={{ ...row, marginTop: 14 }}>
            {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={avatar} /> : null}
            <div>
              <h3 style={h3}>{profile.name}</h3>
              <p style={muted}>{profile.company} • {profile.email || "Email not listed"} • {profile.memberType}</p>
              <p style={muted}>{[profile.basedCity, profile.basedState].filter(Boolean).join(", ") || "Location not listed"} • {profile.verifiedStatus}</p>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Message Folders</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <StatCard label="Active" count={grouped.active.length} active={folder === "active"} onClick={() => setFolder("active")} />
            <StatCard label="Unread" count={grouped.unread.length} active={folder === "unread"} onClick={() => setFolder("unread")} />
            <StatCard label="Saved" count={grouped.saved.length} active={folder === "saved"} onClick={() => setFolder("saved")} />
            <StatCard label="Archived" count={grouped.archived.length} active={folder === "archived"} onClick={() => setFolder("archived")} />
            <StatCard label="Deleted" count={grouped.deleted.length} active={folder === "deleted"} onClick={() => setFolder("deleted")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Create Command Thread</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <label><span style={label}>Lane</span><select value={lane} onChange={(event) => setLane(event.target.value as Lane)} style={input}><option>Owner</option><option>Investor</option><option>Member</option><option>Deal Room</option><option>Pain Room</option><option>General</option></select></label>
            <label><span style={label}>From</span><input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="sender email/name" style={input} /></label>
            <label><span style={label}>Recipient</span><input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="recipient email/name" style={input} /></label>
            <label><span style={label}>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="message title" style={input} /></label>
            <label><span style={label}>Room</span><input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Deal Room / Pain Room / General" style={input} /></label>
          </div>

          <label style={{ display: "block", marginTop: 16 }}>
            <span style={label}>Message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the message here" rows={5} style={{ ...input, resize: "vertical" }} />
          </label>

          <div style={{ ...row, marginTop: 16 }}><button type="button" onClick={createThread} style={goldButton}>Create Message Thread</button></div>
        </section>

        {selected ? (
          <section style={card}>
            <div style={eyebrow}>{selected.lane} • {selected.folder}</div>
            <h2 style={h2}>{selected.title}</h2>
            <div style={{ ...grid, marginTop: 14 }}>
              <div style={tile}><div style={eyebrow}>Sender Profile</div><p style={sub}>{selected.senderProfile?.name || selected.from}</p><p style={muted}>{profileDisplay(selected.senderProfile)}</p></div>
              <div style={tile}><div style={eyebrow}>Recipient</div><p style={sub}>{selected.recipient}</p><p style={muted}>{profileDisplay(selected.recipientProfile)}</p></div>
              <div style={tile}><div style={eyebrow}>Room</div><p style={sub}>{selected.room}</p><p style={muted}>{selected.roomSnapshot?.kind || selected.lane}</p></div>
            </div>
            <div style={{ ...tile, marginTop: 14 }}><div style={eyebrow}>Message</div><p style={sub}>{selected.message}</p><p style={muted}>Created: {selected.createdAt}</p></div>
            <div style={{ ...row, marginTop: 16 }}>
              <button type="button" style={goldButton} onClick={() => moveThread(selected.id, "active")}>Active</button>
              <button type="button" style={button} onClick={() => markRead(selected.id, false)}>Mark Read</button>
              <button type="button" style={button} onClick={() => markRead(selected.id, true)}>Mark Unread</button>
              <button type="button" style={button} onClick={() => moveThread(selected.id, "saved")}>Save</button>
              <button type="button" style={button} onClick={() => moveThread(selected.id, "archived")}>Archive</button>
              <button type="button" style={redButton} onClick={() => moveThread(selected.id, "deleted")}>Delete</button>
              {selected.folder === "deleted" ? <button type="button" style={redButton} onClick={() => deleteForever(selected.id)}>Delete Forever</button> : null}
              <button type="button" style={button} onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>{folderTitle(folder)}</div>
          <h2 style={h2}>Thread Cards</h2>
          {visible.length ? (
            <div style={threadGrid}>
              {visible.map((thread) => (
                <button key={thread.id} type="button" onClick={() => { setSelected(thread); markRead(thread.id, false); }} style={{ ...tile, cursor: "pointer", borderColor: thread.unread ? "rgba(245,197,66,.78)" : "rgba(245,197,66,.35)" }}>
                  <div style={eyebrow}>{thread.lane} • {thread.folder}</div>
                  <h3 style={h3}>{thread.title}</h3>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>From:</strong> {thread.senderProfile?.name || thread.from}</p>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>Profile:</strong> {profileDisplay(thread.senderProfile)}</p>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>Recipient:</strong> {thread.recipient}</p>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>Room:</strong> {thread.room}</p>
                  <p style={muted}>{thread.message}</p>
                  <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Open Thread</p>
                </button>
              ))}
            </div>
          ) : (
            <div style={tile}><h3 style={h3}>No threads here.</h3><p style={sub}>Create a thread or open another folder.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
