"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";
const INVESTOR_CLEANUP_KEY = "vaultforge_investor_room_cleanup_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const LOGO_CANDIDATES = [
  "/vaultforge-logo.png",
  "/VaultForge-logo.png",
  "/vaultforge-logo.jpg",
  "/vaultforge-logo.jpeg",
  "/logo.png",
  "/logo.jpg",
  "/vf-logo.png",
  "/VF-logo.png",
  "/vaultforge.png",
  "/VaultForge.png",
];

type TeaserKind = "Deal" | "Pain";
type CleanupFolder = "none" | "saved" | "archived" | "deleted";
type ActiveRoom = { kind: TeaserKind; item: any; title: string; state: string } | null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readInvestor() {
  return readJson<any>(INVESTOR_APP_KEY, {});
}

function readRows(keys: string[]) {
  const rows: any[] = [];

  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) rows.push(...parsed);
      else if (parsed && typeof parsed === "object") rows.push(...Object.values(parsed));
    } catch {
      // ignore bad local data
    }
  }

  return rows;
}

function itemState(item: any) {
  return String(
    item?.state ||
      item?.propertyState ||
      item?.property_state ||
      item?.dealState ||
      item?.deal_state ||
      item?.painState ||
      item?.pain_state ||
      item?.marketState ||
      item?.market_state ||
      item?.locationState ||
      item?.location_state ||
      ""
  )
    .trim()
    .toUpperCase();
}

function itemTitle(item: any, kind: TeaserKind) {
  return String(item?.title || item?.name || item?.headline || item?.summary || `${kind} Teaser`);
}

function itemId(item: any, kind: TeaserKind, index = 0) {
  return String(
    item?.id ||
      item?.roomId ||
      item?.room_id ||
      item?.dealId ||
      item?.deal_id ||
      item?.painId ||
      item?.pain_id ||
      item?.signalId ||
      item?.signal_id ||
      `${kind}-${itemTitle(item, kind)}-${index}`
  );
}

function dedupeRows(rows: any[], kind: TeaserKind) {
  const map = new Map<string, any>();

  rows.forEach((item, index) => {
    const key = `${kind}-${itemId(item, kind, index)}-${itemState(item)}-${itemTitle(item, kind)}`.toLowerCase();
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values());
}

function cleanupKey(kind: TeaserKind, item: any) {
  return `${kind.toLowerCase()}::${itemId(item, kind)}::${itemState(item)}::${itemTitle(item, kind)}`.toLowerCase();
}

function cleanupMap() {
  return readJson<Record<string, string>>(INVESTOR_CLEANUP_KEY, {});
}

function getCleanup(kind: TeaserKind, item: any) {
  return cleanupMap()[cleanupKey(kind, item)] || "";
}

function saveCleanup(kind: TeaserKind, item: any, action: "saved" | "archived" | "deleted") {
  const rows = cleanupMap();
  rows[cleanupKey(kind, item)] = action;
  writeJson(INVESTOR_CLEANUP_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-investor-room-cleanup-change"));
}

function clearCleanup(kind: TeaserKind, item: any) {
  const rows = cleanupMap();
  delete rows[cleanupKey(kind, item)];
  writeJson(INVESTOR_CLEANUP_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-investor-room-cleanup-change"));
}

function saveRequest(kind: TeaserKind, item: any, message: string) {
  const rows = readJson<any[]>(INVESTOR_REQUESTS_KEY, []);
  const investor = readInvestor();
  const title = itemTitle(item, kind);
  const state = itemState(item);
  const roomHeader = `${kind} Request • ${title} • ${state || "Unknown State"}`;

  rows.unshift({
    id: `investor-request-${Date.now()}`,
    kind,
    itemId: itemId(item, kind),
    title,
    state,
    roomHeader,
    investorEmail: investor?.email || "",
    investorCompany: investor?.company || "",
    investorName: investor?.contactName || "",
    message,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  writeJson(INVESTOR_REQUESTS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-investor-request-change"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 100 };
const topbar: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 26, fontWeight: 950, letterSpacing: -1 };
const navRight: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.48)", boxShadow: "0 0 26px rgba(245,197,66,.10)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.52)", boxShadow: "0 0 26px rgba(255,70,70,.10)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const wideGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: 0.96, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 26, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "13px 18px",
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
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 14 };

function LogoBlock() {
  const [index, setIndex] = useState(0);
  const src = LOGO_CANDIDATES[index];

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
      <div
        style={{
          width: "min(420px, 88vw)",
          border: "1px solid rgba(245,197,66,.28)",
          borderRadius: 26,
          padding: 16,
          background: "radial-gradient(circle, rgba(245,197,66,.13), transparent 68%), #070b14",
          boxShadow: "0 0 50px rgba(245,197,66,.14)",
        }}
      >
        {src ? (
          <img
            src={src}
            alt="VaultForge"
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 16 }}
            onError={() => setIndex((value) => (value + 1 < LOGO_CANDIDATES.length ? value + 1 : LOGO_CANDIDATES.length))}
          />
        ) : (
          <div style={{ minHeight: 160, display: "grid", placeItems: "center", color: "#ffd45a", fontSize: 52, fontWeight: 950 }}>
            VAULTFORGE
          </div>
        )}
      </div>
    </div>
  );
}

