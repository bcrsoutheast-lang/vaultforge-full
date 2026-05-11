"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type SignalCard = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function exactSignalId(item: SignalCard) {
  return first(item.signal_id, item.signalId, item.alert_id, item.alertId, item.id);
}

function exactItemId(item: SignalCard) {
  return first(item.item_id, item.itemId, item.deal_id, item.dealId, item.project_id, item.projectId, item.property_id, item.propertyId, item.pain_id, item.painId);
}

function titleOf(item: SignalCard) {
  return first(item.title, item.name, item.headline, item.signal_title, item.alert_title, "VaultForge Signal");
}

function messageOf(item: SignalCard) {
  return first(item.message, item.description, item.note, item.summary, item.reason, "Signal context ready for owner follow-up.");
}

function priorityOf(item: SignalCard) {
  return first(item.priority, item.severity, item.alert_priority, item.urgency, "medium").toLowerCase();
}

function priorityTone(item: SignalCard) {
  const priority = priorityOf(item);
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function marketOf(item: SignalCard) {
  return first(item.market, item.state, item.location, [item.city, item.state].filter(Boolean).join(", "));
}

function typeOf(item: SignalCard) {
  return first(item.alert_type, item.type, item.category, item.signal_type, item.source, "signal");
}

function scoreOf(item: SignalCard) {
  const raw = Number(item.score || item.confidence_score || item.match_score || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  const priority = priorityOf(item);
  if (priority === "urgent") return 84;
  if (priority === "high") return 72;
  return 58;
}

function exactSignalHref(item: SignalCard) {
  const signalId = exactSignalId(item);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/intelligence";
}

function exactWorkHref(item: SignalCard) {
  const itemId = exactItemId(item);
  return itemId ? `/deal-room/${encodeURIComponent(itemId)}` : exactSignalHref(item);
}

function exactRoutingHref(item: SignalCard) {
  const signalId = exactSignalId(item);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function connectHref(item: SignalCard, viewerEmail: string) {
  const signalId = exactSignalId(item);
  const itemId = exactItemId(item);

  if (!signalId) return "/alerts";

  const query = new URLSearchParams();
  if (viewerEmail) query.set("email", viewerEmail);
  if (itemId) query.set("item_id", itemId);

  return `/connect/${encodeURIComponent(signalId)}?${query.toString()}`;
}

async function loadSignals(currentEmail: string, owner: boolean) {
  const headers = { "x-vf-email": currentEmail, "x-vf-admin": owner ? "1" : "0" };

  const [storedRes, feedRes] = await Promise.all([
    fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, { cache: "no-store", headers }),
    fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, { cache: "no-store", headers }),
  ]);

  const storedData = await safeJson(storedRes);
  const feedData = await safeJson(feedRes);

  const stored = Array.isArray(storedData?.alerts)
    ? storedData.alerts
    : Array.isArray(storedData?.signals)
    ? storedData.signals
    : [];

  const generated = Array.isArray(feedData?.alerts)
    ? feedData.alerts
    : Array.isArray(feedData?.signals)
    ? feedData.signals
    : [];

  const map = new Map<string, SignalCard>();

  for (const item of [...stored, ...generated]) {
    const signalId = exactSignalId(item) || `${titleOf(item)}-${messageOf(item)}`;
    map.set(signalId, item);
  }

  return Array.from(map.values());
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
    color: "white",
    padding: "28px 18px 100px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  wrap: { maxWidth: 1240, margin: "0 auto" },
  hero: {
    border: "1px solid rgba(232,196,107,.34)",
    background: "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
    borderRadius: 34,
    padding: 26,
    marginBottom: 22,
    boxShadow: "0 30px 90px rgba(0,0,0,.34)",
  },
  card: {
    border: "1px solid rgba(255,255,255,.13)",
    background: "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
    borderRadius: 28,
    padding: 22,
    boxShadow: "0 26px 80px rgba(0,0,0,.34)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 },
  chip: {
    display: "inline-flex",
    border: "1px solid rgba(157,243,191,.25)",
    color: "#9df3bf",
    background: "rgba(157,243,191,.07)",
    borderRadius: 999,
    padding: "8px 11px",
    fontWeight: 850,
    fontSize: 13,
    margin: "0 7px 7px 0",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
    color: "#06100a",
    border: "none",
    borderRadius: 999,
    padding: "13px 18px",
    fontWeight: 950,
    textDecoration: "none",
    cursor: "pointer",
    margin: "6px 6px 0 0",
    minHeight: 46,
  },
  ghost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.055)",
    borderRadius: 999,
    padding: "13px 18px",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
    margin: "6px 6px 0 0",
    minHeight: 46,
  },
  danger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffd0d0",
    border: "1px solid rgba(255,120,120,.38)",
    background: "rgba(255,255,255,.055)",
    borderRadius: 999,
    padding: "13px 18px",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
    margin: "6px 6px 0 0",
    minHeight: 46,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.075)",
    color: "white",
    padding: 14,
    fontSize: 15,
  },
  muted: { color: "rgba(255,255,255,.72)", lineHeight: 1.55 },
  eyebrow: { color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" },
};

function StatCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.eyebrow}>{title}</div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [status, setStatus] = useState("Loading smart alerts...");
  const [search, setSearch] = useState("");
  const [generateStatus, setGenerateStatus] = useState("");
  const [generatingId, setGeneratingId] = useState("");

  async function load() {
    setStatus("Loading smart alerts...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const rows = await loadSignals(currentEmail, currentOwner);
      setSignals(rows);
      setStatus(rows.length ? "" : "No alerts available yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load alerts.");
    }
  }

  async function generateRoutingFromCard(item: SignalCard) {
    if (!owner) {
      setGenerateStatus("Owner/admin access required to generate routing actions.");
      return;
    }

    const signalId = exactSignalId(item);
    const itemId = exactItemId(item);
    const activeId = signalId || itemId || titleOf(item);

    setGeneratingId(activeId);
    setGenerateStatus("Generating routing action from exact card...");

    try {
      const res = await fetch("/api/routing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": email, "x-vf-admin": "1" },
        body: JSON.stringify({
          email,
          admin_email: email,
          owner: "1",
          signal_id: signalId,
          item_id: itemId,
          title: titleOf(item),
          note: messageOf(item),
          state: item?.state || item?.market || item?.location || "",
          market: item?.market || item?.state || item?.location || "",
          city: item?.city || "",
          strategy: item?.strategy || item?.asset_strategy || item?.exit_strategy || "",
          asset_type: item?.property_type || item?.asset_type || item?.item_kind || "",
          role_needed: item?.role_needed || item?.target_role || item?.deal_need || "",
          priority: priorityOf(item),
          source: "exact_card_generate",
          source_table: item?.source_table || "",
          item_kind: item?.item_kind || typeOf(item),
        }),
      });

      const data = await safeJson(res);
      if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.details || "Could not generate routing action.");
      setGenerateStatus(data?.message || "Routing action generated from exact card.");
    } catch (error: any) {
      setGenerateStatus(error?.message || "Could not generate routing action.");
    } finally {
      setGeneratingId("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signals;

    return signals.filter((item) =>
      [titleOf(item), messageOf(item), marketOf(item), priorityOf(item), typeOf(item), exactSignalId(item), exactItemId(item)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [signals, search]);

  const urgent = signals.filter((item) => priorityOf(item) === "urgent").length;
  const exactSignals = signals.filter((item) => exactSignalId(item)).length;
  const exactItems = signals.filter((item) => exactItemId(item)).length;

  return (
    <main style={styles.page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        input::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) {
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; margin: 0 !important; box-sizing: border-box; }
        }
      `}</style>

      <div style={styles.wrap}>
        <nav style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/dashboard" style={{ color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em" }}>
            VAULTFORGE
          </Link>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/pain-feed" style={styles.ghost}>Pain Feed</Link>
            <Link href="/messages" style={styles.ghost}>Messages</Link>
            <Link href="/routing-inbox" style={styles.ghost}>Routing</Link>
            <Link href="/dashboard" style={styles.ghost}>Dashboard</Link>
          </div>
        </nav>

        <section style={styles.hero}>
          <div style={styles.eyebrow}>VaultForge Smart Alerts</div>
          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Alerts route clean.
          </h1>
          <p style={{ ...styles.muted, fontSize: 22 }}>
            Need More Info and Message Owner now open the simple Connect system. They no longer use the broken old message save path.
          </p>

          <div>
            <span style={styles.chip}>Signed in: {email || "unknown"}</span>
            <span style={styles.chip}>Alerts: {signals.length}</span>
            <span style={styles.chip}>Exact Signals: {exactSignals}</span>
            <span style={styles.chip}>Exact Items: {exactItems}</span>
            <span style={styles.chip}>Urgent: {urgent}</span>
            <span style={styles.chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={styles.btn} onClick={load}>Refresh Alerts</button>
            <Link href="/messages" style={styles.ghost}>Messages</Link>
            <Link href="/pain-feed" style={styles.ghost}>Pain Feed</Link>
            <Link href="/logout" style={styles.danger}>Logout</Link>
          </div>

          {status ? (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          ) : null}

          {generateStatus ? (
            <p style={{ color: generateStatus.toLowerCase().includes("could not") || generateStatus.toLowerCase().includes("required") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {generateStatus}
            </p>
          ) : null}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 22 }}>
          <StatCard title="Alerts" value={signals.length} detail="Total alert cards loaded." />
          <StatCard title="Exact Signals" value={exactSignals} detail="Cards with signal rooms." />
          <StatCard title="Exact Items" value={exactItems} detail="Cards with work areas." />
          <StatCard title="Urgent" value={urgent} detail="Urgent alert pressure." />
        </section>

        <section style={styles.hero}>
          <div style={styles.eyebrow}>Search Alerts</div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search alerts, markets, priorities, signal IDs..." style={styles.input} />
        </section>

        {filtered.length === 0 && !status ? (
          <section style={styles.hero}>No matching alerts.</section>
        ) : (
          <section style={styles.grid}>
            {filtered.map((item, index) => {
              const signalId = exactSignalId(item);
              const itemId = exactItemId(item);
              const tone = priorityTone(item);
              const activeId = signalId || itemId || titleOf(item);
              const connect = connectHref(item, email);

              return (
                <article key={`${activeId}-${index}`} style={{ ...styles.card, borderColor: `${tone}66` }}>
                  <div style={{ ...styles.eyebrow, color: tone }}>
                    {priorityOf(item).toUpperCase()} · {typeOf(item)}
                  </div>

                  <h2 style={{ fontSize: 34, lineHeight: 1.05, margin: "0 0 12px" }}>{titleOf(item)}</h2>
                  <p style={{ ...styles.muted, fontSize: 18 }}>{messageOf(item)}</p>

                  <div>
                    <span style={styles.chip}>Score: {scoreOf(item)}</span>
                    {marketOf(item) ? <span style={styles.chip}>{marketOf(item)}</span> : null}
                    {signalId ? <span style={styles.chip}>Signal: {signalId}</span> : null}
                    {itemId ? <span style={styles.chip}>Item: {itemId}</span> : null}
                  </div>

                  <div className="vf-actions">
                    <Link href={connect} style={styles.btn}>Need More Info</Link>
                    <Link href={connect} style={styles.ghost}>Message Owner</Link>
                    <Link href={exactSignalHref(item)} style={styles.ghost}>Open Signal</Link>
                    <Link href={exactRoutingHref(item)} style={styles.ghost}>Routing Room</Link>
                    <Link href={exactWorkHref(item)} style={styles.ghost}>Work Area</Link>
                    {owner ? (
                      <button
                        type="button"
                        style={styles.ghost}
                        disabled={generatingId === activeId}
                        onClick={() => generateRoutingFromCard(item)}
                      >
                        {generatingId === activeId ? "Generating..." : "Generate Routing"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
