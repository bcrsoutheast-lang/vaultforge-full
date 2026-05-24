"use client";

import { useEffect, useMemo, useState } from "react";

type AlertAudience = "admin" | "member" | "investor" | "public";

type AlertItem = {
  key: string;
  label: string;
  count: number;
  tone: "gold" | "red" | "blue" | "green";
  note: string;
};

const DEAL_KEYS = [
  "vaultforge_deal_rooms_v1",
  "vaultforge_deals_v1",
  "vf_deals",
  "vaultforge_projects_v1",
  "vaultforge_clean_deal_rooms_v1",
];

const PAIN_KEYS = [
  "vaultforge_pain_rooms_v1",
  "vaultforge_pain_requests_v1",
  "vf_pain_requests",
  "vaultforge_clean_pain_rooms_v1",
];

const MESSAGE_KEYS = [
  "vaultforge_designated_route_messages_v1",
  "vaultforge_owner_direct_messages_v1",
  "vaultforge_requests_v1",
  "vaultforge_admin_investor_inbox_v1",
  "vaultforge_admin_messages_v1",
  "vaultforge_investor_admin_messages_v1",
  "vaultforge_investor_requests_v1",
];

const PAYMENT_KEYS = [
  "vaultforge_mock_member_payment_v1",
  "vaultforge_mock_investor_payment_v1",
  "vaultforge_mock_access_approvals_v1",
];

