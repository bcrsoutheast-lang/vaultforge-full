"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RequestFolder =
  | "new"
  | "active"
  | "execution"
  | "cleanup"
  | "saved"
  | "archived"
  | "passed"
  | "deleted";

type RequestCard = {
  id: string;
  title: string;
  type: string;
  state: string;
  status: RequestFolder;
  sender: string;
  message: string;
  createdAt: string;
  source: string;
};

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 80px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 22 };
const brand: React.CSSProperties = { fontWeight: 1000, fontSize: 28, color: "#ffda5e", letterSpacing: "-.04em", marginRight: 12 };

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  textDecoration: "none",
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
  color: "#080a10",
  border: "1px solid rgba(255,220,90,.65)",
};

const redBtn: React.CSSProperties = {
  ...btn,
  background: "rgba(80,10,18,.58)",
  color: "#ffb2b2",
  border: "1px solid rgba(255,65,65,.55)",
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
  background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.15)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
};

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 26, lineHeight: 1, letterSpacing: "-.045em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeFolder(value: unknown): RequestFolder {
  const raw = String(value || "new").toLowerCase();
  if (raw.includes("active") || raw.includes("accepted") || raw.includes("work")) return "active";
  if (raw.includes("execution") || raw.includes("route")) return "execution";
  if (raw.includes("save")) return "saved";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("pass")) return "passed";
  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  return "new";
}

function collectArrays(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const arrays: any[] = [];
  Object.values(value).forEach((item) => {
    if (Array.isArray(item)) arrays.push(...item);
  });

  if (value.id || value.title || value.subject || value.message || value.body) {
    arrays.push(value);
  }

  return arrays;
}

function isRequestLike(item: any) {
  if (!item || typeof item !== "object") return false;
  const text = JSON.stringify(item).toLowerCase();
  return (
    text.includes("request") ||
    text.includes("investor") ||
    text.includes("owner") ||
    text.includes("reply") ||
    text.includes("lender") ||
    text.includes("contractor") ||
    text.includes("title") ||
    text.includes("jv") ||
    text.includes("operator")
  );
}

function loadRequests(): RequestCard[] {
  if (typeof window === "undefined") return [];

  const priorityKeys = [
    "vaultforge_member_request_desk_clean_v1",
    "vaultforge_investor_requests_v1",
    "vaultforge_member_requests_v1",
    "vaultforge_request_threads_v1",
    "vaultforge_message_threads_v1",
    "vaultforge_owner_messages_v1",
    "vaultforge_admin_messages_v1",
    "vaultforge_controlled_threads_v1",
    "vaultforge_member_controlled_threads_v1",
    "vaultforge_investor_room_requests_v1",
  ];

  const keys = new Set<string>(priorityKeys);
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const lower = key.toLowerCase();
    if (
      lower.includes("request") ||
      lower.includes("thread") ||
      lower.includes("message") ||
      lower.includes("owner") ||
      lower.includes("investor")
    ) {
      keys.add(key);
    }
  }

  const rows: RequestCard[] = [];

  Array.from(keys).forEach((key) => {
    const parsed = safeParse<any>(window.localStorage.getItem(key), null);
    const items = collectArrays(parsed);

    items.forEach((item, index) => {
      if (!isRequestLike(item)) return;

      const title =
        item?.title ||
        item?.requestTitle ||
        item?.subject ||
        item?.roomTitle ||
        item?.header ||
        item?.dealTitle ||
        item?.painTitle ||
        "Request";

      const type =
        item?.kind ||
        item?.type ||
        item?.requestType ||
        item?.lane ||
        item?.category ||
        key.replace("vaultforge_", "").replace("_v1", "");

      const status = normalizeFolder(item?.status || item?.folder || item?.requestStatus || item?.state);

      rows.push({
        id: clean(item?.id || item?.threadId || item?.requestId || `${key}-${index}`, `${key}-${index}`),
        title: clean(title, "Request"),
        type: clean(type, "Request"),
        state: clean(item?.propertyState || item?.market || item?.state || "NA", "NA"),
        status,
        sender: clean(item?.sender || item?.senderEmail || item?.email || item?.investorEmail || item?.from || "Unknown"),
        message: clean(item?.message || item?.body || item?.notes || item?.requestMessage || item?.summary || "No message listed."),
        createdAt: clean(item?.createdAt || item?.created_at || item?.date || ""),
        source: key,
      });
    });
  });

  const unique = new Map<string, RequestCard>();
  rows.forEach((item) => {
    const signature = `${item.title}|${item.type}|${item.sender}|${item.message}`.toLowerCase();
    unique.set(item.id || signature, item);
  });

  return Array.from(unique.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function saveRequests(cards: RequestCard[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("vaultforge_member_request_desk_clean_v1", JSON.stringify(cards));
}

function folderLabel(folder: RequestFolder) {
  if (folder === "new") return "New Requests";
  if (folder === "active") return "Active Threads";
  if (folder === "execution") return "Execution Requests";
  if (folder === "saved") return "Saved";
  if (folder === "archived") return "Archived";
  if (folder === "passed") return "Passed";
  if (folder === "deleted") return "Deleted";
  return "Cleanup";
}

function RequestTile({
  title,
  count,
  note,
  active,
  onClick,
}: {
  title: string;
  count: number;
  note: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...panel,
        textAlign: "left",
        cursor: "pointer",
        borderColor: active ? "rgba(245,197,66,.72)" : "rgba(207,216,230,.15)",
        boxShadow: active ? "0 0 0 1px rgba(245,197,66,.25)" : "none",
      }}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: "#1e90ff" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open</p>
    </button>
  );
}

