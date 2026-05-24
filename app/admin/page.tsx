"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminFolder = "active" | "saved" | "archived" | "deleted";

type AdminRecordType =
  | "profile"
  | "member"
  | "investor"
  | "payment"
  | "deal"
  | "pain"
  | "message";

type AdminRecord = {
  id: string;
  type: AdminRecordType;
  title: string;
  name: string;
  email: string;
  status: string;
  folder: AdminFolder;
  role: string;
  state: string;
  note: string;
  source: string;
  createdAt: string;
};

const ADMIN_STORE = "vaultforge_admin_command_records_v1";
const ADMIN_DELETED_FOREVER = "vaultforge_admin_deleted_forever_v1";

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 10%, rgba(245,197,66,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(120,0,30,.16), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 84px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
  marginBottom: 22,
};

const brand: React.CSSProperties = {
  color: "#ffda5e",
  fontWeight: 1000,
  fontSize: 28,
  letterSpacing: "-.04em",
  marginRight: 10,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
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
  boxShadow: "0 18px 50px rgba(0,0,0,.24)",
  marginBottom: 20,
};

const goldCard: React.CSSProperties = {
  ...card,
  borderColor: "rgba(245,197,66,.42)",
  background:
    "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.15)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 14,
};

const row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#ffda5e",
  textTransform: "uppercase",
  letterSpacing: ".34em",
  fontSize: 12,
  fontWeight: 1000,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,82px)",
  lineHeight: ".92",
  letterSpacing: "-.08em",
  margin: "12px 0",
  fontWeight: 1000,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(30px,4.5vw,54px)",
  lineHeight: ".95",
  letterSpacing: "-.065em",
  margin: "10px 0",
  fontWeight: 1000,
};

const h3: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  letterSpacing: "-.05em",
  margin: "8px 0",
  fontWeight: 1000,
};

const sub: React.CSSProperties = {
  color: "rgba(235,240,255,.78)",
  fontSize: 20,
  lineHeight: 1.45,
  margin: "8px 0",
};

const muted: React.CSSProperties = {
  color: "rgba(235,240,255,.68)",
  fontSize: 15,
  lineHeight: 1.45,
  margin: "6px 0",
};

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function recordTypeFrom(key: string, item: any): AdminRecordType {
  const text = `${key} ${JSON.stringify(item || {})}`.toLowerCase();

  if (text.includes("payment") || text.includes("paid") || text.includes("stripe")) return "payment";
  if (text.includes("investor")) return "investor";
  if (text.includes("member")) return "member";
  if (text.includes("profile")) return "profile";
  if (text.includes("pain") || text.includes("problem")) return "pain";
  if (text.includes("deal") || text.includes("project") || text.includes("room") || text.includes("property")) return "deal";
  if (text.includes("message") || text.includes("thread") || text.includes("reply")) return "message";

  return "profile";
}

function folderFrom(item: any): AdminFolder {
  const raw = String(item?.adminFolder || item?.folder || item?.status || item?.access_status || item?.member_status || "").toLowerCase();

  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("save")) return "saved";
  return "active";
}

function collect(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const rows: any[] = [];
  Object.values(value).forEach((item) => {
    if (Array.isArray(item)) rows.push(...item);
  });

  if (value.id || value.email || value.title || value.name || value.full_name) rows.push(value);
  return rows;
}

function foreverIds() {
  if (typeof window === "undefined") return [];
  return parse<string[]>(window.localStorage.getItem(ADMIN_DELETED_FOREVER), []);
}

function saveForeverIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_DELETED_FOREVER, JSON.stringify(Array.from(new Set(ids))));
}

