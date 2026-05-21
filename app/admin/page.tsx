// ADMIN COMMAND FINAL POLISH BUILD
// Full replacement: app/admin/page.tsx
// Focus:
// - Investor intelligence profile support
// - Separate Deal/Pain request queues
// - Admin cleanup folders
// - Collapsible queues
// - Tightened Bloomberg-style admin layout

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QueueTab =
  | "overview"
  | "dealRequests"
  | "painRequests"
  | "investors"
  | "saved"
  | "archived"
  | "deleted";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1500,
  margin: "0 auto",
  paddingBottom: 120,
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 34,
  padding: 34,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.18), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16,
};

const wideGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
  gap: 18,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const panel: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 24,
  padding: 22,
};

const goldPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(245,197,66,.48)",
  boxShadow: "0 0 24px rgba(245,197,66,.08)",
};

const redPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(255,70,70,.48)",
  boxShadow: "0 0 24px rgba(255,70,70,.08)",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 6,
  fontWeight: 950,
  fontSize: 13,
  marginBottom: 10,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(46px,8vw,88px)",
  lineHeight: .88,
  letterSpacing: -4,
  margin: "0 0 16px",
  fontWeight: 950,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(28px,5vw,48px)",
  lineHeight: .95,
  letterSpacing: -2,
  margin: "0 0 12px",
  fontWeight: 950,
};

const h3: React.CSSProperties = {
  fontSize: 26,
  margin: "0 0 10px",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 20,
  lineHeight: 1.35,
  margin: 0,
};

const muted: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "8px 0 0",
  lineHeight: 1.4,
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  border: 0,
  background: "#ffdc68",
  color: "#10131a",
};

