"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AlertItem = Record<string, any>;

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

  const keys = ["vf_email", "vf_member_email", "memberEmail", "email"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieValue = cleanEmail(readCookie("vf_email") || readCookie("vf_member_email"));
  return cookieValue.includes("@") ? cookieValue : "";
}

function seenKey(email: string) {
  return `vaultforge_seen_alerts_${email || "guest"}`;
}

function getSeen(email: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(seenKey(email)) || "[]");
    if (Array.isArray(parsed)) return new Set(parsed.map(clean).filter(Boolean));
  } catch {
    // Continue.
  }

  return new Set<string>();
}

function alertId(row: AlertItem, index: number) {
  return clean(
    row.alert_id ||
      row.id ||
      row.signal_id ||
      row.item_id ||
      row.deal_id ||
      row.pain_id ||
      row.room_id ||
      row.project_id ||
      row.title ||
      row.deal_title ||
      row.pain_title ||
      `alert-${index}`
  );
}

function normalizeRows(data: any) {
  return [
    ...(Array.isArray(data.alerts) ? data.alerts : []),
    ...(Array.isArray(data.signals) ? data.signals : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(Array.isArray(data.deals) ? data.deals : []),
    ...(Array.isArray(data.pains) ? data.pains : []),
  ];
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function VaultForgeAlertBadge({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const viewer = getEmail();
      setEmail(viewer);

      const endpoints = [
        `/api/alerts/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/deal/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/dashboard/live?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": viewer,
              "x-vf-admin": "0",
            },
          });

          const data = await safeJson(response);
          const rows = normalizeRows(data);

          if (response.ok && rows.length) {
            setAlerts(rows);
            setLoaded(true);
            return;
          }
        } catch {
          // Try next.
        }
      }

      setAlerts([]);
      setLoaded(true);
    }

    load();
  }, []);

  const unseenCount = useMemo(() => {
    const seen = getSeen(email);
    return alerts.filter((row, index) => !seen.has(alertId(row, index))).length;
  }, [alerts, email, loaded]);

  const shouldPulse = unseenCount > 0;

  return (
    <Link
      href="/alerts"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? 38 : 46,
        borderRadius: 999,
        padding: compact ? "8px 12px" : "11px 16px",
        border: shouldPulse ? "1px solid rgba(248,113,113,.60)" : "1px solid rgba(255,255,255,.16)",
        background: shouldPulse
          ? "linear-gradient(135deg,rgba(248,113,113,.22),rgba(232,196,107,.16))"
          : "rgba(255,255,255,.06)",
        color: shouldPulse ? "#fecaca" : "white",
        fontWeight: 950,
        textDecoration: "none",
        boxShadow: shouldPulse ? "0 0 0 0 rgba(248,113,113,.55)" : "none",
        animation: shouldPulse ? "vfAlertPulse 1.35s ease-in-out infinite" : "none",
      }}
      title={unseenCount ? `${unseenCount} new VaultForge alert${unseenCount === 1 ? "" : "s"}` : "Alerts"}
    >
      <style>{`
        @keyframes vfAlertPulse {
          0% { box-shadow: 0 0 0 0 rgba(248,113,113,.55); transform: translateY(0); }
          55% { box-shadow: 0 0 0 10px rgba(248,113,113,0); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); transform: translateY(0); }
        }
      `}</style>

      {unseenCount > 0 ? `New Alerts (${unseenCount})` : "Alerts"}
    </Link>
  );
}
