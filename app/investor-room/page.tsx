"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AlertKind = "deals" | "pain" | "messages" | "owner";
type Item = {
  id: string;
  kind: "deal" | "pain" | "message" | "owner";
  title: string;
  body: string;
  state: string;
  status: string;
  source: string;
};

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em" };

const btn: React.CSSProperties = {
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

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
  color: "#080a10",
};

const redBtn: React.CSSProperties = {
  ...btn,
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

const panel: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.15)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
};

const roomGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 14,
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

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function collect(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const obj = value as Record<string, unknown>;
  const rows: any[] = [];

  Object.values(obj).forEach((item) => {
    if (Array.isArray(item)) rows.push(...item);
  });

  if (obj.id || obj.title || obj.name || obj.subject || obj.message) rows.push(obj);

  return rows;
}

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function kindFrom(key: string, item: any): Item["kind"] {
  const text = `${key} ${JSON.stringify(item || {})}`.toLowerCase();

  if (
    text.includes("pain") ||
    text.includes("problem") ||
    text.includes("distress") ||
    text.includes("pressure")
  ) {
    return "pain";
  }

  if (text.includes("owner") && (text.includes("reply") || text.includes("message"))) {
    return "owner";
  }

  if (text.includes("message") || text.includes("thread") || text.includes("reply")) {
    return "message";
  }

  return "deal";
}

function isActive(item: any) {
  const raw = String(item?.status || item?.folder || item?.roomStatus || item?.workspaceStatus || "active").toLowerCase();

  return (
    !raw.includes("archive") &&
    !raw.includes("delete") &&
    !raw.includes("save") &&
    !raw.includes("trash")
  );
}

function loadInvestorItems(): Item[] {
  if (typeof window === "undefined") return [];

  const keys = new Set<string>([
    "vaultforge_rooms_v1",
    "vaultforge_deal_rooms_v1",
    "vaultforge_pain_rooms_v1",
    "vaultforge_member_rooms_v1",
    "vaultforge_property_cards_v1",
    "vaultforge_projects_v1",
    "vaultforge_deals_v1",
    "vaultforge_pain_requests_v1",
    "vaultforge_my_rooms_clean_v2",
    "vaultforge_command_rooms_v1",
    "vaultforge_investor_requests_v1",
    "vaultforge_member_requests_v1",
    "vaultforge_message_threads_v1",
    "vaultforge_owner_messages_v1",
  ]);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const lower = key.toLowerCase();

    if (
      lower.includes("room") ||
      lower.includes("deal") ||
      lower.includes("pain") ||
      lower.includes("project") ||
      lower.includes("property") ||
      lower.includes("message") ||
      lower.includes("request")
    ) {
      keys.add(key);
    }
  }

  const items: Item[] = [];

  Array.from(keys).forEach((key) => {
    const parsed = safeParse<any>(window.localStorage.getItem(key), null);

    collect(parsed).forEach((item, index) => {
      if (!item || typeof item !== "object") return;

      const text = `${key} ${JSON.stringify(item)}`.toLowerCase();

      if (
        !text.includes("deal") &&
        !text.includes("room") &&
        !text.includes("pain") &&
        !text.includes("project") &&
        !text.includes("property") &&
        !text.includes("message") &&
        !text.includes("request")
      ) {
        return;
      }

      if (!isActive(item)) return;

      const kind = kindFrom(key, item);
      const id = clean(item.id || item.roomId || item.slug || item.threadId || `${key}-${index}`, `${key}-${index}`);

      items.push({
        id,
        kind,
        title: clean(item.title || item.name || item.projectName || item.propertyName || item.subject || "Request", "Request"),
        body: clean(item.message || item.summary || item.notes || item.description || item.body || "Open this signal to review details.", "Open this signal to review details."),
        state: clean(item.state || item.propertyState || item.marketState || item.market || "NA", "NA"),
        status: clean(item.status || item.folder || "active", "active"),
        source: key,
      });
    });
  });

  const unique = new Map<string, Item>();
  items.forEach((item) => unique.set(`${item.kind}-${item.id}`, item));

  return Array.from(unique.values());
}

function AlertTile({
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
        minHeight: 150,
        textAlign: "left",
        cursor: "pointer",
        borderColor: active ? "rgba(245,197,66,.7)" : "rgba(207,216,230,.15)",
      }}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: count ? "#1e90ff" : "#8f99aa" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

export default function InvestorRoomPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [lane, setLane] = useState<AlertKind>("deals");

  useEffect(() => {
    setItems(loadInvestorItems());
  }, []);

  const grouped = useMemo(() => {
    return {
      deals: items.filter((item) => item.kind === "deal"),
      pain: items.filter((item) => item.kind === "pain"),
      messages: items.filter((item) => item.kind === "message"),
      owner: items.filter((item) => item.kind === "owner"),
    };
  }, [items]);

  const visible = grouped[lane];

  return (
    <main style={wrap}>
      <div style={shell}>
        <section style={card}>
          <div style={eyebrow}>Investor Alerts • {items.length} Active</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <AlertTile title="Deals" count={grouped.deals.length} note="deal opportunity cards" active={lane === "deals"} onClick={() => setLane("deals")} />
            <AlertTile title="Pain" count={grouped.pain.length} note="problem/pain signals" active={lane === "pain"} onClick={() => setLane("pain")} />
            <AlertTile title="Messages" count={grouped.messages.length} note="owner/member/investor requests" active={lane === "messages"} onClick={() => setLane("messages")} />
            <AlertTile title="Owner Replies" count={grouped.owner.length} note="owner replies to requests" active={lane === "owner"} onClick={() => setLane("owner")} />
          </div>
        </section>

        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={btn}>Home</Link>
          <Link href="/investor-room" style={goldBtn}>Investor Access</Link>
          <Link href="/payment" style={btn}>Payment</Link>
          <Link href="/messages" style={goldBtn}>Message Owner</Link>
          <Link href="/logout" style={btn}>Logout</Link>
          <Link href="/admin" style={redBtn}>Owner</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Investor Command Room</div>
          <h1 style={h1}>Signals → Requests → Threads → Execution.</h1>
          <p style={sub}>
            Start with Deal/Pain signals, request controlled information, track replies, then request execution help from the private member network.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <button type="button" onClick={() => setLane("deals")} style={goldBtn}>Open Deal Signals</button>
            <button type="button" onClick={() => setLane("pain")} style={btn}>Open Pain Signals</button>
            <Link href="/messages" style={goldBtn}>Message Owner</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{lane}</div>
          <h2 style={h2}>{visible.length ? "Signal Feed" : "No cards in this lane."}</h2>

          {visible.length ? (
            <div style={roomGrid}>
              {visible.map((item) => (
                <article key={`${item.kind}-${item.id}`} style={panel}>
                  <div style={eyebrow}>{item.kind} • {item.state} • {item.status}</div>
                  <h3 style={h3}>{item.title}</h3>
                  <p style={muted}>{item.body}</p>
                  <p style={muted}>Source: {item.source}</p>
                </article>
              ))}
            </div>
          ) : (
            <p style={sub}>Create a member Deal or Pain room and it will appear in the correct top alert lane.</p>
          )}
        </section>
      </div>
    </main>
  );
}
