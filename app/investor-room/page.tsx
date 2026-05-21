"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

type TeaserKind = "Deal" | "Pain";

function readInvestor() {
  try {
    return JSON.parse(localStorage.getItem(INVESTOR_APP_KEY) || "{}");
  } catch {
    return {};
  }
}

function readRows(keys: string[]) {
  const rows: any[] = [];

  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");

      if (Array.isArray(parsed)) {
        rows.push(...parsed);
      } else if (parsed && typeof parsed === "object") {
        rows.push(...Object.values(parsed));
      }
    } catch {
      // ignore bad local data
    }
  }

  return rows;
}

function itemState(item: any) {
  return String(
    item?.state ||
      item?.propertyState ||
      item?.property_state ||
      item?.dealState ||
      item?.deal_state ||
      item?.painState ||
      item?.pain_state ||
      item?.marketState ||
      item?.market_state ||
      item?.locationState ||
      item?.location_state ||
      ""
  )
    .trim()
    .toUpperCase();
}

function saveRequest(kind: TeaserKind, item: any, message: string) {
  let rows: any[] = [];

  try {
    const parsed = JSON.parse(localStorage.getItem(INVESTOR_REQUESTS_KEY) || "[]");
    rows = Array.isArray(parsed) ? parsed : [];
  } catch {
    rows = [];
  }

  const investor = readInvestor();

  rows.unshift({
    id: `investor-request-${Date.now()}`,
    kind,
    itemId: item?.id || item?.roomId || item?.dealId || item?.painId || "",
    title: item?.title || item?.name || item?.headline || "Investor request",
    state: itemState(item),
    investorEmail: investor?.email || "",
    investorCompany: investor?.company || "",
    investorName: investor?.contactName || "",
    message,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  localStorage.setItem(INVESTOR_REQUESTS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("vaultforge-investor-request-change"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1320,
  margin: "0 auto",
  paddingBottom: 90,
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
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
  boxShadow: "0 0 26px rgba(245,197,66,.10)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 16,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 6,
  fontWeight: 950,
  fontSize: 13,
  marginBottom: 12,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,78px)",
  lineHeight: 0.9,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(28px,5vw,48px)",
  lineHeight: 0.96,
  letterSpacing: -2,
  margin: "0 0 14px",
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
  padding: "13px 18px",
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(207,216,230,.18)",
  background: "#111823",
  color: "#f8fafc",
  borderRadius: 16,
  padding: "14px 15px",
  fontSize: 16,
};

const field: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 14,
};

function TeaserCard({ kind, item }: { kind: TeaserKind; item: any }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const title = item?.title || item?.name || item?.headline || `${kind} Teaser`;
  const state = itemState(item) || "Not listed";
  const city = item?.city || item?.market || item?.area || "Market not listed";
  const asset = item?.assetType || item?.asset_type || item?.type || "Asset not listed";
  const price = item?.askingPrice || item?.asking_price || item?.price || item?.amount || "Not listed";
  const repairs = item?.repairs || item?.repairEstimate || item?.repair_estimate || "Not listed";
  const arv = item?.arv || item?.afterRepairValue || item?.after_repair_value || "Not listed";

  function send() {
    saveRequest(kind, item, message || "Investor requested more information.");
    setSent(true);
  }

  return (
    <div style={panel}>
      <div style={eyebrow}>
        {kind} • {state}
      </div>

      <h2 style={h2}>{title}</h2>

      <p style={sub}>
        {city} • {asset}
      </p>

      <div style={{ ...grid, marginTop: 14 }}>
        <div>
          <div style={eyebrow}>Asking / Need</div>
          <p style={muted}>{String(price)}</p>
        </div>

        <div>
          <div style={eyebrow}>Repairs</div>
          <p style={muted}>{String(repairs)}</p>
        </div>

        <div>
          <div style={eyebrow}>ARV / Value</div>
          <p style={muted}>{String(arv)}</p>
        </div>
      </div>

      <p style={{ ...muted, marginTop: 14 }}>
        Member information, seller information, exact private notes, and contact details are hidden until the
        member/admin approves deeper access.
      </p>

      <label style={field}>
        <span style={eyebrow}>Request Message</span>
        <textarea
          style={{ ...input, minHeight: 100 }}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="I am interested. Send more info..."
        />
      </label>

      <div style={{ ...row, marginTop: 12 }}>
        <button type="button" style={goldBtn} onClick={send}>
          Request More Info
        </button>
      </div>

      {sent ? <p style={muted}>Request sent through VaultForge.</p> : null}
    </div>
  );
}

export default function InvestorRoomPage() {
  const [investor, setInvestor] = useState<any>({});
  const [state, setState] = useState("GA");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setInvestor(readInvestor());
      setTick((value) => value + 1);
    };

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
    };
  }, []);

  const active = investor?.paymentStatus === "paid" || investor?.accessStatus === "active";

  const deals = useMemo(() => {
    return readRows([
      "vaultforge_clean_deal_rooms",
      "vaultforge_deal_rooms",
      "vaultforge_rooms_deals",
      "vf_deal_rooms",
    ]).filter((item) => itemState(item) === state);
  }, [state, tick]);

  const pains = useMemo(() => {
    return readRows([
      "vaultforge_clean_pain_rooms",
      "vaultforge_clean_pain_rooms_v1",
      "vaultforge_clean_pain_rooms_v2",
      "vaultforge_pain_rooms",
      "vaultforge_rooms_pain",
      "vf_pain_rooms",
    ]).filter((item) => itemState(item) === state);
  }, [state, tick]);

  if (!active) {
    return (
      <main style={page}>
        <div style={wrap}>
          <section style={hero}>
            <div style={eyebrow}>Investor Room Locked</div>

            <h1 style={h1}>Approval and payment required.</h1>

            <p style={sub}>
              Complete the investor application and payment before entering the investor visitor room.
            </p>

            <div style={{ ...row, marginTop: 18 }}>
              <Link href="/investor-application" style={goldBtn}>
                Investor Application
              </Link>

              <Link href="/investor-payment" style={btn}>
                Investor Payment
              </Link>

              <Link href="/investor-access" style={btn}>
                Investor Access
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Investor Visitor Room</div>

          <h1 style={h1}>Limited Deal/Pain access.</h1>

          <p style={sub}>
            Browse limited state teaser cards and request information through VaultForge. No private member data is exposed.
          </p>
        </section>

        <section style={goldPanel}>
          <div style={eyebrow}>States</div>

          <div style={row}>
            {STATES.map((stateCode) => (
              <button
                key={stateCode}
                type="button"
                style={stateCode === state ? goldBtn : btn}
                onClick={() => setState(stateCode)}
              >
                {stateCode}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div style={eyebrow}>Deal Cards • {state}</div>

          <div style={grid}>
            {deals.length ? (
              deals.map((item, index) => <TeaserCard key={`deal-${index}`} kind="Deal" item={item} />)
            ) : (
              <div style={panel}>
                <h2 style={h2}>No deal teasers yet.</h2>
                <p style={sub}>Approved Deal cards for this state will appear here.</p>
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <div style={eyebrow}>Pain Cards • {state}</div>

          <div style={grid}>
            {pains.length ? (
              pains.map((item, index) => <TeaserCard key={`pain-${index}`} kind="Pain" item={item} />)
            ) : (
              <div style={panel}>
                <h2 style={h2}>No pain teasers yet.</h2>
                <p style={sub}>Approved Pain cards for this state will appear here.</p>
              </div>
            )}
          </div>
        </section>

        <section style={{ ...hero, marginTop: 24 }}>
          <div style={eyebrow}>Network Capabilities</div>

          <p style={sub}>
            Funding, contractors, operators, title/closing, and execution support are available through the private
            member network after approval by members/admin.
          </p>
        </section>
      </div>
    </main>
  );
}