function loadRecords(): AdminRecord[] {
  if (typeof window === "undefined") return [];

  const deletedForever = new Set(foreverIds());

  const keys = new Set<string>([
    ADMIN_STORE,
    "vaultforge_profiles_v1",
    "vaultforge_members_v1",
    "vaultforge_investors_v1",
    "vaultforge_member_profiles_v1",
    "vaultforge_applications_v1",
    "vaultforge_rooms_v1",
    "vaultforge_deal_rooms_v1",
    "vaultforge_pain_rooms_v1",
    "vaultforge_investor_requests_v1",
    "vaultforge_member_requests_v1",
    "vaultforge_message_threads_v1",
    "vaultforge_owner_messages_v1",
    "vaultforge_admin_messages_v1",
  ]);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const lower = key.toLowerCase();

    if (
      lower.includes("profile") ||
      lower.includes("member") ||
      lower.includes("investor") ||
      lower.includes("application") ||
      lower.includes("payment") ||
      lower.includes("room") ||
      lower.includes("deal") ||
      lower.includes("pain") ||
      lower.includes("message") ||
      lower.includes("request")
    ) {
      keys.add(key);
    }
  }

  const rows: AdminRecord[] = [];

  Array.from(keys).forEach((key) => {
    if (key === ADMIN_DELETED_FOREVER) return;

    const parsed = parse<any>(window.localStorage.getItem(key), null);
    const items = collect(parsed);

    items.forEach((item, index) => {
      if (!item || typeof item !== "object") return;

      const text = `${key} ${JSON.stringify(item)}`.toLowerCase();
      if (
        !text.includes("profile") &&
        !text.includes("member") &&
        !text.includes("investor") &&
        !text.includes("payment") &&
        !text.includes("deal") &&
        !text.includes("pain") &&
        !text.includes("room") &&
        !text.includes("message") &&
        !text.includes("request") &&
        !text.includes("@")
      ) {
        return;
      }

      const id = clean(item.id || item.profile_id || item.user_id || item.email || item.threadId || `${key}-${index}`, `${key}-${index}`);
      if (deletedForever.has(id)) return;

      const type = recordTypeFrom(key, item);

      rows.push({
        id,
        type,
        title: clean(item.title || item.full_name || item.name || item.email || item.subject || "Admin Record", "Admin Record"),
        name: clean(item.full_name || item.name || item.company || item.company_name || item.email || "Not listed", "Not listed"),
        email: clean(item.email || item.senderEmail || item.investorEmail || item.memberEmail || item.from || "", "Not listed"),
        status: clean(item.status || item.access_status || item.member_status || item.payment_status || item.stage || "active", "active"),
        folder: folderFrom(item),
        role: clean(item.role || item.member_type || item.type || type, type),
        state: clean(item.state || item.market || item.propertyState || item.states || "NA", "NA"),
        note: clean(item.note || item.notes || item.message || item.summary || item.description || "Open this record to review and control it.", "Open this record to review and control it."),
        source: key,
        createdAt: clean(item.createdAt || item.created_at || item.updatedAt || item.updated_at || new Date().toISOString(), new Date().toISOString()),
      });
    });
  });

  const unique = new Map<string, AdminRecord>();
  rows.forEach((record) => unique.set(record.id, record));

  return Array.from(unique.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function saveRecords(records: AdminRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_STORE, JSON.stringify(records));
}

function labelForType(type: AdminRecordType) {
  if (type === "profile") return "Profiles";
  if (type === "member") return "Members";
  if (type === "investor") return "Investors";
  if (type === "payment") return "Payment";
  if (type === "deal") return "Deals";
  if (type === "pain") return "Pain";
  return "Messages";
}

function Tile({
  title,
  count,
  note,
  active,
  danger,
  onClick,
}: {
  title: string;
  count: number;
  note: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...panel,
        minHeight: 154,
        textAlign: "left",
        cursor: "pointer",
        borderColor: active
          ? danger
            ? "rgba(255,65,65,.70)"
            : "rgba(245,197,66,.72)"
          : "rgba(207,216,230,.15)",
      }}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: count ? "#1e90ff" : "#f7f8ff" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open</p>
    </button>
  );
}

