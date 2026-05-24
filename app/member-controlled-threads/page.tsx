"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane =
  | "deal"
  | "pain"
  | "requests"
  | "active"
  | "execution"
  | "cleanup"
  | "saved"
  | "archived"
  | "passed"
  | "deleted";

type CardStatus = "new" | "active" | "execution" | "saved" | "archived" | "passed" | "deleted";

type DeskCard = {
  id: string;
  title: string;
  lane: "deal" | "pain" | "request" | "execution";
  status: CardStatus;
  state: string;
  sender: string;
  message: string;
  createdAt: string;
  source: string;
};

const STORAGE_KEY = "vaultforge_member_request_desk_clean_v1";
const DELETED_FOREVER_KEY = "vaultforge_member_request_desk_deleted_forever_v1";

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
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
  fontWeight: 1000,
  fontSize: 28,
  color: "#ffda5e",
  letterSpacing: "-.04em",
  marginRight: 12,
};

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

const dangerBtn: React.CSSProperties = {
  ...btn,
  background: "rgba(115,8,16,.74)",
  color: "#ffb2b2",
  border: "1px solid rgba(255,65,65,.75)",
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

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))",
  gap: 14,
};

const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };

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
  fontSize: 26,
  lineHeight: 1,
  letterSpacing: "-.045em",
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

function collectArrays(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const rows: any[] = [];
  Object.values(value).forEach((item) => {
    if (Array.isArray(item)) rows.push(...item);
  });

  if (value.id || value.title || value.subject || value.message || value.body) rows.push(value);
  return rows;
}

function laneFromItem(item: any, key: string): DeskCard["lane"] {
  const text = `${key} ${JSON.stringify(item || {})}`.toLowerCase();

  if (
    text.includes("pain") ||
    text.includes("problem") ||
    text.includes("foreclosure") ||
    text.includes("funding gap") ||
    text.includes("distress")
  ) {
    return "pain";
  }

  if (
    text.includes("execution") ||
    text.includes("lender") ||
    text.includes("contractor") ||
    text.includes("title") ||
    text.includes("operator") ||
    text.includes("boots") ||
    text.includes("jv") ||
    text.includes("insurance")
  ) {
    return "execution";
  }

  if (
    text.includes("deal") ||
    text.includes("opportunity") ||
    text.includes("property") ||
    text.includes("asking") ||
    text.includes("arv")
  ) {
    return "deal";
  }

  return "request";
}

function statusFromItem(item: any): CardStatus {
  const raw = String(item?.status || item?.folder || item?.requestStatus || item?.state || item?.stage || "new").toLowerCase();

  if (raw.includes("active") || raw.includes("accepted") || raw.includes("work")) return "active";
  if (raw.includes("execution") || raw.includes("route")) return "execution";
  if (raw.includes("save")) return "saved";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("pass")) return "passed";
  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  return "new";
}

function isRequestLike(item: any, key: string) {
  if (!item || typeof item !== "object") return false;

  const text = `${key} ${JSON.stringify(item)}`.toLowerCase();

  return (
    text.includes("request") ||
    text.includes("investor") ||
    text.includes("owner") ||
    text.includes("reply") ||
    text.includes("deal") ||
    text.includes("pain") ||
    text.includes("lender") ||
    text.includes("contractor") ||
    text.includes("title") ||
    text.includes("jv") ||
    text.includes("operator")
  );
}

function readDeletedForever(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(window.localStorage.getItem(DELETED_FOREVER_KEY), []);
}