function TopNav() {
  return (
    <div style={topbar}>
      <div style={brand}>VAULTFORGE</div>
      <div style={navRight}>
        <Link href="/" style={btn}>Home</Link>
        <Link href="/investor-access" style={btn}>Investor Access</Link>
        <Link href="/investor-payment" style={btn}>Payment</Link>
        <Link href="/admin" style={redBtn}>Admin</Link>
      </div>
    </div>
  );
}

function Metric({
  title,
  count,
  note,
  active,
  onClick,
}: {
  title: string;
  count: number | string;
  note: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" style={{ ...(active ? goldPanel : panel), width: "100%", textAlign: "left", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function TeaserCard({
  kind,
  item,
  active,
  onOpen,
  onCleanup,
  onRestore,
}: {
  kind: TeaserKind;
  item: any;
  active: boolean;
  onOpen: () => void;
  onCleanup: (action: "saved" | "archived" | "deleted") => void;
  onRestore: () => void;
}) {
  const title = itemTitle(item, kind);
  const state = itemState(item) || "Not listed";
  const city = item?.city || item?.market || item?.area || "Market not listed";
  const asset = item?.assetType || item?.asset_type || item?.type || "Asset not listed";
  const price = item?.askingPrice || item?.asking_price || item?.price || item?.amount || "Not listed";
  const repairs = item?.repairs || item?.repairEstimate || item?.repair_estimate || "Not listed";
  const arv = item?.arv || item?.afterRepairValue || item?.after_repair_value || "Not listed";
  const cleanup = getCleanup(kind, item);

  return (
    <div style={active ? goldPanel : panel}>
      <div style={eyebrow}>
        {kind} • {state} {cleanup ? `• ${cleanup}` : ""}
      </div>

      <h2 style={h2}>{title}</h2>

      <p style={sub}>{city} • {asset}</p>

      <div style={{ ...grid, marginTop: 14 }}>
        <div><div style={eyebrow}>Asking / Need</div><p style={muted}>{String(price)}</p></div>
        <div><div style={eyebrow}>Repairs</div><p style={muted}>{String(repairs)}</p></div>
        <div><div style={eyebrow}>ARV / Value</div><p style={muted}>{String(arv)}</p></div>
      </div>

      <p style={{ ...muted, marginTop: 14 }}>
        Member information, seller information, private notes, routing notes, and contact details are hidden until deeper access is approved.
      </p>

      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn} onClick={onOpen}>Open Details</button>
        <button type="button" style={btn} onClick={() => onCleanup("saved")}>Save</button>
        <button type="button" style={btn} onClick={() => onCleanup("archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => onCleanup("deleted")}>Delete</button>
        {cleanup ? <button type="button" style={btn} onClick={onRestore}>Restore</button> : null}
        {cleanup === "deleted" ? <button type="button" style={redBtn} onClick={onRestore}>Delete Forever</button> : null}
      </div>
    </div>
  );
}

function ActiveRoomPanel({ activeRoom, onClose }: { activeRoom: ActiveRoom; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!activeRoom) return null;

  const { kind, item, title, state } = activeRoom;
  const city = item?.city || item?.market || item?.area || "Market not listed";
  const asset = item?.assetType || item?.asset_type || item?.type || "Asset not listed";
  const price = item?.askingPrice || item?.asking_price || item?.price || item?.amount || "Not listed";
  const repairs = item?.repairs || item?.repairEstimate || item?.repair_estimate || "Not listed";
  const arv = item?.arv || item?.afterRepairValue || item?.after_repair_value || "Not listed";
  const roomHeader = `${kind} Request • ${title} • ${state || "Unknown State"}`;

  function send() {
    saveRequest(kind, item, `${roomHeader}\n\n${message || "Investor requested more information."}`);
    setSent(true);
  }

  return (
    <section style={{ ...(kind === "Pain" ? redPanel : goldPanel), marginTop: 18 }}>
      <div style={{ ...row, justifyContent: "space-between" }}>
        <div>
          <div style={eyebrow}>Open Investor Room Detail</div>
          <h2 style={h2}>{title}</h2>
        </div>
        <button type="button" style={btn} onClick={onClose}>Collapse / Done</button>
      </div>

      <p style={sub}>{roomHeader}</p>
      <p style={muted}>{city} • {asset}</p>

      <div style={{ ...grid, marginTop: 16 }}>
        <div style={panel}><div style={eyebrow}>Asking / Need</div><p style={sub}>{String(price)}</p></div>
        <div style={panel}><div style={eyebrow}>Repairs</div><p style={sub}>{String(repairs)}</p></div>
        <div style={panel}><div style={eyebrow}>ARV / Value</div><p style={sub}>{String(arv)}</p></div>
      </div>

      <div style={{ ...panel, marginTop: 16 }}>
        <div style={eyebrow}>Private Data Hidden</div>
        <p style={muted}>
          This investor lane does not expose member name, member phone, member email, seller info, exact private notes, docs, routing notes, or full room intelligence.
        </p>
      </div>

      <label style={field}>
        <span style={eyebrow}>Message With Room Header</span>
        <textarea
          style={{ ...input, minHeight: 120 }}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="I am interested. Send more information. I can close with..."
        />
      </label>

      <div style={{ ...row, marginTop: 12 }}>
        <button type="button" style={goldBtn} onClick={send}>Send Request Through VaultForge</button>
        <button type="button" style={btn} onClick={() => saveCleanup(kind, item, "saved")}>Save</button>
        <button type="button" style={btn} onClick={() => saveCleanup(kind, item, "archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => saveCleanup(kind, item, "deleted")}>Delete</button>
        <button type="button" style={btn} onClick={() => clearCleanup(kind, item)}>Restore</button>
        <button type="button" style={redBtn} onClick={() => clearCleanup(kind, item)}>Delete Forever</button>
      </div>

      {sent ? <p style={muted}>Request sent to VaultForge admin/member workflow.</p> : null}
    </section>
  );
}

function CleanupFolderPanel({
  tab,
  folder,
  items,
  onClose,
  onOpen,
  onRestore,
  onDelete,
}: {
  tab: TeaserKind;
  folder: CleanupFolder;
  items: any[];
  onClose: () => void;
  onOpen: (item: any) => void;
  onRestore: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  if (folder === "none") return null;

  const title = `${folder.charAt(0).toUpperCase()}${folder.slice(1)} ${tab}`;

  return (
    <section style={{ marginTop: 18 }}>
      <div style={{ ...row, justifyContent: "space-between", marginBottom: 12 }}>
        <div style={eyebrow}>Cleanup Folder • {title}</div>
        <button type="button" style={btn} onClick={onClose}>Collapse Folder / Done</button>
      </div>

      <div style={wideGrid}>
        <div style={folder === "deleted" ? redPanel : folder === "saved" ? goldPanel : panel}>
          <h3 style={h3}>{title}</h3>
          {items.length ? (
            items.map((item, index) => (
              <div key={`${folder}-${tab}-${index}`} style={{ ...panel, marginTop: 10 }}>
                <p style={sub}>{itemTitle(item, tab)}</p>
                <div style={{ ...row, marginTop: 10 }}>
                  <button type="button" style={goldBtn} onClick={() => onOpen(item)}>Open</button>
                  <button type="button" style={btn} onClick={() => onRestore(item)}>Restore</button>
                  {folder !== "deleted" ? (
                    <button type="button" style={redBtn} onClick={() => onDelete(item)}>Delete</button>
                  ) : (
                    <button type="button" style={redBtn} onClick={() => onRestore(item)}>Delete Forever</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={muted}>No cards in this folder.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function InvestorRoomPage() {
  const [investor, setInvestor] = useState<any>({});
  const [state, setState] = useState("GA");
  const [tab, setTab] = useState<TeaserKind>("Deal");
  const [folder, setFolder] = useState<CleanupFolder>("none");
  const [tick, setTick] = useState(0);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>(null);

  useEffect(() => {
    const refresh = () => {
      setInvestor(readInvestor());
      setTick((value) => value + 1);
    };

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    window.addEventListener("vaultforge-investor-room-cleanup-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
      window.removeEventListener("vaultforge-investor-room-cleanup-change", refresh);
    };
  }, []);

  const active = investor?.paymentStatus === "paid" || investor?.accessStatus === "active" || investor?.access === "active";

  const rawDeals = useMemo(() => {
    return dedupeRows(
      readRows(["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"]).filter((item) => itemState(item) === state),
      "Deal"
    );
  }, [state, tick]);

  const rawPains = useMemo(() => {
    return dedupeRows(
      readRows(["vaultforge_clean_pain_rooms", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms_v2", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"]).filter((item) => itemState(item) === state),
      "Pain"
    );
  }, [state, tick]);

  const activeDeals = useMemo(() => rawDeals.filter((item) => !getCleanup("Deal", item)), [rawDeals, tick]);
  const activePains = useMemo(() => rawPains.filter((item) => !getCleanup("Pain", item)), [rawPains, tick]);

  const savedDeals = useMemo(() => rawDeals.filter((item) => getCleanup("Deal", item) === "saved"), [rawDeals, tick]);
  const archivedDeals = useMemo(() => rawDeals.filter((item) => getCleanup("Deal", item) === "archived"), [rawDeals, tick]);
  const deletedDeals = useMemo(() => rawDeals.filter((item) => getCleanup("Deal", item) === "deleted"), [rawDeals, tick]);
  const savedPains = useMemo(() => rawPains.filter((item) => getCleanup("Pain", item) === "saved"), [rawPains, tick]);
  const archivedPains = useMemo(() => rawPains.filter((item) => getCleanup("Pain", item) === "archived"), [rawPains, tick]);
  const deletedPains = useMemo(() => rawPains.filter((item) => getCleanup("Pain", item) === "deleted"), [rawPains, tick]);

  const folderItems =
    tab === "Deal"
      ? folder === "saved"
        ? savedDeals
        : folder === "archived"
          ? archivedDeals
          : folder === "deleted"
            ? deletedDeals
            : []
      : folder === "saved"
        ? savedPains
        : folder === "archived"
          ? archivedPains
          : folder === "deleted"
            ? deletedPains
            : [];

  const visibleItems = tab === "Deal" ? activeDeals : activePains;

  function openItem(kind: TeaserKind, item: any) {
    setActiveRoom({ kind, item, title: itemTitle(item, kind), state: itemState(item) });
  }

  function cleanupAndRefresh(kind: TeaserKind, item: any, action: "saved" | "archived" | "deleted") {
    saveCleanup(kind, item, action);
    setTick((value) => value + 1);
  }

  function restoreAndRefresh(kind: TeaserKind, item: any) {
    clearCleanup(kind, item);
    setTick((value) => value + 1);
  }

  if (!active) {
    return (
      <main style={page}>
        <div style={wrap}>
          <TopNav />
          <section style={hero}>
            <LogoBlock />
            <div style={eyebrow}>Investor Room Locked</div>
            <h1 style={h1}>Approval and payment required.</h1>
            <p style={sub}>Complete the investor application and payment before entering the investor visitor room.</p>
            <div style={{ ...row, marginTop: 18 }}>
              <Link href="/investor-application" style={goldBtn}>Investor Application</Link>
              <Link href="/investor-payment" style={btn}>Investor Payment</Link>
              <Link href="/investor-access" style={btn}>Investor Access</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <TopNav />

        <section style={hero}>
          <LogoBlock />

          <div style={eyebrow}>VaultForge Investor Visitor Room</div>
          <h1 style={h1}>Controlled deal and pain access.</h1>
          <p style={sub}>
            Browse limited state teaser cards and request more information through VaultForge. This room is separate from the private member network.
          </p>

          <div style={{ ...row, marginTop: 22 }}>
            <button type="button" style={tab === "Deal" && folder === "none" ? goldBtn : btn} onClick={() => { setTab("Deal"); setFolder("none"); setActiveRoom(null); }}>
              Deal Signals
            </button>
            <button type="button" style={tab === "Pain" && folder === "none" ? goldBtn : btn} onClick={() => { setTab("Pain"); setFolder("none"); setActiveRoom(null); }}>
              Pain Signals
            </button>
            <button type="button" style={btn} onClick={() => { setFolder("none"); setActiveRoom(null); }}>
              Collapse / Done
            </button>
          </div>
        </section>

        <section style={goldPanel}>
          <div style={eyebrow}>State Desk</div>
          <div style={row}>
            {STATES.map((stateCode) => (
              <button
                key={stateCode}
                type="button"
                style={stateCode === state ? goldBtn : btn}
                onClick={() => {
                  setState(stateCode);
                  setFolder("none");
                  setActiveRoom(null);
                }}
              >
                {stateCode}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div style={grid}>
            <Metric title="Deal Signals" count={activeDeals.length} note={`active opportunity cards in ${state}`} active={tab === "Deal" && folder === "none"} onClick={() => { setTab("Deal"); setFolder("none"); setActiveRoom(null); }} />
            <Metric title="Pain Signals" count={activePains.length} note={`active pressure cards in ${state}`} active={tab === "Pain" && folder === "none"} onClick={() => { setTab("Pain"); setFolder("none"); setActiveRoom(null); }} />
            <Metric title="Requests" count={readJson<any[]>(INVESTOR_REQUESTS_KEY, []).length} note="requests sent through VaultForge" />
            <Metric title="Saved Deals" count={savedDeals.length} note="saved deal cards" active={tab === "Deal" && folder === "saved"} onClick={() => { setTab("Deal"); setFolder("saved"); setActiveRoom(null); }} />
            <Metric title="Archived Deals" count={archivedDeals.length} note="archived deal cards" active={tab === "Deal" && folder === "archived"} onClick={() => { setTab("Deal"); setFolder("archived"); setActiveRoom(null); }} />
            <Metric title="Deleted Deals" count={deletedDeals.length} note="deleted deal cards" active={tab === "Deal" && folder === "deleted"} onClick={() => { setTab("Deal"); setFolder("deleted"); setActiveRoom(null); }} />
            <Metric title="Saved Pain" count={savedPains.length} note="saved pain cards" active={tab === "Pain" && folder === "saved"} onClick={() => { setTab("Pain"); setFolder("saved"); setActiveRoom(null); }} />
            <Metric title="Archived Pain" count={archivedPains.length} note="archived pain cards" active={tab === "Pain" && folder === "archived"} onClick={() => { setTab("Pain"); setFolder("archived"); setActiveRoom(null); }} />
            <Metric title="Deleted Pain" count={deletedPains.length} note="deleted pain cards" active={tab === "Pain" && folder === "deleted"} onClick={() => { setTab("Pain"); setFolder("deleted"); setActiveRoom(null); }} />
          </div>
        </section>

        <ActiveRoomPanel activeRoom={activeRoom} onClose={() => setActiveRoom(null)} />

        <CleanupFolderPanel
          tab={tab}
          folder={folder}
          items={folderItems}
          onClose={() => { setFolder("none"); setActiveRoom(null); }}
          onOpen={(item) => openItem(tab, item)}
          onRestore={(item) => restoreAndRefresh(tab, item)}
          onDelete={(item) => cleanupAndRefresh(tab, item, "deleted")}
        />

        {folder === "none" ? (
          <section style={{ marginTop: 22 }}>
            <div style={eyebrow}>{tab} Cards • {state}</div>

            <div style={wideGrid}>
              {visibleItems.length ? (
                visibleItems.map((item, index) => (
                  <TeaserCard
                    key={`${tab}-${itemId(item, tab, index)}-${index}`}
                    kind={tab}
                    item={item}
                    active={activeRoom?.kind === tab && activeRoom?.title === itemTitle(item, tab)}
                    onOpen={() => openItem(tab, item)}
                    onCleanup={(action) => cleanupAndRefresh(tab, item, action)}
                    onRestore={() => restoreAndRefresh(tab, item)}
                  />
                ))
              ) : (
                <div style={panel}>
                  <h2 style={h2}>No active {tab.toLowerCase()} teasers.</h2>
                  <p style={sub}>Cards may be saved, archived, deleted, or not available for this state yet.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section style={{ ...hero, marginTop: 24 }}>
          <div style={eyebrow}>Network Capabilities Through Members</div>
          <h2 style={h2}>One-stop execution support.</h2>
          <p style={sub}>
            Funding, title/closing, contractors, operators, insurance, and execution partners are available through the private member network after member/admin approval.
          </p>

          <div style={{ ...grid, marginTop: 18 }}>
            <div style={panel}><div style={eyebrow}>Funding</div><p style={muted}>Private lenders, hard money, bridge, equity, and capital introductions through members.</p></div>
            <div style={panel}><div style={eyebrow}>Title / Closing</div><p style={muted}>Closing support and transaction coordination through approved network relationships.</p></div>
            <div style={panel}><div style={eyebrow}>Contractors</div><p style={muted}>Rehab, construction, repairs, inspections, and field execution routed through members.</p></div>
            <div style={panel}><div style={eyebrow}>Operators</div><p style={muted}>Asset operators, acquisition/disposition support, management, and execution partners.</p></div>
            <div style={panel}><div style={eyebrow}>Insurance</div><p style={muted}>Coverage support and property-risk routing through approved member resources.</p></div>
            <div style={panel}><div style={eyebrow}>Admin Control</div><p style={muted}>No direct contact is exposed until the member/admin workflow approves deeper access.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
