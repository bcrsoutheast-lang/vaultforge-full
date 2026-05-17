"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  roomId: string;
  roomTitle: string;
  sourceRoute?: string;
  status?: "active" | "saved" | "archived" | "deleted";
  variant?: "card" | "room";
  onChanged?: () => void;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function readEmail() {
  if (typeof window === "undefined") return "";

  const localKeys = ["vf_email", "vf_member_email", "memberEmail", "email"];

  for (const key of localKeys) {
    try {
      const value = clean(window.localStorage.getItem(key));
      if (value.includes("@")) return value.toLowerCase();
    } catch {
      // Continue.
    }
  }

  const match =
    document.cookie.match(/(?:^|;\s*)vf_email=([^;]+)/) ||
    document.cookie.match(/(?:^|;\s*)vf_member_email=([^;]+)/);

  if (match) {
    try {
      return decodeURIComponent(match[1] || "").toLowerCase();
    } catch {
      return String(match[1] || "").toLowerCase();
    }
  }

  return "guest@vaultforge.local";
}

const btn: React.CSSProperties = {
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 15px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  textAlign: "center",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
};

const green: React.CSSProperties = {
  ...ghost,
  color: "#bbf7d0",
  border: "1px solid rgba(34,197,94,.38)",
  background: "rgba(34,197,94,.10)",
};

const blue: React.CSSProperties = {
  ...ghost,
  color: "#bae6fd",
  border: "1px solid rgba(56,189,248,.38)",
  background: "rgba(56,189,248,.10)",
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.42)",
  background: "rgba(248,113,113,.10)",
};

const redSolid: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#ef4444,#991b1b)",
  color: "white",
};

export default function VaultForgeDealActions({
  roomId,
  roomTitle,
  sourceRoute = "",
  status = "active",
  variant = "card",
  onChanged,
}: Props) {
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const id = clean(roomId);
  const title = clean(roomTitle) || "Opportunity Room";
  const route = clean(sourceRoute) || `/deal/detail?id=${encodeURIComponent(id)}`;

  async function run(action: "save" | "archive" | "delete" | "restore" | "permanent_delete") {
    if (!id || busy) return;

    setBusy(action);
    setNotice("");

    if (action === "permanent_delete") {
      setNotice("Permanent delete is currently local-folder cleanup only. Use Hidden until database hard delete is added.");
      setBusy("");
      return;
    }

    const email = readEmail();

    try {
      const response = await fetch("/api/room/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          action,
          user_email: email,
          room_id: id,
          room_type: "opportunity",
          room_title: title,
          source_route: route,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        setNotice(data?.error || data?.supabase_error || "Room action failed.");
        return;
      }

      if (action === "save") setNotice("Saved. Moving to Saved folder.");
      if (action === "archive") setNotice("Archived. Moving to Archived folder.");
      if (action === "delete") setNotice("Hidden. Moving to Hidden folder.");
      if (action === "restore") setNotice("Restored to Active.");

      if (onChanged) onChanged();

      if (variant === "room") {
        const next =
          action === "save"
            ? "/projects?folder=saved"
            : action === "archive"
              ? "/projects?folder=archived"
              : action === "delete"
                ? "/projects?folder=deleted"
                : "/projects?folder=active";

        window.setTimeout(() => {
          window.location.href = next;
        }, 450);
      }
    } catch (error: any) {
      setNotice(error?.message || "Room action failed.");
    } finally {
      setBusy("");
    }
  }

  const layout: React.CSSProperties =
    variant === "room"
      ? { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }
      : { display: "flex", flexWrap: "wrap", gap: 10 };

  if (status === "deleted") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={layout}>
          <button type="button" onClick={() => run("restore")} style={green} disabled={Boolean(busy)}>
            Restore Active
          </button>

          <button type="button" onClick={() => run("permanent_delete")} style={redSolid} disabled={Boolean(busy)}>
            Permanent Delete
          </button>

          <Link href="/projects?folder=deleted" style={ghost}>
            Hidden Folder
          </Link>

          <Link href="/projects" style={ghost}>
            Projects
          </Link>
        </div>

        {notice ? <p style={{ color: "#f8e7b0", margin: 0, fontWeight: 900 }}>{notice}</p> : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={layout}>
        {variant !== "room" ? (
          <Link href={route} style={btn}>
            Open Room
          </Link>
        ) : null}

        <button type="button" onClick={() => run("save")} style={status === "saved" ? green : ghost} disabled={Boolean(busy)}>
          Save
        </button>

        <button type="button" onClick={() => run("archive")} style={status === "archived" ? blue : ghost} disabled={Boolean(busy)}>
          Archive
        </button>

        <button type="button" onClick={() => run("delete")} style={danger} disabled={Boolean(busy)}>
          Hide
        </button>

        <Link
          href={`/messages/new?subject=${encodeURIComponent(title)}&room_id=${encodeURIComponent(id)}&room_type=${encodeURIComponent(
            "Opportunity Room"
          )}&source_route=${encodeURIComponent(route)}`}
          style={ghost}
        >
          Message
        </Link>

        <Link href="/projects?folder=saved" style={ghost}>
          Saved
        </Link>

        <Link href="/projects?folder=archived" style={ghost}>
          Archived
        </Link>

        <Link href="/projects?folder=deleted" style={ghost}>
          Hidden
        </Link>
      </div>

      {notice ? <p style={{ color: "#f8e7b0", margin: 0, fontWeight: 900 }}>{notice}</p> : null}
    </div>
  );
}