function writeDeletedForever(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DELETED_FOREVER_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function loadCards(): DeskCard[] {
  if (typeof window === "undefined") return [];

  const deletedForever = new Set(readDeletedForever());

  const keys = new Set<string>([
    STORAGE_KEY,
    "vaultforge_investor_requests_v1",
    "vaultforge_member_requests_v1",
    "vaultforge_request_threads_v1",
    "vaultforge_message_threads_v1",
    "vaultforge_owner_messages_v1",
    "vaultforge_admin_messages_v1",
    "vaultforge_controlled_threads_v1",
    "vaultforge_member_controlled_threads_v1",
    "vaultforge_investor_room_requests_v1",
  ]);

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

  const rows: DeskCard[] = [];

  Array.from(keys).forEach((key) => {
    if (key === DELETED_FOREVER_KEY) return;

    const parsed = safeParse<any>(window.localStorage.getItem(key), null);
    const items = collectArrays(parsed);

    items.forEach((item, index) => {
      if (!isRequestLike(item, key)) return;

      const rawId = clean(item?.id || item?.threadId || item?.requestId || `${key}-${index}`, `${key}-${index}`);
      if (deletedForever.has(rawId)) return;

      const title =
        item?.title ||
        item?.requestTitle ||
        item?.subject ||
        item?.roomTitle ||
        item?.header ||
        item?.dealTitle ||
        item?.painTitle ||
        "Request";

      rows.push({
        id: rawId,
        title: clean(title, "Request"),
        lane: laneFromItem(item, key),
        status: statusFromItem(item),
        state: clean(item?.propertyState || item?.market || item?.state || "NA", "NA"),
        sender: clean(item?.sender || item?.senderEmail || item?.email || item?.investorEmail || item?.from || "Unknown"),
        message: clean(item?.message || item?.body || item?.notes || item?.requestMessage || item?.summary || "No message listed."),
        createdAt: clean(item?.createdAt || item?.created_at || item?.date || ""),
        source: key,
      });
    });
  });

  const unique = new Map<string, DeskCard>();
  rows.forEach((item) => unique.set(item.id, item));

  return Array.from(unique.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function saveCards(cards: DeskCard[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function laneTitle(lane: Lane) {
  if (lane === "deal") return "Deal Opportunities";
  if (lane === "pain") return "Pain Intake";
  if (lane === "requests") return "Request Threads";
  if (lane === "active") return "Active Threads";
  if (lane === "execution") return "Execution Requests";
  if (lane === "saved") return "Saved";
  if (lane === "archived") return "Archived";
  if (lane === "passed") return "Passed";
  if (lane === "deleted") return "Deleted";
  return "Cleanup";
}

function statusLabel(status: CardStatus) {
  if (status === "new") return "New";
  if (status === "active") return "Active";
  if (status === "execution") return "Execution";
  if (status === "saved") return "Saved";
  if (status === "archived") return "Archived";
  if (status === "passed") return "Passed";
  return "Deleted";
}

function DeskTile({
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
        minHeight: 158,
        textAlign: "left",
        cursor: "pointer",
        borderColor: active ? (danger ? "rgba(255,70,70,.70)" : "rgba(245,197,66,.72)") : "rgba(207,216,230,.15)",
        boxShadow: active ? "0 0 0 1px rgba(245,197,66,.22)" : "none",
      }}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: count > 0 ? "#1e90ff" : "#f7f8ff" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open</p>
    </button>
  );
}

function CardView({
  item,
  onMove,
  onDeleteForever,
}: {
  item: DeskCard;
  onMove: (next: CardStatus) => void;
  onDeleteForever: () => void;
}) {
  return (
    <article style={{ ...panel, borderColor: item.status === "deleted" ? "rgba(255,65,65,.50)" : "rgba(245,197,66,.34)" }}>
      <div style={eyebrow}>
        {item.lane} • {item.state} • {statusLabel(item.status)}
      </div>
      <h3 style={h3}>{item.title}</h3>
      <p style={muted}>{item.message}</p>
      <p style={muted}>Sender: {item.sender}</p>

      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn} onClick={() => onMove("active")}>Active</button>
        <button type="button" style={btn} onClick={() => onMove("execution")}>Execution</button>
        <button type="button" style={btn} onClick={() => onMove("saved")}>Save</button>
        <button type="button" style={btn} onClick={() => onMove("archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => onMove("passed")}>Pass</button>
        <button type="button" style={redBtn} onClick={() => onMove("deleted")}>Delete</button>
        {item.status === "deleted" ? (
          <button type="button" style={dangerBtn} onClick={onDeleteForever}>Delete Forever</button>
        ) : null}
      </div>
    </article>
  );
}

export default function MemberControlledThreadsPage() {
  const [cards, setCards] = useState<DeskCard[]>([]);
  const [lane, setLane] = useState<Lane>("requests");

  useEffect(() => {
    const loaded = loadCards();
    setCards(loaded);
    saveCards(loaded);
  }, []);

  const grouped = useMemo(() => {
    const cleanup = cards.filter((item) => ["saved", "archived", "passed", "deleted"].includes(item.status));
    const activeNonCleanup = cards.filter((item) => !["saved", "archived", "passed", "deleted"].includes(item.status));

    return {
      deal: activeNonCleanup.filter((item) => item.lane === "deal"),
      pain: activeNonCleanup.filter((item) => item.lane === "pain"),
      requests: activeNonCleanup.filter((item) => item.lane === "request" || item.status === "new"),
      active: activeNonCleanup.filter((item) => item.status === "active"),
      execution: activeNonCleanup.filter((item) => item.lane === "execution" || item.status === "execution"),
      cleanup,
      saved: cards.filter((item) => item.status === "saved"),
      archived: cards.filter((item) => item.status === "archived"),
      passed: cards.filter((item) => item.status === "passed"),
      deleted: cards.filter((item) => item.status === "deleted"),
    } satisfies Record<Lane, DeskCard[]>;
  }, [cards]);

  const visible = grouped[lane] || [];

  function moveCard(id: string, nextStatus: CardStatus) {
    const next = cards.map((item) => (item.id === id ? { ...item, status: nextStatus } : item));
    setCards(next);
    saveCards(next);

    if (["saved", "archived", "passed", "deleted"].includes(nextStatus)) {
      setLane("cleanup");
    } else if (nextStatus === "execution") {
      setLane("execution");
    } else {
      setLane("active");
    }
  }

  function deleteForever(id: string) {
    const deletedForever = readDeletedForever();
    writeDeletedForever([...deletedForever, id]);

    const next = cards.filter((item) => item.id !== id);
    setCards(next);
    saveCards(next);
    setLane("deleted");
  }

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
          <h1 style={h1}>Grouped request command.</h1>
          <p style={sub}>
            Deal Opportunities, Pain Intake, Request Threads, and Execution Requests stay separated. Cleanup is one folder with Saved, Archived, Passed, and Deleted inside.
          </p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Primary Work Groups</div>
          <h2 style={h2}>Separate lanes. No mixed cards.</h2>

          <div style={{ ...grid, marginTop: 18 }}>
            <DeskTile title="Deal Opportunities" count={grouped.deal.length} note="deal request cards tied to opportunity rooms" active={lane === "deal"} onClick={() => setLane("deal")} />
            <DeskTile title="Pain Intake" count={grouped.pain.length} note="problem-solving and pressure request cards" active={lane === "pain"} danger onClick={() => setLane("pain")} />
            <DeskTile title="Request Threads" count={grouped.requests.length} note="new routed requests and owner/member replies" active={lane === "requests"} onClick={() => setLane("requests")} />
            <DeskTile title="Execution Requests" count={grouped.execution.length} note="lender, title, contractor, JV, operator, and field help" active={lane === "execution"} onClick={() => setLane("execution")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Cleanup Folder</div>
          <h2 style={h2}>Saved, archived, passed, and deleted.</h2>

          <button
            type="button"
            onClick={() => setLane("cleanup")}
            style={{
              ...panel,
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              borderColor: lane === "cleanup" ? "rgba(245,197,66,.72)" : "rgba(207,216,230,.15)",
              marginTop: 14,
            }}
          >
            <div style={eyebrow}>Cleanup</div>
            <h2 style={{ ...h2, color: grouped.cleanup.length ? "#1e90ff" : "#f7f8ff" }}>{grouped.cleanup.length}</h2>
            <p style={muted}>one combined folder for inactive request cards</p>
            <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open</p>
          </button>

          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={lane === "cleanup" ? goldBtn : btn} onClick={() => setLane("cleanup")}>All Cleanup</button>
            <button type="button" style={lane === "saved" ? goldBtn : btn} onClick={() => setLane("saved")}>Saved ({grouped.saved.length})</button>
            <button type="button" style={lane === "archived" ? goldBtn : btn} onClick={() => setLane("archived")}>Archived ({grouped.archived.length})</button>
            <button type="button" style={lane === "passed" ? goldBtn : btn} onClick={() => setLane("passed")}>Passed ({grouped.passed.length})</button>
            <button type="button" style={lane === "deleted" ? goldBtn : btn} onClick={() => setLane("deleted")}>Deleted ({grouped.deleted.length})</button>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{laneTitle(lane)}</div>
          <h2 style={h2}>Card Feed</h2>

          {visible.length ? (
            <div style={grid}>
              {visible.map((item) => (
                <CardView
                  key={item.id}
                  item={item}
                  onMove={(nextStatus) => moveCard(item.id, nextStatus)}
                  onDeleteForever={() => deleteForever(item.id)}
                />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No cards in this group.</h2>
              <p style={sub}>
                Cards land here when a Deal Opportunity, Pain Intake, Request Thread, or Execution Request is created or routed.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