const PROFILE_KEYS = [
  "vaultforge_admin_profile_approval_queue_v1",
  "vaultforge_investor_application_v1",
  "vaultforge_admin_members_v1",
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function rowsFromKeys(keys: string[]) {
  if (typeof window === "undefined") return [];

  const rows: any[] = [];

  keys.forEach((key) => {
    const parsed = readJson<any>(key, []);
    if (Array.isArray(parsed)) rows.push(...parsed.filter(Boolean));
    else if (parsed && typeof parsed === "object") {
      if (key.includes("payment") || key.includes("approvals")) rows.push(parsed);
      else rows.push(...Object.values(parsed).filter(Boolean));
    }
  });

  return rows;
}

function isNew(row: any) {
  const status = String(row?.status || row?.accessStatus || row?.paymentStatus || "").toLowerCase();
  return (
    !status ||
    status.includes("new") ||
    status.includes("pending") ||
    status.includes("ready") ||
    status.includes("paid") ||
    status.includes("message")
  );
}

function countPayments() {
  const approvals = readJson<Record<string, any>>("vaultforge_mock_access_approvals_v1", {});
  const approvalRows = Object.values(approvals || {});
  const directMember = readJson<any>("vaultforge_mock_member_payment_v1", {});
  const directInvestor = readJson<any>("vaultforge_mock_investor_payment_v1", {});

  const approvalPaid = approvalRows.filter((row: any) => {
    const status = String(row?.paymentStatus || row?.accessStatus || "").toLowerCase();
    return row?.paid || row?.unlocked || status === "paid" || status === "active";
  }).length;

  const directPaid = [directMember, directInvestor].filter((row: any) => row?.paid || row?.unlocked || row?.paymentStatus === "paid").length;

  return approvalPaid + directPaid;
}

function countProfiles() {
  const queue = readJson<any[]>("vaultforge_admin_profile_approval_queue_v1", []);
  const investor = readJson<any>("vaultforge_investor_application_v1", {});
  const members = readJson<any[]>("vaultforge_admin_members_v1", []);

  const pendingQueue = Array.isArray(queue) ? queue.filter(isNew).length : 0;
  const investorPending = investor && typeof investor === "object" && String(investor?.status || "").includes("pending") ? 1 : 0;
  const memberPending = Array.isArray(members) ? members.filter((m) => String(m?.status || m?.memberStatus || "").toLowerCase().includes("pending")).length : 0;

  return pendingQueue + investorPending + memberPending;
}

export default function VaultForgeAlertCenter({
  audience = "member",
  title = "Live Alerts",
}: {
  audience?: AlertAudience;
  title?: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    const interval = window.setInterval(refresh, 4500);

    [
      "storage",
      "vaultforge-request-change",
      "vaultforge-owner-message-change",
      "vaultforge-owner-reply-change",
      "vaultforge-admin-message-change",
      "vaultforge-admin-action-change",
      "vaultforge-investor-change",
      "vaultforge-access-change",
      "vaultforge-mock-access-change",
      "vaultforge-deal-change",
      "vaultforge-pain-change",
      "vaultforge-room-change",
    ].forEach((eventName) => window.addEventListener(eventName, refresh));

    return () => {
      window.clearInterval(interval);
      [
        "storage",
        "vaultforge-request-change",
        "vaultforge-owner-message-change",
        "vaultforge-owner-reply-change",
        "vaultforge-admin-message-change",
        "vaultforge-admin-action-change",
        "vaultforge-investor-change",
        "vaultforge-access-change",
        "vaultforge-mock-access-change",
        "vaultforge-deal-change",
        "vaultforge-pain-change",
        "vaultforge-room-change",
      ].forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, []);

  const alerts = useMemo<AlertItem[]>(() => {
    const deals = rowsFromKeys(DEAL_KEYS).filter((row) => !String(row?.status || row?.folder || "").toLowerCase().includes("deleted")).length;
    const pain = rowsFromKeys(PAIN_KEYS).filter((row) => !String(row?.status || row?.folder || "").toLowerCase().includes("deleted")).length;
    const messages = rowsFromKeys(MESSAGE_KEYS).filter(isNew).length;
    const payments = countPayments();
    const profiles = countProfiles();

    const base: AlertItem[] = [
      { key: "deals", label: "New Deals", count: deals, tone: "gold", note: "deal opportunity cards" },
      { key: "pain", label: "New Pain", count: pain, tone: "red", note: "problem/pain signals" },
      { key: "messages", label: "Messages", count: messages, tone: "blue", note: "owner/member/investor requests" },
    ];

    if (audience === "admin") {
      base.unshift({ key: "profiles", label: "Profiles", count: profiles, tone: "green", note: "profiles needing review" });
      base.push({ key: "payments", label: "Payment Alerts", count: payments, tone: "gold", note: "paid/unlocked records" });
    }

    if (audience === "investor") {
      base.push({ key: "owner", label: "Owner Replies", count: rowsFromKeys(["vaultforge_owner_replies_v1"]).length, tone: "green", note: "owner replies to requests" });
    }

    if (audience === "member") {
      base.push({ key: "routes", label: "Routed Requests", count: messages, tone: "green", note: "requests needing action" });
    }

    return base;
  }, [audience, tick]);

  const total = alerts.reduce((sum, item) => sum + item.count, 0);

  const toneStyle = (tone: AlertItem["tone"]) => {
    if (tone === "red") return { borderColor: "rgba(255,70,70,.55)", boxShadow: "0 0 28px rgba(255,70,70,.14)" };
    if (tone === "blue") return { borderColor: "rgba(0,132,255,.55)", boxShadow: "0 0 28px rgba(0,132,255,.14)" };
    if (tone === "green") return { borderColor: "rgba(48,255,135,.45)", boxShadow: "0 0 28px rgba(48,255,135,.12)" };
    return { borderColor: "rgba(245,197,66,.58)", boxShadow: "0 0 28px rgba(245,197,66,.16)" };
  };

  return (
    <section
      style={{
        border: "1px solid rgba(245,197,66,.24)",
        background: "linear-gradient(180deg,#080d19,#050816)",
        borderRadius: 26,
        padding: 18,
        margin: "0 0 18px",
      }}
    >
      <style>{`
        @keyframes vfAlertPulse {
          0%, 100% { transform: scale(1); opacity: .92; }
          50% { transform: scale(1.035); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          color: "#ffd45a",
          textTransform: "uppercase",
          letterSpacing: 5,
          fontWeight: 950,
          fontSize: 12,
          marginBottom: 10,
        }}
      >
        {title} • {total} active
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
          gap: 10,
        }}
      >
        {alerts.map((item) => (
          <div
            key={item.key}
            style={{
              background: "#121724",
              border: "1px solid rgba(207,216,230,.16)",
              borderRadius: 20,
              padding: 14,
              animation: item.count > 0 ? "vfAlertPulse 1.8s ease-in-out infinite" : "none",
              ...toneStyle(item.tone),
            }}
          >
            <div
              style={{
                color: "#ffd45a",
                textTransform: "uppercase",
                letterSpacing: 3,
                fontWeight: 950,
                fontSize: 10,
                marginBottom: 7,
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                color: item.count > 0 ? "#1688ff" : "#64748b",
                fontWeight: 950,
                fontSize: 34,
                lineHeight: 1,
              }}
            >
              {item.count}
            </div>

            <p style={{ color: "#aeb7c7", margin: "6px 0 0", fontSize: 12 }}>
              {item.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