function RequestCardView({
  cardData,
  onMove,
}: {
  cardData: RequestCard;
  onMove: (folder: RequestFolder) => void;
}) {
  return (
    <article style={{ ...panel, borderColor: "rgba(245,197,66,.34)" }}>
      <div style={eyebrow}>
        {clean(cardData.type)} • {clean(cardData.state, "NA")} • {folderLabel(cardData.status)}
      </div>
      <h3 style={h3}>{cardData.title}</h3>
      <p style={muted}>{cardData.message}</p>
      <p style={muted}>Sender: {cardData.sender}</p>

      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn} onClick={() => onMove("active")}>Active</button>
        <button type="button" style={btn} onClick={() => onMove("execution")}>Execution</button>
        <button type="button" style={btn} onClick={() => onMove("saved")}>Save</button>
        <button type="button" style={btn} onClick={() => onMove("archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => onMove("passed")}>Pass</button>
        <button type="button" style={redBtn} onClick={() => onMove("deleted")}>Delete</button>
      </div>
    </article>
  );
}

export default function MemberControlledThreadsPage() {
  const [cards, setCards] = useState<RequestCard[]>([]);
  const [folder, setFolder] = useState<RequestFolder>("new");

  useEffect(() => {
    const loaded = loadRequests();
    setCards(loaded);
    saveRequests(loaded);
  }, []);

  function moveCard(id: string, nextFolder: RequestFolder) {
    const next = cards.map((item) => item.id === id ? { ...item, status: nextFolder } : item);
    setCards(next);
    saveRequests(next);
    if (["saved", "archived", "passed", "deleted"].includes(nextFolder)) {
      setFolder("cleanup");
    } else {
      setFolder(nextFolder);
    }
  }

  const grouped = useMemo(() => {
    const base: Record<RequestFolder, RequestCard[]> = {
      new: [],
      active: [],
      execution: [],
      cleanup: [],
      saved: [],
      archived: [],
      passed: [],
      deleted: [],
    };

    cards.forEach((item) => {
      const status = item.status || "new";
      if (base[status]) base[status].push(item);
      if (["saved", "archived", "passed", "deleted"].includes(status)) {
        base.cleanup.push(item);
      }
    });

    return base;
  }, [cards]);

  const visible = grouped[folder] || [];

  return (
    <main style={wrap}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/my-rooms" style={btn}>My Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/network" style={btn}>Network</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Request Desk</div>
          <h1 style={h1}>Routed requests and replies.</h1>
          <p style={sub}>
            Requests are grouped into clean work lanes. Deal rooms and Pain rooms stay in My Rooms. This page is only the request desk.
          </p>
          <div style={{ ...row, marginTop: 16 }}>
            <Link href="/my-rooms" style={goldBtn}>Deal Rooms</Link>
            <Link href="/my-rooms" style={goldBtn}>Pain Rooms</Link>
            <Link href="/messages" style={btn}>Messages</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Request Groups</div>
          <h2 style={h2}>Open the right lane.</h2>
          <div style={{ ...grid, marginTop: 18 }}>
            <RequestTile
              title="New Requests"
              count={grouped.new.length}
              note="fresh routed work needing decision"
              active={folder === "new"}
              onClick={() => setFolder("new")}
            />
            <RequestTile
              title="Active Threads"
              count={grouped.active.length}
              note="accepted/open request conversations"
              active={folder === "active"}
              onClick={() => setFolder("active")}
            />
            <RequestTile
              title="Execution Requests"
              count={grouped.execution.length}
              note="lender, title, contractor, JV, operator, and field help"
              active={folder === "execution"}
              onClick={() => setFolder("execution")}
            />
            <RequestTile
              title="Saved / Archived / Deleted"
              count={grouped.cleanup.length}
              note="combined cleanup feed for finished or inactive requests"
              active={["cleanup", "saved", "archived", "passed", "deleted"].includes(folder)}
              onClick={() => setFolder("cleanup")}
            />
          </div>

          {["cleanup", "saved", "archived", "passed", "deleted"].includes(folder) ? (
            <div style={{ ...row, marginTop: 16 }}>
              <button type="button" style={folder === "cleanup" ? goldBtn : btn} onClick={() => setFolder("cleanup")}>All Cleanup</button>
              <button type="button" style={folder === "saved" ? goldBtn : btn} onClick={() => setFolder("saved")}>Saved</button>
              <button type="button" style={folder === "archived" ? goldBtn : btn} onClick={() => setFolder("archived")}>Archived</button>
              <button type="button" style={folder === "passed" ? goldBtn : btn} onClick={() => setFolder("passed")}>Passed</button>
              <button type="button" style={folder === "deleted" ? goldBtn : btn} onClick={() => setFolder("deleted")}>Deleted</button>
            </div>
          ) : null}
        </section>

        <section style={card}>
          <div style={eyebrow}>{folderLabel(folder)}</div>
          <h2 style={h2}>Request Feed</h2>

          {visible.length ? (
            <div style={grid}>
              {visible.map((item) => (
                <RequestCardView key={item.id} cardData={item} onMove={(nextFolder) => moveCard(item.id, nextFolder)} />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No cards in this group.</h2>
              <p style={sub}>
                When owner/admin routes or approves a matching investor request, the card appears here with profile, request header, message thread, and action buttons.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
