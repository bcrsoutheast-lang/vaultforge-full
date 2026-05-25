"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "deals" | "pain" | "messages" | "owner" | "saved" | "archived" | "deleted";
type Kind = "deal" | "pain" | "message" | "owner";
type Status = "active" | "saved" | "archived" | "deleted";

type Signal = {
  id: string;
  kind: Kind;
  status: Status;
  title: string;
  state: string;
  city: string;
  county: string;
  summary: string;
  source: string;
  raw: string;
};

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

const signalGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
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

function safeParse(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function collect(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const rows: any[] = [];

  Object.values(value).forEach((entry) => {
    if (Array.isArray(entry)) rows.push(...entry);
  });

  if (
    value.id ||
    value.roomId ||
    value.title ||
    value.name ||
    value.subject ||
    value.message ||
    value.propertyName ||
    value.projectName
  ) {
    rows.push(value);
  }

  return rows;
}

function noisyKey(key: string) {
  const k = key.toLowerCase();
  return (
    k.includes("activity") ||
    k.includes("analytics") ||
    k.includes("history") ||
    k.includes("viewed") ||
    k.includes("audit") ||
    k.includes("log") ||
    k.includes("deleted_forever")
  );
}

function usefulKey(key: string) {
  const k = key.toLowerCase();
  if (noisyKey(k)) return false;
  return (
    k.includes("deal") ||
    k.includes("pain") ||
    k.includes("room") ||
    k.includes("project") ||
    k.includes("property") ||
    k.includes("request") ||
    k.includes("message") ||
    k.includes("thread")
  );
}

function statusOf(item: any): Status {
  const raw = clean(
    item?.investorStatus ||
      item?.workspaceStatus ||
      item?.roomStatus ||
      item?.folder ||
      item?.status ||
      "active",
    "active"
  ).toLowerCase();

  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("save")) return "saved";
  return "active";
}

function kindOf(source: string, item: any): Kind {
  const text = `${source} ${JSON.stringify(item || {})}`.toLowerCase();

  // Deal must be checked before message because real deal cards often include message text.
  if (
    text.includes("deal request") ||
    text.includes("deal room") ||
    text.includes("deal opportunity") ||
    text.includes("property") ||
    text.includes("project") ||
    text.includes("asking") ||
    text.includes("arv") ||
    text.includes("wholesale") ||
    text.includes("seller finance") ||
    text.includes("buy & hold") ||
    text.includes("flip")
  ) {
    return "deal";
  }

  if (
    text.includes("pain") ||
    text.includes("problem") ||
    text.includes("foreclosure") ||
    text.includes("funding gap") ||
    text.includes("distress") ||
    text.includes("pressure")
  ) {
    return "pain";
  }

  if (text.includes("owner") && (text.includes("reply") || text.includes("message"))) return "owner";
  if (text.includes("message") || text.includes("thread") || text.includes("reply")) return "message";

  return "deal";
}

function titleOf(item: any, kind: Kind) {
  const title = clean(
    item?.title ||
      item?.propertyName ||
      item?.projectName ||
      item?.dealTitle ||
      item?.painTitle ||
      item?.name ||
      item?.subject ||
      "",
    ""
  );

  if (title) return title;
  if (kind === "pain") return "Pain Signal";
  if (kind === "message") return "Message Request";
  if (kind === "owner") return "Owner Reply";
  return "Deal Signal";
}

function summaryOf(item: any, kind: Kind) {
  const summary = clean(
    item?.summary ||
      item?.message ||
      item?.notes ||
      item?.description ||
      item?.body ||
      item?.need ||
      item?.problem ||
      "",
    ""
  );

  if (summary && summary !== "Not listed") return summary;
  if (kind === "pain") return "Member submitted a problem/pain signal for investor review.";
  if (kind === "message") return "Message thread connected to this investor workflow.";
  if (kind === "owner") return "Owner reply connected to this investor workflow.";
  return "Member submitted a deal opportunity signal for investor review.";
}

function realEnough(item: any, source: string) {
  if (!item || typeof item !== "object") return false;
  if (noisyKey(source)) return false;

  const text = `${source} ${JSON.stringify(item)}`.toLowerCase();

  if (
    text.includes("room opened") ||
    text.includes("viewed room") ||
    text.includes("status change")
  ) {
    return false;
  }

  return (
    Boolean(item.title || item.propertyName || item.projectName || item.subject || item.message || item.name) &&
    (
      text.includes("deal") ||
      text.includes("pain") ||
      text.includes("property") ||
      text.includes("project") ||
      text.includes("room") ||
      text.includes("request") ||
      text.includes("message")
    )
  );
}

