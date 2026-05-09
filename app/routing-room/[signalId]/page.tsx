"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Action = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1240, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: 18,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const btn: React.CSSProperties = {
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
};

const ghost: React.CSSProperties = {
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
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 15,
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
};

function clean(value: unknown) {
  return String(value || "").trim();
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

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_admin_email") ||
    ""
  ).trim().toLowerCase();
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

function label(value: string) {
  const text = clean(value || "item").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function exactItemId(item: Action) {
  return first(item.item_id, item.itemId, item.deal_id, item.project_id, item.property_id, item.pain_id);
}

function exactWorkHref(item: Action) {
  const itemId = exactItemId(item);
  return itemId ? `/deal-room/${encodeURIComponent(itemId)}` : "";
}

function priorityOf(item: Action) {
  return first(item.priority, "medium").toLowerCase();
}

function toneOf(item: Action) {
  const priority = priorityOf(item);
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function scoreOf(item: Action) {
  const raw = Number(item.confidence_score || item.match_score || item.score || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  return 58;
}

function titleOf(item: Action) {
  return first(item.title, item.name, item.headline, "Routing action");
}

function noteOf(item: Action) {
  return first(item.urgency_reason, item.routing_reason, item.note, item.notes, item.reason, "Routing action generated for owner review.");
}

function actionOf(item: Action) {
  return first(item.action, item.routing_action, "routing_action");
}

function StatCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

export default function RoutingRoomPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [status, setStatus] = useState("Loading routing room...");
  const [generateStatus, setGenerateStatus] = useState("");
  const [introStatus, setIntroStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [introBusyId, setIntroBusyId] = useState("");
  const [introEmailByAction, setIntroEmailByAction] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [itemId, setItemId] = useState("");
  const [stateMatch, setStateMatch] = useState("");
  const [strategyMatch, setStrategyMatch] = useState("");
  const [roleNeeded, setRoleNeeded] = useState("Buyer");
  const [priority, setPriority] = useState("medium");
  const [note, setNote] = useState("");

  async function load() {
    setStatus("Loading routing room...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const res = await fetch(
        `/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}&signal_id=${encodeURIComponent(signalId)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": currentOwner ? "1" : "0",
          },
        }
      );

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load routing actions.");
      }

      const rows = Array.isArray(data?.actions) ? data.actions : [];
      setActions(rows);
      setStatus(rows.length ? "" : "No routing actions found for this signal yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing room.");
    }
  }

  async function generateRoutingAction() {
    if (!owner) {
      setGenerateStatus("Owner/admin access required to generate routing actions.");
      return;
    }

    setBusy(true);
    setGenerateStatus("Generating routing action...");

    try {
      const res = await fetch("/api/routing/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": "1",
        },
        body: JSON.stringify({
          email,
          admin_email: email,
          owner: "1",
          signal_id: signalId,
          item_id: itemId,
          title: title || `Routing action for ${signalId}`,
          note,
          state: stateMatch,
          strategy: strategyMatch,
          role_needed: roleNeeded,
          priority,
          source: "routing_room_manual_generate",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not generate routing action.");
      }

      setGenerateStatus(data?.message || "Routing action generated.");
      setTitle("");
      setNote("");
      await load();
    } catch (error: any) {
      setGenerateStatus(error?.message || "Could not generate routing action.");
    } finally {
      setBusy(false);
    }
  }

  async function stageIntroductionFromAction(action: Action) {
    if (!owner) {
      setIntroStatus("Owner/admin access required to stage introductions.");
      return;
    }

    const actionId = clean(action.id);
    const memberEmail = clean(introEmailByAction[actionId]).toLowerCase();

    if (!memberEmail) {
      setIntroStatus("Enter a member email before staging the introduction.");
      return;
    }

    setIntroBusyId(actionId);
    setIntroStatus("Staging controlled introduction...");

    try {
      const res = await fetch("/api/routing/introductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": "1",
        },
        body: JSON.stringify({
          email,
          admin_email: email,
          owner: "1",
          routing_action_id: actionId,
          signal_id: first(action.signal_id, signalId),
          item_id: exactItemId(action),
          title: `Intro: ${titleOf(action)}`,
          note: noteOf(action),
          member_email: memberEmail,
          visible_to_email: memberEmail,
          recipient_email: memberEmail,
          counterparty_email: email,
          priority: priorityOf(action),
          status: "staged",
          intro_status: "staged",
          source: "routing_room_stage_intro",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not stage introduction.");
      }

      setIntroStatus(data?.message || "Controlled introduction staged.");
      setIntroEmailByAction((prev) => ({ ...prev, [actionId]: "" }));
    } catch (error: any) {
      setIntroStatus(error?.message || "Could not stage introduction.");
    } finally {
      setIntroBusyId("");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const urgent = actions.filter((item) => priorityOf(item) === "urgent").length;
  const high = actions.filter((item) => priorityOf(item) === "high").length;
  const buyer = actions.filter((item) => actionOf(item).includes("buyer")).length;
  const lender = actions.filter((item) => actionOf(item).includes("lender")).length;
  const operator = actions.filter((item) => actionOf(item).includes("operator")).length;

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Routing Intelligence
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Routing room.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            Exact signal room with owner-controlled routing action generation.
          </p>

          <div>
            <span style={chip}>Signal: {signalId}</span>
            <span style={chip}>Actions: {actions.length}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>{owner ? "Owner Controls" : "Member Read-only"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Routing</button>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            {owner && <Link href="/admin-routing-confidence" style={ghost}>Routing Confidence</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {introStatus && (
            <p style={{ color: introStatus.toLowerCase().includes("could not") || introStatus.toLowerCase().includes("required") || introStatus.toLowerCase().includes("enter") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {introStatus}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Actions" value={actions.length} detail="Routing actions tied to this exact signal." />
          <StatCard title="Urgent" value={urgent} detail="Urgent routing pressure." />
          <StatCard title="High" value={high} detail="High-priority routing actions." />
          <StatCard title="Buyer" value={buyer} detail="Buyer-directed routes." />
          <StatCard title="Lender" value={lender} detail="Capital/lender-directed routes." />
          <StatCard title="Operator" value={operator} detail="Operator-directed routes." />
        </section>

        {owner && (
          <section style={hero}>
            <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
              Owner Routing Generator
            </div>

            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
              Generate a real routing action.
            </h2>

            <p style={{ ...muted, fontSize: 19 }}>
              This creates a routing record only. It does not notify members, create introductions, or auto-dispatch.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <input style={input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Routing title" />
              <input style={input} value={itemId} onChange={(event) => setItemId(event.target.value)} placeholder="Optional exact item/deal/project ID" />
              <input style={input} value={stateMatch} onChange={(event) => setStateMatch(event.target.value)} placeholder="State / market match" />
              <input style={input} value={strategyMatch} onChange={(event) => setStrategyMatch(event.target.value)} placeholder="Strategy match" />

              <select style={input} value={roleNeeded} onChange={(event) => setRoleNeeded(event.target.value)}>
                <option value="Buyer" style={{ color: "#111" }}>Buyer</option>
                <option value="Lender / Capital" style={{ color: "#111" }}>Lender / Capital</option>
                <option value="Operator" style={{ color: "#111" }}>Operator</option>
                <option value="Contractor" style={{ color: "#111" }}>Contractor</option>
                <option value="Owner Review" style={{ color: "#111" }}>Owner Review</option>
              </select>

              <select style={input} value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="medium" style={{ color: "#111" }}>Medium</option>
                <option value="high" style={{ color: "#111" }}>High</option>
                <option value="urgent" style={{ color: "#111" }}>Urgent</option>
              </select>
            </div>

            <textarea
              style={{ ...input, minHeight: 120, marginTop: 14 }}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why should this signal be routed? What opportunity, pressure, or fit created it?"
            />

            <button type="button" style={btn} disabled={busy} onClick={generateRoutingAction}>
              {busy ? "Generating..." : "Generate Routing Action"}
            </button>

            {generateStatus && (
              <p style={{ color: generateStatus.toLowerCase().includes("could not") || generateStatus.toLowerCase().includes("required") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
                {generateStatus}
              </p>
            )}
          </section>
        )}

        {actions.length > 0 ? (
          <section style={grid}>
            {actions.map((item, index) => {
              const tone = toneOf(item);
              const workHref = exactWorkHref(item);

              return (
                <article key={item.id || index} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ color: tone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(priorityOf(item))} · {label(actionOf(item))}
                  </div>

                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {titleOf(item)}
                  </h2>

                  <p style={{ ...muted, fontSize: 18 }}>
                    {noteOf(item)}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    <span style={chip}>Confidence: {scoreOf(item)}%</span>
                    {item.state_match && <span style={chip}>State: {item.state_match}</span>}
                    {item.strategy_match && <span style={chip}>Strategy: {item.strategy_match}</span>}
                    {item.role_match && <span style={chip}>Role: {item.role_match}</span>}
                    {exactItemId(item) && <span style={chip}>Item: {exactItemId(item)}</span>}
                  </div>

                  {owner && (
                    <div style={{ marginTop: 14 }}>
                      <input
                        style={input}
                        value={introEmailByAction[String(item.id || "")] || ""}
                        onChange={(event) =>
                          setIntroEmailByAction((prev) => ({
                            ...prev,
                            [String(item.id || "")]: event.target.value,
                          }))
                        }
                        placeholder="Member email to stage intro..."
                      />

                      <button
                        type="button"
                        style={btn}
                        disabled={introBusyId === String(item.id || "")}
                        onClick={() => stageIntroductionFromAction(item)}
                      >
                        {introBusyId === String(item.id || "") ? "Staging..." : "Stage Controlled Intro"}
                      </button>
                    </div>
                  )}

                  <div className="vf-actions">
                    <Link href={`/signals/${encodeURIComponent(signalId)}`} style={btn}>Signal Detail</Link>
                    {workHref && <Link href={workHref} style={ghost}>Exact Work Area</Link>}
                    <Link href="/activity" style={ghost}>Activity</Link>
                    <Link href="/introductions" style={ghost}>Introductions</Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section style={hero}>
            <strong>No routing actions found for this signal yet.</strong>
            <p style={{ ...muted }}>
              Member view stays empty until owner/admin generates or logs a routing action.
            </p>
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Current Routing Mode
          </div>
          <p style={{ ...muted, fontSize: 19 }}>
            Routing intelligence is controlled. Owner can generate a routing record, but the platform does not auto-contact,
            auto-route, create introductions, or autonomously execute.
          </p>
        </section>
      </div>
    </main>
  );
}
