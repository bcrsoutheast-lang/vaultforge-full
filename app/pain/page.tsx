"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PainRow = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,120,120,.20), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,120,120,.30)",
  background:
    "linear-gradient(145deg, rgba(255,120,120,.12), rgba(181,92,255,.10), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(255,120,120,.06), rgba(255,255,255,.03))",
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
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.36)",
  color: "#ffd0d0",
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

function getEmail() {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      ""
    )
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizePhotos(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  const text = asText(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    // Continue.
  }

  return [text];
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
  }

  const text = asText(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
    }
  } catch {
    // Continue.
  }

  return text.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export default function PainPage() {
  const [rows, setRows] = useState<PainRow[]>([]);
  const [status, setStatus] = useState("Loading pain feed...");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    try {
      const email = getEmail();

      const res = await fetch(`/api/pain/list?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Could not load pain feed.");
      }

      setRows(Array.isArray(data?.pain) ? data.pain : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load pain feed.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function action(id: string, type: string) {
    const email = getEmail();

    setBusyId(`${id}-${type}`);
    setToast("");

    try {
      const res = await fetch("/api/pain/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          id,
          action: type,
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Pain action failed.");
      }

      if (type === "dismiss" || type === "archive") {
        setRows((current) => current.filter((row) => String(row.id) !== id));
      } else if (type === "save") {
        setRows((current) =>
          current.map((row) => {
            if (String(row.id) !== id) return row;

            const existing = normalizeArray(row.saved_by);

            return {
              ...row,
              saved_by: Array.from(new Set([...existing, email])),
            };
          })
        );
      } else if (type === "unsave") {
        setRows((current) =>
          current.map((row) => {
            if (String(row.id) !== id) return row;

            return {
              ...row,
              saved_by: normalizeArray(row.saved_by).filter((v) => v !== email),
            };
          })
        );
      } else if (type === "interested") {
        setRows((current) =>
          current.map((row) => {
            if (String(row.id) !== id) return row;

            const existing = normalizeArray(row.interested_by);

            return {
              ...row,
              interested_by: Array.from(new Set([...existing, email])),
            };
          })
        );
      }

      setToast(data?.message || `${type} completed.`);
    } catch (error: any) {
      setToast(error?.message || "Pain action failed.");
    } finally {
      setBusyId("");
    }
  }

  const email = getEmail();

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (row.archived === true) return false;

        const dismissed = normalizeArray(row.dismissed_by);
        if (dismissed.includes(email)) return false;

        return true;
      }),
    [email, rows]
  );

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", fontWeight: 900, letterSpacing: 4, marginBottom: 12 }}>
            LIVE PAIN WORKFLOW
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,98px)", lineHeight: .9, margin: "0 0 18px" }}>
            Routing intelligence.
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20 }}>
            Distress signals now support live save, interested, dismiss, and archive workflows.
          </p>

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/pain-submit" style={btn}>Pain Button</Link>
          <Link href="/messages" style={ghost}>Messages</Link>
          <button type="button" style={btn} onClick={load}>Refresh</button>
        </section>

        {toast && (
          <section style={{ ...hero, color: "#9df3bf" }}>
            {toast}
          </section>
        )}

        {status && (
          <section style={hero}>
            {status}
          </section>
        )}

        {!status && visibleRows.length === 0 && (
          <section style={hero}>
            No active distress signals.
          </section>
        )}

        <section style={{ display: "grid", gap: 18 }}>
          {visibleRows.map((row) => {
            const id = String(row.id || "");
            const photos = normalizePhotos(row.photo_urls);
            const saved = normalizeArray(row.saved_by).includes(email);
            const interested = normalizeArray(row.interested_by).includes(email);

            return (
              <article
                key={id}
                style={{
                  ...card,
                  borderColor: "rgba(157,243,191,.22)",
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <span style={chip}>{asText(row.asset_type, "Signal")}</span>
                  <span style={chip}>{asText(row.pain_type, "Pain")}</span>
                  <span style={chip}>{asText(row.urgency_level, "Normal")}</span>
                </div>

                <h2 style={{ fontSize: 36, margin: "0 0 12px" }}>
                  {asText(row.title, "Distress Signal")}
                </h2>

                <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
                  {asText(row.description, "No description.")}
                </p>

                {photos.length > 0 && (
                  <section
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 14,
                      marginTop: 16,
                    }}
                  >
                    {photos.slice(0, 4).map((src, index) => (
                      <img
                        key={`${src}-${index}`}
                        src={src}
                        alt="Pain upload"
                        style={{
                          width: "100%",
                          height: 220,
                          objectFit: "cover",
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,.12)",
                        }}
                      />
                    ))}
                  </section>
                )}

                <div style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    disabled={busyId === `${id}-save`}
                    onClick={() => action(id, saved ? "unsave" : "save")}
                    style={saved ? ghost : btn}
                  >
                    {saved ? "Saved ✓" : "Save"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === `${id}-interested`}
                    onClick={() => action(id, "interested")}
                    style={interested ? ghost : btn}
                  >
                    {interested ? "Interested ✓" : "Interested"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === `${id}-dismiss`}
                    onClick={() => action(id, "dismiss")}
                    style={danger}
                  >
                    Dismiss
                  </button>

                  <button
                    type="button"
                    disabled={busyId === `${id}-archive`}
                    onClick={() => action(id, "archive")}
                    style={danger}
                  >
                    Archive
                  </button>

                  <Link href="/messages" style={ghost}>
                    Message
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