const redBtn: React.CSSProperties = {
  ...btn,
  background: "#271016",
  borderColor: "rgba(255,70,70,.48)",
  color: "#ffaaaa",
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function Metric({
  title,
  count,
  pulse,
  note,
}: {
  title: string;
  count: number;
  pulse?: boolean;
  note?: string;
}) {
  return (
    <div
      className={pulse ? "vf-pulse" : ""}
      style={pulse ? goldPanel : panel}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      {note ? <p style={muted}>{note}</p> : null}
    </div>
  );
}

function InvestorCard({ investor }: { investor: any }) {
  return (
    <div style={goldPanel}>
      <div style={eyebrow}>
        {investor.status || "pending"} • {investor.paymentStatus || "unpaid"}
      </div>

      <h3 style={h3}>
        {investor.company || "Investor Company"}
      </h3>

      <p style={sub}>
        {investor.contactName || "Unnamed Investor"}
      </p>

      <p style={muted}>{investor.email}</p>
      <p style={muted}>{investor.phone}</p>

      <div style={{ marginTop: 14 }}>
        <p style={muted}>
          Strategy: {investor.assetTypes || "Not listed"}
        </p>

        <p style={muted}>
          Markets: {investor.statesInterested || "Not listed"}
        </p>

        <p style={muted}>
          Volume: {investor.yearlyVolume || "Not listed"}
        </p>

        <p style={muted}>
          Buying Style: {investor.buyingStrategy || "Not listed"}
        </p>

        <p style={muted}>
          Close Speed: {investor.closeSpeed || "Not listed"}
        </p>

        <p style={muted}>
          Proof of Funds: {investor.proofFunds ? "Yes" : "Not listed"}
        </p>
      </div>

      <div style={{ ...row, marginTop: 16 }}>
        <button type="button" style={goldBtn}>
          Approve Investor
        </button>

        <button type="button" style={goldBtn}>
          Unlock Payment
        </button>

        <button type="button" style={btn}>
          Save
        </button>

        <button type="button" style={btn}>
          Archive
        </button>

        <button type="button" style={redBtn}>
          Delete
        </button>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  kind,
}: {
  request: any;
  kind: "Deal" | "Pain";
}) {
  return (
    <div style={kind === "Pain" ? redPanel : panel}>
      <div style={eyebrow}>
        {kind} Request • {request.state || "Unknown State"}
      </div>

      <h3 style={h3}>
        {request.title || `${kind} Room`}
      </h3>

      <p style={sub}>
        {request.investorCompany || request.investorName || "Investor"}
      </p>

      <p style={muted}>
        {request.message || "Investor requested more information."}
      </p>

      <div style={{ ...row, marginTop: 16 }}>
        <button type="button" style={goldBtn}>
          Open Room
        </button>

        <button type="button" style={goldBtn}>
          Approve Intro
        </button>

        <button type="button" style={btn}>
          Save
        </button>

        <button type="button" style={btn}>
          Archive
        </button>

        <button type="button" style={redBtn}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<QueueTab>("overview");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((v) => v + 1);

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    window.addEventListener("vaultforge-investor-request-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
      window.removeEventListener("vaultforge-investor-request-change", refresh);
    };
  }, []);

  const investors = useMemo(() => {
    return readJson<any[]>("vaultforge_investor_applications_v1", []);
  }, [tick]);

  const investorRequests = useMemo(() => {
    return readJson<any[]>("vaultforge_investor_requests_v1", []);
  }, [tick]);

  const dealRequests = useMemo(() => {
    return investorRequests.filter(
      (request) =>
        String(request.kind || "")
          .toLowerCase()
          .includes("deal")
    );
  }, [investorRequests]);

  const painRequests = useMemo(() => {
    return investorRequests.filter(
      (request) =>
        String(request.kind || "")
          .toLowerCase()
          .includes("pain")
    );
  }, [investorRequests]);

  return (
    <main style={page}>
      <style>{`
        .vf-pulse {
          animation: vfPulse 1.8s infinite;
        }

        @keyframes vfPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(255,220,104,.0); }
          50% { transform: scale(1.01); box-shadow: 0 0 28px rgba(255,220,104,.18); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,220,104,.0); }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Admin Command</div>

          <h1 style={h1}>
            Investor intelligence control.
          </h1>

          <p style={sub}>
            Private routing, investor approvals, deal/pain request queues,
            and execution oversight.
          </p>

          <div style={{ ...row, marginTop: 20 }}>
            <Link href="/" style={btn}>
              Home
            </Link>

            <Link href="/command" style={btn}>
              Member Command
            </Link>

            <Link href="/investor-room" style={btn}>
              Investor Room
            </Link>
          </div>
        </section>

        <section style={grid}>
          <Metric
            title="New Investors"
            count={investors.length}
            pulse={investors.length > 0}
            note="pending investor approvals"
          />

          <Metric
            title="Deal Requests"
            count={dealRequests.length}
            pulse={dealRequests.length > 0}
            note="investor deal interest"
          />

          <Metric
            title="Pain Requests"
            count={painRequests.length}
            pulse={painRequests.length > 0}
            note="investor pain interest"
          />

          <Metric
            title="Investor Messages"
            count={investorRequests.length}
            note="request more info threads"
          />

          <Metric
            title="Saved Queue"
            count={0}
            note="admin cleanup folder"
          />

          <Metric
            title="Archived Queue"
            count={0}
            note="admin archive folder"
          />
        </section>

        <section style={{ ...panel, marginTop: 22 }}>
          <div style={eyebrow}>Admin Queues</div>

          <div style={row}>
            <button type="button" style={tab === "overview" ? goldBtn : btn} onClick={() => setTab("overview")}>
              Overview
            </button>

            <button type="button" style={tab === "investors" ? goldBtn : btn} onClick={() => setTab("investors")}>
              Investors
            </button>

            <button type="button" style={tab === "dealRequests" ? goldBtn : btn} onClick={() => setTab("dealRequests")}>
              Deal Requests
            </button>

            <button type="button" style={tab === "painRequests" ? goldBtn : btn} onClick={() => setTab("painRequests")}>
              Pain Requests
            </button>

            <button type="button" style={tab === "saved" ? goldBtn : btn} onClick={() => setTab("saved")}>
              Saved
            </button>

            <button type="button" style={tab === "archived" ? goldBtn : btn} onClick={() => setTab("archived")}>
              Archived
            </button>

            <button type="button" style={tab === "deleted" ? goldBtn : btn} onClick={() => setTab("deleted")}>
              Deleted
            </button>
          </div>
        </section>

        {tab === "overview" ? (
          <section style={{ marginTop: 22 }}>
            <div style={wideGrid}>
              <div style={goldPanel}>
                <div style={eyebrow}>Investor Access Lane</div>

                <h3 style={h3}>
                  Separate buyer-intelligence network.
                </h3>

                <p style={muted}>
                  Investors see teaser Deal/Pain cards only.
                </p>

                <p style={muted}>
                  No member directory or private routing access.
                </p>
              </div>

              <div style={panel}>
                <div style={eyebrow}>Routing Intelligence</div>

                <h3 style={h3}>
                  Profile depth improves signal quality.
                </h3>

                <p style={muted}>
                  Investor routing uses:
                </p>

                <ul style={{ color: "#c9d0dc", lineHeight: 1.7 }}>
                  <li>buy box</li>
                  <li>markets</li>
                  <li>volume</li>
                  <li>strategy</li>
                  <li>close speed</li>
                  <li>proof of funds</li>
                  <li>deal size</li>
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "investors" ? (
          <section style={{ marginTop: 22 }}>
            <div style={eyebrow}>Investor Queue</div>

            {investors.length ? (
              <div style={wideGrid}>
                {investors.map((investor, index) => (
                  <InvestorCard key={`investor-${index}`} investor={investor} />
                ))}
              </div>
            ) : (
              <div style={panel}>
                <h3 style={h3}>No investor applications yet.</h3>
              </div>
            )}
          </section>
        ) : null}

        {tab === "dealRequests" ? (
          <section style={{ marginTop: 22 }}>
            <div style={eyebrow}>Deal Request Queue</div>

            {dealRequests.length ? (
              <div style={wideGrid}>
                {dealRequests.map((request, index) => (
                  <RequestCard
                    key={`deal-request-${index}`}
                    request={request}
                    kind="Deal"
                  />
                ))}
              </div>
            ) : (
              <div style={panel}>
                <h3 style={h3}>No deal requests yet.</h3>
              </div>
            )}
          </section>
        ) : null}

        {tab === "painRequests" ? (
          <section style={{ marginTop: 22 }}>
            <div style={eyebrow}>Pain Request Queue</div>

            {painRequests.length ? (
              <div style={wideGrid}>
                {painRequests.map((request, index) => (
                  <RequestCard
                    key={`pain-request-${index}`}
                    request={request}
                    kind="Pain"
                  />
                ))}
              </div>
            ) : (
              <div style={panel}>
                <h3 style={h3}>No pain requests yet.</h3>
              </div>
            )}
          </section>
        ) : null}

        {tab === "saved" ? (
          <section style={{ marginTop: 22 }}>
            <div style={panel}>
              <div style={eyebrow}>Saved Queue</div>
              <h3 style={h3}>Admin save folder.</h3>
              <p style={muted}>
                Saved investors, requests, and rooms will appear here.
              </p>
            </div>
          </section>
        ) : null}

        {tab === "archived" ? (
          <section style={{ marginTop: 22 }}>
            <div style={panel}>
              <div style={eyebrow}>Archived Queue</div>
              <h3 style={h3}>Admin archive folder.</h3>
              <p style={muted}>
                Archived rooms and investor requests will appear here.
              </p>
            </div>
          </section>
        ) : null}

        {tab === "deleted" ? (
          <section style={{ marginTop: 22 }}>
            <div style={redPanel}>
              <div style={eyebrow}>Deleted Queue</div>
              <h3 style={h3}>Delete forever control layer.</h3>
              <p style={muted}>
                Admin-only destructive cleanup queue.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