function signalId(source: string, item: any, kind: Kind, index: number) {
  const rawId = clean(item?.id || item?.roomId || item?.slug || item?.threadId || "", "");
  if (rawId) return `${kind}:${rawId}`;

  const title = titleOf(item, kind).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const state = clean(item?.state || item?.propertyState || item?.marketState || item?.market || "na", "na")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return `${kind}:${title}:${state}:${source}:${index}`;
}

function loadSignals(): Signal[] {
  if (typeof window === "undefined") return [];

  const sourceKeys = new Set<string>([
    "vaultforge_deal_rooms_v1",
    "vaultforge_clean_deal_rooms",
    "vaultforge_pain_rooms_v1",
    "vaultforge_clean_pain_rooms",
    "vaultforge_member_rooms_v1",
    "vaultforge_rooms_v1",
    "vaultforge_projects_v1",
    "vaultforge_deals_v1",
    "vaultforge_property_cards_v1",
    "vaultforge_pain_requests_v1",
    "vaultforge_investor_requests_v1",
    "vaultforge_member_requests_v1",
    "vaultforge_message_threads_v1",
    "vaultforge_owner_messages_v1",
  ]);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (usefulKey(key)) sourceKeys.add(key);
  }

  const map = new Map<string, Signal>();

  Array.from(sourceKeys).forEach((source) => {
    if (noisyKey(source)) return;
    const parsed = safeParse(window.localStorage.getItem(source));

    collect(parsed).forEach((item, index) => {
      if (!realEnough(item, source)) return;

      const kind = kindOf(source, item);
      const id = signalId(source, item, kind, index);
      const status = statusOf(item);

      const signal: Signal = {
        id,
        kind,
        status,
        title: titleOf(item, kind),
        state: clean(item?.state || item?.propertyState || item?.marketState || item?.market || "NA", "NA"),
        city: clean(item?.city || item?.propertyCity || item?.marketCity || "", ""),
        county: clean(item?.county || item?.propertyCounty || "", ""),
        summary: summaryOf(item, kind),
        source,
        raw: JSON.stringify(item, null, 2),
      };

      const existing = map.get(id);
      if (!existing || existing.summary.length < signal.summary.length) {
        map.set(id, signal);
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
}

function saveOverrides(overrides: Record<string, Status>) {
  window.localStorage.setItem("vaultforge_investor_signal_status_v1", JSON.stringify(overrides));
}

function loadOverrides(): Record<string, Status> {
  return safeParse(window.localStorage.getItem("vaultforge_investor_signal_status_v1")) || {};
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
        borderColor: active ? "rgba(245,197,66,.75)" : "rgba(207,216,230,.15)",
      }}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: count ? "#1e90ff" : "#8f99aa" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

function SignalCard({
  signal,
  onOpen,
}: {
  signal: Signal;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        ...panel,
        textAlign: "left",
        cursor: "pointer",
        borderColor: signal.status === "deleted" ? "rgba(255,65,65,.55)" : "rgba(245,197,66,.38)",
      }}
    >
      <div style={eyebrow}>
        {signal.kind} • {signal.state} • {signal.status}
      </div>
      <h3 style={{ ...h3, color: "#1e90ff" }}>{signal.title}</h3>
      <p style={sub}>{[signal.city, signal.county, signal.state].filter(Boolean).join(", ")}</p>
      <p style={muted}>{signal.summary}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open details</p>
    </button>
  );
}

export default function InvestorRoomPage() {
  const [allSignals, setAllSignals] = useState<Signal[]>([]);
  const [lane, setLane] = useState<Lane>("deals");
  const [selected, setSelected] = useState<Signal | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Status>>({});

  useEffect(() => {
    const loadedOverrides = loadOverrides();
    setOverrides(loadedOverrides);

    const loaded = loadSignals().map((signal) => ({
      ...signal,
      status: loadedOverrides[signal.id] || signal.status,
    }));

    setAllSignals(loaded);
  }, []);

  const grouped = useMemo(() => {
    const notDeleted = allSignals.filter((signal) => signal.status !== "deleted");

    return {
      deals: notDeleted.filter((signal) => signal.kind === "deal"),
      pain: notDeleted.filter((signal) => signal.kind === "pain"),
      messages: notDeleted.filter((signal) => signal.kind === "message"),
      owner: notDeleted.filter((signal) => signal.kind === "owner"),
      saved: allSignals.filter((signal) => signal.status === "saved"),
      archived: allSignals.filter((signal) => signal.status === "archived"),
      deleted: allSignals.filter((signal) => signal.status === "deleted"),
    };
  }, [allSignals]);

  const visible = grouped[lane];

  function setSignalStatus(id: string, status: Status) {
    const nextOverrides = { ...overrides, [id]: status };
    setOverrides(nextOverrides);
    saveOverrides(nextOverrides);

    setAllSignals((current) =>
      current.map((signal) => (signal.id === id ? { ...signal, status } : signal))
    );

    setSelected((current) => (current?.id === id ? { ...current, status } : current));
    setLane(status === "active" ? "deals" : status);
  }

  function deleteForever(id: string) {
    const next = allSignals.filter((signal) => signal.id !== id);
    setAllSignals(next);
    setSelected(null);

    const existing = safeParse(window.localStorage.getItem("vaultforge_investor_deleted_forever_v1")) || [];
    window.localStorage.setItem(
      "vaultforge_investor_deleted_forever_v1",
      JSON.stringify(Array.from(new Set([...existing, id])))
    );

    const nextOverrides = { ...overrides };
    delete nextOverrides[id];
    setOverrides(nextOverrides);
    saveOverrides(nextOverrides);
  }

  return (
    <main style={page}>
      <div style={shell}>
        <section style={card}>
          <div style={eyebrow}>
            Investor Alerts • {grouped.deals.length + grouped.pain.length + grouped.messages.length + grouped.owner.length} Active
          </div>
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
          <div style={{ ...row, marginTop: 18 }}>
            <button type="button" onClick={() => setLane("deals")} style={goldBtn}>Open Deal Signals</button>
            <button type="button" onClick={() => setLane("pain")} style={btn}>Open Pain Signals</button>
            <Link href="/messages" style={goldBtn}>Message Owner</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Folders</div>
          <h2 style={h2}>Clean signal control.</h2>
          <div style={{ ...row, marginTop: 12 }}>
            <button type="button" style={lane === "saved" ? goldBtn : btn} onClick={() => setLane("saved")}>Saved ({grouped.saved.length})</button>
            <button type="button" style={lane === "archived" ? goldBtn : btn} onClick={() => setLane("archived")}>Archived ({grouped.archived.length})</button>
            <button type="button" style={lane === "deleted" ? redBtn : btn} onClick={() => setLane("deleted")}>Deleted ({grouped.deleted.length})</button>
          </div>
        </section>

        {selected ? (
          <section style={card}>
            <div style={eyebrow}>
              {selected.kind} Detail • {selected.status}
            </div>
            <h2 style={h2}>{selected.title}</h2>
            <p style={sub}>{[selected.city, selected.county, selected.state].filter(Boolean).join(", ")}</p>
            <p style={sub}>{selected.summary}</p>
            <p style={muted}>Source: {selected.source}</p>
            <div style={{ ...row, marginTop: 14 }}>
              <button type="button" style={goldBtn} onClick={() => setSignalStatus(selected.id, "active")}>Active</button>
              <button type="button" style={btn} onClick={() => setSignalStatus(selected.id, "saved")}>Save</button>
              <button type="button" style={btn} onClick={() => setSignalStatus(selected.id, "archived")}>Archive</button>
              <button type="button" style={redBtn} onClick={() => setSignalStatus(selected.id, "deleted")}>Delete</button>
              {selected.status === "deleted" ? (
                <button type="button" style={redBtn} onClick={() => deleteForever(selected.id)}>Delete Forever</button>
              ) : null}
              <button type="button" style={btn} onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>{lane}</div>
          <h2 style={h2}>{visible.length ? "Signal Feed" : "No cards in this lane."}</h2>
          {visible.length ? (
            <div style={signalGrid}>
              {visible.map((signal) => (
                <SignalCard key={signal.id} signal={signal} onOpen={() => setSelected(signal)} />
              ))}
            </div>
          ) : (
            <p style={sub}>Member Deal and Pain rooms will appear here with full clickable details and cleanup controls.</p>
          )}
        </section>
      </div>
    </main>
  );
}
