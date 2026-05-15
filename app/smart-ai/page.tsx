"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Insight = Record<string, any>;

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.20)",
  background: "rgba(255,255,255,.03)",
  borderRadius: 32,
  padding: 24,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.03)",
  borderRadius: 26,
  overflow: "hidden",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 18px",
  borderRadius: 999,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 900,
  background: "#f5d978",
  color: "#111",
  marginRight: 10,
  marginBottom: 10,
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.12)",
};

const red: React.CSSProperties = {
  ...button,
  background: "rgba(255,80,80,.18)",
  color: "#ffd2d2",
  border: "1px solid rgba(255,120,120,.30)",
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

function currentEmail() {
  if (typeof window === "undefined") return "";

  return String(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email") ||
      ""
  )
    .trim()
    .toLowerCase();
}

function trashKey(email: string) {
  return `vf_smart_ai_deleted_${email || "guest"}`;
}

function loadTrash(email: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(trashKey(email));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrash(email: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(trashKey(email), JSON.stringify(ids));
}

function itemKey(item: Insight) {
  return [
    item.kind || "",
    item.id || "",
    item.title || "",
    item.market || "",
  ].join("|");
}

function InsightCard({
  item,
  onDelete,
  onRestore,
  deletedMode,
}: {
  item: Insight;
  onDelete: (item: Insight) => void;
  onRestore: (item: Insight) => void;
  deletedMode: boolean;
}) {
  return (
    <article style={card}>
      {item.photo && (
        <img
          src={item.photo}
          alt={item.title}
          style={{
            width: "100%",
            height: 240,
            objectFit: "cover",
            display: "block",
          }}
        />
      )}

      <div style={{ padding: 22 }}>
        <div
          style={{
            color: "#e8c46b",
            letterSpacing: 3,
            fontWeight: 900,
            fontSize: 12,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          AI Background Intelligence
        </div>

        <h2
          style={{
            fontSize: 44,
            lineHeight: 0.92,
            margin: "0 0 16px",
          }}
        >
          {item.title || "Untitled"}
        </h2>

        <div style={{ marginBottom: 12 }}>
          {item.score !== undefined && (
            <span
              style={{
                display: "inline-flex",
                border: "1px solid rgba(157,243,191,.30)",
                borderRadius: 999,
                padding: "7px 10px",
                color: "#9df3bf",
                background: "rgba(157,243,191,.08)",
                fontWeight: 900,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              AI Fit: {item.score}
            </span>
          )}
          {item.priority && (
            <span
              style={{
                display: "inline-flex",
                border: "1px solid rgba(232,196,107,.30)",
                borderRadius: 999,
                padding: "7px 10px",
                color: "#f5d978",
                background: "rgba(232,196,107,.08)",
                fontWeight: 900,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              {item.priority}
            </span>
          )}
        </div>

        <p
          style={{
            color: "rgba(255,255,255,.78)",
            lineHeight: 1.55,
            fontSize: 18,
          }}
        >
          {item.summary || item.best_move || (Array.isArray(item.reasoning) ? item.reasoning.join(" · ") : "") || "No summary yet."}
        </p>

        <div style={{ marginTop: 20 }}>
          {item.href && (
            <Link href={item.href} style={button}>
              {item.href === "/projects" ? "Open Projects" : "Open Room"}
            </Link>
          )}

          <Link href="/dashboard" style={ghost}>
            Dashboard
          </Link>

          {!deletedMode ? (
            <button type="button" style={red} onClick={() => onDelete(item)}>
              Delete
            </button>
          ) : (
            <button type="button" style={ghost} onClick={() => onRestore(item)}>
              Restore
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SmartAIPage() {
  const [items, setItems] = useState<Insight[]>([]);
  const [status, setStatus] = useState("Loading workstation...");
  const [mode, setMode] = useState("active");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const viewer = currentEmail();
        setEmail(viewer);

        if (!viewer) {
          setItems([]);
          setStatus("Log in to view Smart AI.");
          return;
        }

        const res = await fetch(`/api/smart-ai?email=${encodeURIComponent(viewer)}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": viewer,
          },
        });

        const data = await res.json();

        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || "Smart AI could not load.");
        }

        setItems(Array.isArray(data?.insights) ? data.insights : []);
        setStatus("");
      } catch {
        setStatus("Could not load workstation.");
      }
    }

    load();
  }, []);

  const deletedIds = useMemo(() => loadTrash(email), [email]);

  const activeItems = useMemo(() => {
    return items.filter((item) => !deletedIds.includes(itemKey(item)));
  }, [items, deletedIds]);

  const deletedItems = useMemo(() => {
    return items.filter((item) => deletedIds.includes(itemKey(item)));
  }, [items, deletedIds]);

  function deleteItem(item: Insight) {
    const next = Array.from(new Set([...deletedIds, itemKey(item)]));
    saveTrash(email, next);
    setMode("active");
  }

  function restoreItem(item: Insight) {
    const next = deletedIds.filter((id) => id !== itemKey(item));
    saveTrash(email, next);
    setMode("deleted");
  }

  function clearTrash() {
    saveTrash(email, []);
    setMode("active");
  }

  const visible = mode === "deleted" ? deletedItems : activeItems;

  return (
    <main style={pageStyle}>
      <div style={wrap}>
        <section style={hero}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: 5,
              fontWeight: 900,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            VaultForge Project Desk
          </div>

          <h1
            style={{
              fontSize: "clamp(60px,12vw,120px)",
              lineHeight: 0.9,
              margin: "0 0 20px",
            }}
          >
            Workstations.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.75)",
              fontSize: 22,
              lineHeight: 1.5,
            }}
          >
            Deal and pain records share one execution desk. Delete keeps the
            workspace clean without permanently removing database records.
          </p>

          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              style={mode === "active" ? button : ghost}
              onClick={() => setMode("active")}
            >
              Active ({activeItems.length})
            </button>

            <button
              type="button"
              style={mode === "deleted" ? button : ghost}
              onClick={() => setMode("deleted")}
            >
              Deleted ({deletedItems.length})
            </button>

            <button type="button" style={ghost} onClick={() => window.location.reload()}>
              Refresh
            </button>

            <Link href="/submit" style={ghost}>
              Create Deal
            </Link>

            <Link href="/pain" style={ghost}>
              Submit Pain
            </Link>

            {mode === "deleted" && (
              <button type="button" style={red} onClick={clearTrash}>
                Empty Trash
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: 18,
              color: "rgba(255,255,255,.65)",
              fontSize: 16,
            }}
          >
            Signed in: {email || "guest"} · Deleted: {deletedItems.length}
          </div>
        </section>

        {status && (
          <section style={hero}>
            <strong>{status}</strong>
          </section>
        )}

        {!status && visible.length === 0 && (
          <section style={hero}>
            <strong>No Smart AI records visible.</strong>
            <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>
              Active may be empty if all records are deleted, hidden, or the API has no scored insights yet. Use Deleted to restore items or Refresh after adding deals/pain.
            </p>
          </section>
        )}

        <section style={grid}>
          {visible.map((item, index) => (
            <InsightCard
              key={`${itemKey(item)}-${index}`}
              item={item}
              deletedMode={mode === "deleted"}
              onDelete={deleteItem}
              onRestore={restoreItem}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
