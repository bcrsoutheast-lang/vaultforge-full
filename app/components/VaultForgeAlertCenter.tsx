"use client";

import { useEffect, useMemo, useState } from "react";

type AlertAudience = "admin" | "member" | "investor" | "public";
type AlertTone = "gold" | "red" | "blue" | "green";

type AlertItem = {
  key: string;
  label: string;
  count: number;
  tone: AlertTone;
  note: string;
  rows: any[];
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

const PROFILE_KEYS = [
  "vaultforge_admin_profile_approval_queue_v1",
  "vaultforge_investor_application_v1",
  "vaultforge_admin_members_v1",
];

const ALL_CONTROL_KEYS = Array.from(new Set([...DEAL_KEYS, ...PAIN_KEYS, ...MESSAGE_KEYS, ...PROFILE_KEYS, "vaultforge_owner_replies_v1"]));

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function rowId(row: any, fallback = "") {
  return clean(row?.id || row?.roomId || row?.dealId || row?.painId || row?.signalId || row?.email || fallback);
}

function rowsFromKeys(keys: string[]) {
  if (typeof window === "undefined") return [];

  const rows: any[] = [];

  keys.forEach((key) => {
    const parsed = readJson<any>(key, []);
    if (Array.isArray(parsed)) {
      parsed.filter(Boolean).forEach((row, index) => rows.push({ ...row, __sourceKey: key, __rowId: rowId(row, `${key}-${index}`) }));
    } else if (parsed && typeof parsed === "object") {
      if (key.includes("payment") || key.includes("approvals")) {
        rows.push({ ...parsed, __sourceKey: key, __rowId: rowId(parsed, key) });
      } else {
        Object.values(parsed)
          .filter(Boolean)
          .forEach((row: any, index) => rows.push({ ...row, __sourceKey: key, __rowId: rowId(row, `${key}-${index}`) }));
      }
    }
  });

  return rows;
}

function isNew(row: any) {
  const status = String(row?.status || row?.accessStatus || row?.paymentStatus || row?.folder || "").toLowerCase();
  return (
    !status ||
    status.includes("new") ||
    status.includes("pending") ||
    status.includes("ready") ||
    status.includes("paid") ||
    status.includes("message") ||
    status.includes("active")
  );
}

function visibleRows(rows: any[]) {
  return rows.filter((row) => {
    const status = String(row?.status || row?.folder || "").toLowerCase();
    return !status.includes("deleted") && !status.includes("hidden");
  });
}

function paymentRows() {
  const approvals = readJson<Record<string, any>>("vaultforge_mock_access_approvals_v1", {});
  const approvalRows = Object.entries(approvals || {}).map(([key, value]: any) => ({
    id: key,
    ...(value || {}),
    __sourceKey: "vaultforge_mock_access_approvals_v1",
    __rowId: key,
  }));

  const directMember = readJson<any>("vaultforge_mock_member_payment_v1", {});
  const directInvestor = readJson<any>("vaultforge_mock_investor_payment_v1", {});

  return [
    ...approvalRows,
    directMember && Object.keys(directMember).length ? { ...directMember, id: "member-payment", __sourceKey: "vaultforge_mock_member_payment_v1", __rowId: "member-payment" } : null,
    directInvestor && Object.keys(directInvestor).length ? { ...directInvestor, id: "investor-payment", __sourceKey: "vaultforge_mock_investor_payment_v1", __rowId: "investor-payment" } : null,
  ].filter(Boolean).filter((row: any) => {
    const status = String(row?.paymentStatus || row?.accessStatus || "").toLowerCase();
    return row?.paid || row?.unlocked || status === "paid" || status === "active" || status === "ready";
  });
}

function profileRows() {
  const rows = rowsFromKeys(PROFILE_KEYS);
  return rows.filter((row) => {
    const status = String(row?.status || row?.memberStatus || row?.accessStatus || "").toLowerCase();
    return !status || status.includes("pending") || status.includes("new") || status.includes("ready");
  });
}

function ownerReplyRows() {
  return rowsFromKeys(["vaultforge_owner_replies_v1"]);
}

function titleFor(row: any) {
  return clean(
    row?.requestTitle ||
      row?.title ||
      row?.subject ||
      row?.topic ||
      row?.headline ||
      row?.company ||
      row?.name ||
      row?.email ||
      row?.id,
    "VaultForge item",
  );
}

function subFor(row: any) {
  const bits = [
    row?.kind || row?.type || row?.source || row?.__sourceKey,
    row?.city,
    row?.state,
    row?.status || row?.folder,
  ]
    .map((item) => clean(item))
    .filter(Boolean);

  return bits.join(" • ") || "Live VaultForge alert";
}

function messageFor(row: any) {
  return clean(
    row?.body ||
      row?.message ||
      row?.summary ||
      row?.notes ||
      row?.roomHeader ||
      row?.need ||
      row?.teaser,
    "Open the related lane to review this item.",
  );
}

function toneBorder(tone: AlertTone) {
  if (tone === "red") return "rgba(255,70,70,.60)";
  if (tone === "blue") return "rgba(0,132,255,.60)";
  if (tone === "green") return "rgba(48,255,135,.50)";
  return "rgba(245,197,66,.64)";
}

function toneGlow(tone: AlertTone) {
  if (tone === "red") return "0 0 30px rgba(255,70,70,.18)";
  if (tone === "blue") return "0 0 30px rgba(0,132,255,.18)";
  if (tone === "green") return "0 0 30px rgba(48,255,135,.14)";
  return "0 0 30px rgba(245,197,66,.20)";
}

function countColor(tone: AlertTone, count: number) {
  if (!count) return "#64748b";
  if (tone === "red") return "#ff4d5e";
  if (tone === "green") return "#30ff87";
  return "#1688ff";
}

function dispatchAlertChange() {
  window.dispatchEvent(new Event("vaultforge-request-change"));
  window.dispatchEvent(new Event("vaultforge-owner-message-change"));
  window.dispatchEvent(new Event("vaultforge-owner-reply-change"));
  window.dispatchEvent(new Event("vaultforge-admin-message-change"));
  window.dispatchEvent(new Event("vaultforge-admin-action-change"));
  window.dispatchEvent(new Event("vaultforge-deal-change"));
  window.dispatchEvent(new Event("vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-change"));
}

function updateRowEverywhere(target: any, nextStatus: string) {
  const targetId = rowId(target, target?.__rowId || "");
  const sourceKey = clean(target?.__sourceKey);

  ALL_CONTROL_KEYS.forEach((key) => {
    const parsed = readJson<any>(key, []);

    if (Array.isArray(parsed)) {
      const nextRows = parsed.map((row, index) => {
        const candidateId = rowId(row, `${key}-${index}`);
        const matches = candidateId === targetId || (sourceKey === key && candidateId === target?.__rowId);
        return matches
          ? {
              ...row,
              status: nextStatus,
              folder: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : row;
      });
      writeJson(key, nextRows);
      return;
    }

    if (parsed && typeof parsed === "object") {
      const candidateId = rowId(parsed, key);
      if (candidateId === targetId || sourceKey === key) {
        writeJson(key, {
          ...parsed,
          status: nextStatus,
          folder: nextStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  });

  dispatchAlertChange();
}

function deleteRowEverywhere(target: any) {
  const targetId = rowId(target, target?.__rowId || "");
  const sourceKey = clean(target?.__sourceKey);

  ALL_CONTROL_KEYS.forEach((key) => {
    const parsed = readJson<any>(key, []);

    if (Array.isArray(parsed)) {
      const nextRows = parsed.filter((row, index) => {
        const candidateId = rowId(row, `${key}-${index}`);
        return !(candidateId === targetId || (sourceKey === key && candidateId === target?.__rowId));
      });
      writeJson(key, nextRows);
      return;
    }

    if (parsed && typeof parsed === "object") {
      const candidateId = rowId(parsed, key);
      if (candidateId === targetId || sourceKey === key) {
        localStorage.removeItem(key);
      }
    }
  });

  dispatchAlertChange();
}

export default function VaultForgeAlertCenter({
  audience = "member",
  title = "Live Alerts",
}: {
  audience?: AlertAudience;
  title?: string;
}) {
  const [tick, setTick] = useState(0);
  const [openAlert, setOpenAlert] = useState<AlertItem | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [notice, setNotice] = useState("");

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
    const dealRows = visibleRows(rowsFromKeys(DEAL_KEYS));
    const painRows = visibleRows(rowsFromKeys(PAIN_KEYS));
    const messageRows = rowsFromKeys(MESSAGE_KEYS).filter(isNew);
    const payments = paymentRows();
    const profiles = profileRows();
    const replies = ownerReplyRows();

    const base: AlertItem[] = [
      {
        key: "deals",
        label: "New Deals",
        count: dealRows.length,
        tone: "gold",
        note: "deal opportunity cards",
        rows: dealRows,
      },
      {
        key: "pain",
        label: "New Pain",
        count: painRows.length,
        tone: "red",
        note: "problem/pain signals",
        rows: painRows,
      },
      {
        key: "messages",
        label: "Messages",
        count: messageRows.length,
        tone: "blue",
        note: "owner/member/investor requests",
        rows: messageRows,
      },
    ];

    if (audience === "admin") {
      base.unshift({
        key: "profiles",
        label: "Profiles",
        count: profiles.length,
        tone: "green",
        note: "profiles needing review",
        rows: profiles,
      });

      base.push({
        key: "payments",
        label: "Payment Alerts",
        count: payments.length,
        tone: "gold",
        note: "paid/unlocked records",
        rows: payments,
      });
    }

    if (audience === "investor") {
      base.push({
        key: "owner",
        label: "Owner Replies",
        count: replies.length,
        tone: "green",
        note: "owner replies to requests",
        rows: replies,
      });
    }

    if (audience === "member") {
      base.push({
        key: "routes",
        label: "Routed Requests",
        count: messageRows.length,
        tone: "green",
        note: "requests needing action",
        rows: messageRows,
      });
    }

    return base;
  }, [audience, tick]);

  const total = alerts.reduce((sum, item) => sum + item.count, 0);

  function controlRow(status: string, label: string) {
    if (!selectedRow) return;

    updateRowEverywhere(selectedRow, status);
    setSelectedRow({ ...selectedRow, status, folder: status });
    setNotice(`${label} complete.`);
    setTick((value) => value + 1);
  }

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
          0%, 100% { transform: scale(1); opacity: .94; }
          50% { transform: scale(1.035); opacity: 1; }
        }

        @keyframes vfAlertGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.16); }
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
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setOpenAlert(item);
              setSelectedRow(null);
              setNotice("");
            }}
            style={{
              textAlign: "left",
              color: "#f8fafc",
              background: "#121724",
              border: `1px solid ${toneBorder(item.tone)}`,
              borderRadius: 20,
              padding: 14,
              cursor: "pointer",
              animation: item.count > 0 ? "vfAlertPulse 1.8s ease-in-out infinite, vfAlertGlow 2.4s ease-in-out infinite" : "none",
              boxShadow: item.count > 0 ? toneGlow(item.tone) : "none",
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
                color: countColor(item.tone, item.count),
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

            <p style={{ color: "#ffd45a", margin: "9px 0 0", fontSize: 11, fontWeight: 900 }}>
              Tap to open
            </p>
          </button>
        ))}
      </div>

      {openAlert ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.78)",
            zIndex: 9999,
            padding: 18,
            overflow: "auto",
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "36px auto",
              background: "#111827",
              border: `1px solid ${toneBorder(openAlert.tone)}`,
              borderRadius: 26,
              padding: 22,
              boxShadow: toneGlow(openAlert.tone),
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div>
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
                  Alert Detail
                </div>

                <h2
                  style={{
                    fontSize: "clamp(32px,6vw,58px)",
                    lineHeight: 0.95,
                    letterSpacing: -2,
                    margin: 0,
                    fontWeight: 950,
                  }}
                >
                  {openAlert.label}
                </h2>

                <p style={{ color: "#cbd5e1", fontSize: 19, lineHeight: 1.35 }}>
                  {openAlert.count} {openAlert.note}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpenAlert(null);
                  setSelectedRow(null);
                  setNotice("");
                }}
                style={{
                  border: "1px solid rgba(207,216,230,.18)",
                  background: "#171c29",
                  color: "#f7f7fb",
                  borderRadius: 999,
                  padding: "11px 15px",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {notice ? (
              <div
                style={{
                  marginTop: 14,
                  border: "1px solid rgba(245,197,66,.45)",
                  background: "rgba(245,197,66,.08)",
                  borderRadius: 18,
                  padding: 14,
                  color: "#ffd45a",
                  fontWeight: 900,
                }}
              >
                {notice}
              </div>
            ) : null}

            {selectedRow ? (
              <div
                style={{
                  marginTop: 18,
                  background: "#0b1020",
                  border: `1px solid ${toneBorder(openAlert.tone)}`,
                  borderRadius: 22,
                  padding: 18,
                }}
              >
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
                  Request Detail / Controls
                </div>

                <h3
                  style={{
                    fontSize: "clamp(28px,5vw,44px)",
                    margin: "0 0 10px",
                    fontWeight: 950,
                    letterSpacing: -1,
                  }}
                >
                  {titleFor(selectedRow)}
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  <div style={{ background: "#111827", border: "1px solid rgba(207,216,230,.14)", borderRadius: 18, padding: 14 }}>
                    <div style={{ color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontWeight: 950, fontSize: 11 }}>Status</div>
                    <p style={{ color: "#cbd5e1", margin: "7px 0 0" }}>{clean(selectedRow?.status || selectedRow?.folder, "new")}</p>
                    <p style={{ color: "#aeb7c7", margin: "7px 0 0" }}>{subFor(selectedRow)}</p>
                  </div>

                  <div style={{ background: "#111827", border: "1px solid rgba(207,216,230,.14)", borderRadius: 18, padding: 14 }}>
                    <div style={{ color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontWeight: 950, fontSize: 11 }}>Attached Profile</div>
                    <p style={{ color: "#cbd5e1", margin: "7px 0 0" }}>{clean(selectedRow?.investorCompany || selectedRow?.company, "Company not listed")}</p>
                    <p style={{ color: "#aeb7c7", margin: "7px 0 0" }}>{clean(selectedRow?.investorName || selectedRow?.name)} {clean(selectedRow?.investorEmail || selectedRow?.email)} {clean(selectedRow?.phone)}</p>
                  </div>
                </div>

                <div style={{ background: "#111827", border: "1px solid rgba(207,216,230,.14)", borderRadius: 18, padding: 14, marginTop: 12 }}>
                  <div style={{ color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontWeight: 950, fontSize: 11 }}>Message</div>
                  <p style={{ color: "#cbd5e1", margin: "7px 0 0", lineHeight: 1.45 }}>{messageFor(selectedRow)}</p>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <button type="button" onClick={() => controlRow("saved", "Saved")} style={goldButton}>Save</button>
                  <button type="button" onClick={() => controlRow("archived", "Archived")} style={darkButton}>Archive</button>
                  <button type="button" onClick={() => controlRow("new", "Restored active")} style={darkButton}>Restore / Active</button>
                  <button type="button" onClick={() => controlRow("closed", "Closed")} style={darkButton}>Close Item</button>
                  <button type="button" onClick={() => controlRow("deleted", "Deleted")} style={redButton}>Delete</button>
                  {String(selectedRow?.status || selectedRow?.folder || "").toLowerCase().includes("deleted") ? (
                    <button
                      type="button"
                      onClick={() => {
                        deleteRowEverywhere(selectedRow);
                        setSelectedRow(null);
                        setNotice("Deleted forever.");
                        setTick((value) => value + 1);
                      }}
                      style={redButton}
                    >
                      Delete Forever
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 18,
              }}
            >
              {openAlert.rows.length ? (
                openAlert.rows.slice(0, 25).map((row, index) => (
                  <button
                    type="button"
                    key={`${openAlert.key}-${row?.id || row?.email || index}`}
                    onClick={() => {
                      setSelectedRow(row);
                      setNotice("");
                    }}
                    style={{
                      textAlign: "left",
                      color: "#f8fafc",
                      background: "#0b1020",
                      border: "1px solid rgba(207,216,230,.14)",
                      borderRadius: 20,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        color: "#ffd45a",
                        textTransform: "uppercase",
                        letterSpacing: 4,
                        fontWeight: 950,
                        fontSize: 11,
                        marginBottom: 8,
                      }}
                    >
                      {subFor(row)}
                    </div>

                    <h3
                      style={{
                        fontSize: 24,
                        margin: "0 0 8px",
                        fontWeight: 950,
                      }}
                    >
                      {titleFor(row)}
                    </h3>

                    <p style={{ color: "#aeb7c7", margin: 0, lineHeight: 1.4 }}>
                      {messageFor(row)}
                    </p>

                    {(row?.investorEmail || row?.email || row?.phone) ? (
                      <p style={{ color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 }}>
                        {clean(row?.investorName || row?.name)} {clean(row?.investorEmail || row?.email)} {clean(row?.phone)}
                      </p>
                    ) : null}

                    <p style={{ color: "#ffd45a", margin: "10px 0 0", fontWeight: 900 }}>
                      Tap to open cleanup controls.
                    </p>
                  </button>
                ))
              ) : (
                <div
                  style={{
                    background: "#0b1020",
                    border: "1px solid rgba(207,216,230,.14)",
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <p style={{ color: "#aeb7c7", margin: 0 }}>
                    No cards in this alert lane yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const darkButton: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "11px 14px",
  fontWeight: 950,
  cursor: "pointer",
};

const goldButton: React.CSSProperties = {
  ...darkButton,
  border: 0,
  background: "#ffdc68",
  color: "#10131a",
};

const redButton: React.CSSProperties = {
  ...darkButton,
  background: "#271016",
  borderColor: "rgba(255,70,70,.55)",
  color: "#ffb3b3",
};
