"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RoutingAction = {
  id?: string;
  signal_id?: string;
  item_id?: string;
  action?: string;
  title?: string;
  note?: string;
  priority?: string;
  target_role?: string;
  created_at?: string;
};

type Introduction = {
  id?: string;
  signal_id?: string;
  item_id?: string;
  member_email?: string;
  intro_to_email?: string;
  intro_type?: string;
  status?: string;
  title?: string;
  note?: string;
  priority?: string;
  created_at?: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
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
  )
    .trim()
    .toLowerCase();
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function actionLabel(action: string) {
  const text = String(action || "routing_action").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function introLabel(value: string) {
  const text = String(value || "introduction").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function ToolCard({
  title,
  text,
  href,
  button,
}: {
  title: string;
  text: string;
  href: string;
  button: string;
}) {
  return (
    <article style={card}>
      <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 4, fontWeight: 900, marginBottom: 10 }}>
        VAULTFORGE
      </div>

      <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>
        {title}
      </h2>

      <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
        {text}
      </p>

      <Link href={href} style={btn}>
        {button}
      </Link>
    </article>
  );
}

export default function DashboardPage() {
  const [actions, setActions] = useState<RoutingAction[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);

  async function loadRouting() {
    try {
      const email = getEmail();

      const owner =
        email === OWNER_EMAIL ||
        readCookie("vf_admin") === "1";

      const res = await fetch(
        `/api/routing/actions?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
            "x-vf-admin": owner ? "1" : "0",
          },
        }
      );

      const data = await safeJson(res);

      if (res.ok && data?.ok !== false) {
        setActions(Array.isArray(data?.actions) ? data.actions.slice(0, 4) : []);
      }
    } catch {}
  }

  async function loadIntroductions() {
    try {
      const email = getEmail();

      const owner =
        email === OWNER_EMAIL ||
        readCookie("vf_admin") === "1";

      const res = await fetch(
        `/api/routing/introductions?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
            "x-vf-admin": owner ? "1" : "0",
          },
        }
      );

      const data = await safeJson(res);

      if (res.ok && data?.ok !== false) {
        const list = Array.isArray(data?.introductions) ? data.introductions : [];
        const visible = owner
          ? list
          : list.filter((item: Introduction) =>
              ["approved", "ready", "sent"].includes(String(item.status || "").trim().toLowerCase())
            );

        setIntroductions(visible.slice(0, 4));
      }
    } catch {}
  }

  useEffect(() => {
    loadRouting();
    loadIntroductions();
  }, []);

  const metrics = useMemo(() => {
    return {
      routed: actions.length,
      urgent: actions.filter((a) => clean(a.priority).toLowerCase() === "urgent").length,
    };
  }, [actions]);

  const introMetrics = useMemo(() => {
    return {
      visible: introductions.length,
      ready: introductions.filter((item) => clean(item.status).toLowerCase() === "ready").length,
      sent: introductions.filter((item) => clean(item.status).toLowerCase() === "sent").length,
    };
  }, [introductions]);

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 5, fontWeight: 900, marginBottom: 12 }}>
            VAULTFORGE COMMAND CENTER
          </div>

          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: .86, margin: "0 0 18px" }}>
            Intelligence dashboard.
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.5 }}>
            Routing, signals, deal rooms, smart alerts, and market intelligence connected into one operating system.
          </p>

          <Link href="/intelligence" style={btn}>Intelligence Map</Link>
          <Link href="/alerts" style={ghost}>Smart Alerts</Link>
          <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
          <Link href="/introductions" style={ghost}>Introductions</Link>
          <Link href="/submit" style={ghost}>Create Deal</Link>
          <Link href="/pain-submit" style={ghost}>Pain Button</Link>
          <Link href="/projects" style={ghost}>Deal Rooms</Link>
          <Link href="/messages" style={ghost}>Messages</Link>
        </section>

        <section style={grid}>
          <ToolCard
            title="Routing Inbox"
            text="Review routed opportunities connected to your role, geography, and strategy."
            href="/routing-inbox"
            button="Open Routing Inbox"
          />

          <ToolCard
            title="Introductions"
            text="Review controlled introductions staged through the VaultForge routing system."
            href="/introductions"
            button="Open Introductions"
          />

          <ToolCard
            title="Smart Alerts"
            text="Review live market intelligence, distress signals, and opportunity scoring."
            href="/alerts"
            button="Open Alerts"
          />

          <ToolCard
            title="Intelligence Map"
            text="Bloomberg-style signal mapping for deals, pain, buyers, operators, and lenders."
            href="/intelligence"
            button="Open Intelligence"
          />

          <ToolCard
            title="Create Deal"
            text="Submit residential, commercial, and land opportunities into the routing system."
            href="/submit"
            button="Create Deal"
          />
        </section>

        <section style={{ ...hero, marginTop: 24 }}>
          <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 5, fontWeight: 900, marginBottom: 12 }}>
            LIVE ROUTING ACTIVITY
          </div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Routed opportunity feed.
          </h2>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.5 }}>
            Quick view into recently routed buyer, lender, operator, and review opportunities.
          </p>

          <div style={{ marginBottom: 18 }}>
            <span style={chip}>Routed: {metrics.routed}</span>
            <span style={chip}>Urgent: {metrics.urgent}</span>
          </div>

          {actions.length === 0 ? (
            <div style={card}>
              <strong>No routing activity yet.</strong>
            </div>
          ) : (
            <section style={grid}>
              {actions.map((action, index) => (
                <article key={action.id || `${action.action}-${index}`} style={card}>
                  <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 4, fontWeight: 900, marginBottom: 10 }}>
                    {actionLabel(action.action || "routing_action")}
                  </div>

                  <h3 style={{ fontSize: 28, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {action.title || "Routing action"}
                  </h3>

                  <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
                    {action.note || "No routing note recorded."}
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    {action.priority && <span style={chip}>{action.priority}</span>}
                    {action.target_role && <span style={chip}>{action.target_role}</span>}
                  </div>

                  {action.signal_id && (
                    <Link
                      href={`/routing-room/${encodeURIComponent(action.signal_id)}`}
                      style={btn}
                    >
                      Open Routing Room
                    </Link>
                  )}

                  {action.item_id && (
                    <Link
                      href={`/deal-room/${encodeURIComponent(action.item_id)}`}
                      style={ghost}
                    >
                      Open Deal Room
                    </Link>
                  )}
                </article>
              ))}
            </section>
          )}
        </section>

        <section style={{ ...hero, marginTop: 24 }}>
          <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 5, fontWeight: 900, marginBottom: 12 }}>
            CONTROLLED INTRODUCTIONS
          </div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Introduction activity.
          </h2>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.5 }}>
            Quick view into introductions staged by the VaultForge control layer. This is read-only and does not send messages.
          </p>

          <div style={{ marginBottom: 18 }}>
            <span style={chip}>Visible: {introMetrics.visible}</span>
            <span style={chip}>Ready: {introMetrics.ready}</span>
            <span style={chip}>Sent: {introMetrics.sent}</span>
          </div>

          {introductions.length === 0 ? (
            <div style={card}>
              <strong>No introductions visible yet.</strong>
            </div>
          ) : (
            <section style={grid}>
              {introductions.map((intro, index) => (
                <article key={intro.id || `${intro.signal_id}-${index}`} style={card}>
                  <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 4, fontWeight: 900, marginBottom: 10 }}>
                    {introLabel(intro.status || "introduction")}
                  </div>

                  <h3 style={{ fontSize: 28, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {intro.title || "Controlled Introduction"}
                  </h3>

                  <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
                    {intro.note || "No introduction note recorded."}
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    {intro.priority && <span style={chip}>{intro.priority}</span>}
                    {intro.intro_type && <span style={chip}>{intro.intro_type}</span>}
                  </div>

                  {intro.id && (
                    <Link
                      href={`/introduction/${encodeURIComponent(intro.id)}`}
                      style={btn}
                    >
                      Open Introduction
                    </Link>
                  )}

                  {intro.signal_id && (
                    <Link
                      href={`/routing-room/${encodeURIComponent(intro.signal_id)}`}
                      style={ghost}
                    >
                      Routing Room
                    </Link>
                  )}
                </article>
              ))}
            </section>
          )}

          <Link href="/introductions" style={ghost}>
            View All Introductions
          </Link>
        </section>
      </div>
    </main>
  );
}