function RecordCard({
  record,
  moveRecord,
  deleteForever,
}: {
  record: AdminRecord;
  moveRecord: (id: string, folder: AdminFolder, status?: string) => void;
  deleteForever: (id: string) => void;
}) {
  return (
    <article
      style={{
        ...panel,
        borderColor: record.folder === "deleted" ? "rgba(255,65,65,.58)" : "rgba(245,197,66,.42)",
      }}
    >
      <div style={eyebrow}>
        {record.type} • {record.folder}
      </div>
      <h3 style={h3}>{record.title}</h3>
      <p style={sub}>{record.name}</p>
      <p style={muted}>{record.email}</p>
      <p style={muted}>Role: {record.role} • State: {record.state}</p>
      <p style={muted}>Status: {record.status}</p>
      <p style={muted}>{record.note}</p>

      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldButton} onClick={() => moveRecord(record.id, "active", "active")}>
          Active
        </button>
        <button type="button" style={goldButton} onClick={() => moveRecord(record.id, "active", "approved")}>
          Approve
        </button>
        <button type="button" style={button} onClick={() => moveRecord(record.id, "active", "payment_ready")}>
          Payment Ready
        </button>
        <button type="button" style={button} onClick={() => moveRecord(record.id, "active", "paid")}>
          Mark Paid
        </button>
        <button type="button" style={button} onClick={() => moveRecord(record.id, "saved")}>
          Save
        </button>
        <button type="button" style={button} onClick={() => moveRecord(record.id, "archived")}>
          Archive
        </button>
        <button type="button" style={redButton} onClick={() => moveRecord(record.id, "deleted")}>
          Delete
        </button>
        {record.folder === "deleted" ? (
          <button type="button" style={redButton} onClick={() => deleteForever(record.id)}>
            Delete Forever
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminPage() {
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [view, setView] = useState<AdminRecordType | AdminFolder | "dashboard" | "cleanup">("dashboard");

  useEffect(() => {
    const loaded = loadRecords();
    setRecords(loaded);
    saveRecords(loaded);
  }, []);

  const grouped = useMemo(() => {
    const active = records.filter((item) => item.folder === "active");
    const cleanup = records.filter((item) => ["saved", "archived", "deleted"].includes(item.folder));

    return {
      profile: active.filter((item) => item.type === "profile"),
      member: active.filter((item) => item.type === "member"),
      investor: active.filter((item) => item.type === "investor"),
      payment: active.filter((item) => item.type === "payment" || item.status.includes("payment") || item.status.includes("paid")),
      deal: active.filter((item) => item.type === "deal"),
      pain: active.filter((item) => item.type === "pain"),
      message: active.filter((item) => item.type === "message"),
      active,
      saved: records.filter((item) => item.folder === "saved"),
      archived: records.filter((item) => item.folder === "archived"),
      deleted: records.filter((item) => item.folder === "deleted"),
      cleanup,
    };
  }, [records]);

  const visible =
    view === "dashboard"
      ? []
      : view === "cleanup"
        ? grouped.cleanup
        : grouped[view];

  function moveRecord(id: string, folder: AdminFolder, status?: string) {
    const next = records.map((item) =>
      item.id === id
        ? {
            ...item,
            folder,
            status: status || item.status,
            createdAt: new Date().toISOString(),
          }
        : item
    );

    setRecords(next);
    saveRecords(next);

    if (folder === "deleted") setView("deleted");
    else if (folder === "saved") setView("saved");
    else if (folder === "archived") setView("archived");
  }

  function deleteForever(id: string) {
    saveForeverIds([...foreverIds(), id]);

    const next = records.filter((item) => item.id !== id);
    setRecords(next);
    saveRecords(next);
    setView("deleted");
  }

  return (
    <main style={wrap}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={button}>Home</Link>
          <Link href="/admin" style={goldButton}>Admin</Link>
          <Link href="/members" style={button}>Members</Link>
          <Link href="/investor-room" style={button}>Investor Room</Link>
          <Link href="/member-controlled-threads" style={button}>Controlled Threads</Link>
          <Link href="/my-rooms" style={button}>My Rooms</Link>
          <Link href="/logout" style={redButton}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Admin Command</div>
          <h1 style={h1}>Owner control center.</h1>
          <p style={sub}>
            Rebuilt admin control from scratch: profiles, members, investors, payments, deals, pain, messages, saved, archived, deleted, and delete forever.
          </p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Admin Dashboard</div>
          <h2 style={h2}>Open the control lane.</h2>

          <div style={{ ...grid, marginTop: 18 }}>
            <Tile title="Profiles" count={grouped.profile.length} note="profile approvals and access review" active={view === "profile"} onClick={() => setView("profile")} />
            <Tile title="Members" count={grouped.member.length} note="member approval, active, payment, delete" active={view === "member"} onClick={() => setView("member")} />
            <Tile title="Investors" count={grouped.investor.length} note="investor approval, payment, active, delete" active={view === "investor"} onClick={() => setView("investor")} />
            <Tile title="Payments" count={grouped.payment.length} note="payment ready, paid, comped, activation" active={view === "payment"} onClick={() => setView("payment")} />
            <Tile title="Deal Rooms" count={grouped.deal.length} note="deal opportunity records and room control" active={view === "deal"} onClick={() => setView("deal")} />
            <Tile title="Pain Rooms" count={grouped.pain.length} note="pain/problem records and room control" active={view === "pain"} danger onClick={() => setView("pain")} />
            <Tile title="Messages" count={grouped.message.length} note="owner/member/investor message records" active={view === "message"} onClick={() => setView("message")} />
            <Tile title="Cleanup" count={grouped.cleanup.length} note="saved, archived, and deleted records" active={view === "cleanup"} onClick={() => setView("cleanup")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Cleanup Folders</div>
          <h2 style={h2}>Saved, archived, deleted.</h2>
          <div style={{ ...grid, marginTop: 18 }}>
            <Tile title="Saved" count={grouped.saved.length} note="records saved for follow-up" active={view === "saved"} onClick={() => setView("saved")} />
            <Tile title="Archived" count={grouped.archived.length} note="records hidden from active admin work" active={view === "archived"} onClick={() => setView("archived")} />
            <Tile title="Deleted" count={grouped.deleted.length} note="trash folder with delete forever" active={view === "deleted"} danger onClick={() => setView("deleted")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>
            {view === "dashboard" ? "Dashboard" : view === "cleanup" ? "Cleanup" : String(view)}
          </div>
          <h2 style={h2}>
            {view === "dashboard"
              ? "Select a lane above."
              : view === "cleanup"
                ? "Cleanup Records"
                : `${labelForType(view as AdminRecordType)} Feed`}
          </h2>

          {view === "dashboard" ? (
            <div style={panel}>
              <p style={sub}>
                Click a dashboard lane above to open records. This page is intentionally self-contained so admin loads even when old admin dependencies are broken.
              </p>
            </div>
          ) : visible.length ? (
            <div style={grid}>
              {visible.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  moveRecord={moveRecord}
                  deleteForever={deleteForever}
                />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No records in this lane.</h2>
              <p style={sub}>
                When local records exist for this lane, they appear here with approve, payment, save, archive, delete, and delete forever controls.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
