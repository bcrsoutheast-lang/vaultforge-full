"use client";

import React, { useState } from "react";

type AnyRoom = {
  id?: string;
  roomId?: string;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  assetClass?: string;
  propertyType?: string;
  strategy?: string[] | string;
  routeTo?: string[] | string;
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  blockers?: string[] | string;
  risks?: string[] | string;
  riskTypes?: string[] | string;
  severity?: string;
  timePressure?: string;
  timeline?: string;
  capitalPressure?: string;
  controlStatus?: string;
  currentStatus?: string;
  ownerSituation?: string;
  accessStatus?: string;
  titleStatus?: string;
  permitStatus?: string;
  insuranceStatus?: string;
  legalStatus?: string;
  askingPrice?: string;
  askPrice?: string;
  propertyValue?: string;
  value?: string;
  repairs?: string;
  monthlyBurn?: string;
  monthlyBurnRate?: string;
  moneyNeededNow?: string;
  deadline?: string;
  rootCause?: string;
  bestOutcome?: string;
  worstCase?: string;
  desiredSolution?: string;
  condition?: string;
  occupancy?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  noi?: string;
  capRate?: string;
  acres?: string;
  zoning?: string;
  roadFrontage?: string;
  utilities?: string;
  entitlementStatus?: string;
  [key: string]: unknown;
};

type RoomKind = "deal" | "pain";

function txt(value: unknown, fallback = "Not listed") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function empty(value: unknown) {
  return !String(value || "").trim();
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function num(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  if (!value) return "Not listed";
  return "$" + Math.round(value).toLocaleString();
}

function pct(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function assetLane(room: AnyRoom) {
  const asset = txt(room.assetClass, "").toLowerCase();
  const type = txt(room.propertyType, "").toLowerCase();
  if (asset.includes("land") || type.includes("land") || type.includes("lot") || type.includes("acre")) return "land";
  if (
    asset.includes("commercial") ||
    ["retail", "office", "industrial", "warehouse", "hotel", "self storage", "mixed use", "medical", "restaurant"].some((term) =>
      type.includes(term)
    )
  ) {
    return "commercial";
  }
  return "residential";
}

function yes(value: unknown) {
  return !empty(value) && txt(value, "").toLowerCase() !== "unknown";
}

function roomFieldSnapshot(kind: RoomKind, room: AnyRoom): [string, string][] {
  if (kind === "pain") {
    return [
      ["Problem Type", list(room.painTypes).join(", ") || "Unclassified"],
      ["Severity", txt(room.severity, "Not scored")],
      ["Time Pressure", txt(room.timePressure || room.timeline)],
      ["Solver Needed", list(room.needs || room.routingNeeds).join(", ") || "Not routed"],
      ["Capital Pressure", txt(room.capitalPressure)],
      ["Primary Blocker", list(room.blockers).join(", ") || txt(room.rootCause)],
    ];
  }

  const lane = assetLane(room);

  if (lane === "commercial") {
    return [
      ["Asset", "Commercial"],
      ["Use", txt(room.propertyType)],
      ["Units", txt(room.units)],
      ["NOI", txt(room.noi)],
      ["Cap Rate", txt(room.capRate)],
      ["Occupancy", txt(room.occupancy)],
    ];
  }

  if (lane === "land") {
    return [
      ["Asset", "Land"],
      ["Type", txt(room.propertyType)],
      ["Acres", txt(room.acres)],
      ["Zoning", txt(room.zoning)],
      ["Utilities", txt(room.utilities)],
      ["Entitlement", txt(room.entitlementStatus)],
    ];
  }

  return [
    ["Asset", txt(room.assetClass, "Residential")],
    ["Type", txt(room.propertyType)],
    ["Beds", txt(room.beds)],
    ["Baths", txt(room.baths)],
    ["Sqft", txt(room.sqft)],
    ["Occupancy", txt(room.occupancy)],
  ];
}

function dealAnalysis(room: AnyRoom) {
  const ask = num(room.askingPrice || room.askPrice);
  const value = num(room.propertyValue || room.value);
  const repairs = num(room.repairs);
  const noi = num(room.noi);
  const capRate = num(room.capRate);
  const spread = value && ask ? value - ask - repairs : 0;
  const equity = value && ask ? ((value - ask) / value) * 100 : 0;
  const lane = assetLane(room);

  const missing = [
    ["asking price", ask],
    ["ARV/value", value],
    ["repair budget", repairs],
    ["control status", room.controlStatus],
    ["access status", room.accessStatus],
    ["title status", room.titleStatus],
  ]
    .filter(([, v]) => !v || txt(v, "") === "Unknown")
    .map(([label]) => String(label));

  let opportunity = 35;
  if (spread > 25000) opportunity += 10;
  if (spread > 75000) opportunity += 18;
  if (spread > 150000) opportunity += 12;
  if (equity > 20) opportunity += 8;
  if (list(room.strategy).length) opportunity += 6;
  if (list(room.routeTo).length) opportunity += 6;
  if (txt(room.controlStatus, "").toLowerCase().includes("controlled")) opportunity += 10;
  if (lane === "commercial" && noi && capRate) opportunity += 8;
  if (lane === "land" && yes(room.zoning) && yes(room.utilities)) opportunity += 8;
  opportunity -= Math.min(20, missing.length * 3);
  opportunity = Math.max(0, Math.min(100, opportunity));

  let risk = 30;
  if (!ask || !value) risk += 18;
  if (txt(room.controlStatus, "").toLowerCase().includes("no")) risk += 18;
  if (txt(room.titleStatus, "").toLowerCase().includes("problem")) risk += 18;
  if (txt(room.condition, "").toLowerCase().includes("fire")) risk += 16;
  if (txt(room.condition, "").toLowerCase().includes("full")) risk += 12;
  if (txt(room.occupancy, "").toLowerCase().includes("squatter")) risk += 18;
  if (lane === "land" && !yes(room.entitlementStatus)) risk += 12;
  if (lane === "commercial" && !noi) risk += 10;
  risk = Math.max(0, Math.min(100, risk));

  const closeProbability = Math.max(
    5,
    Math.min(95, opportunity - risk * 0.35 + (txt(room.controlStatus, "").toLowerCase().includes("controlled") ? 15 : 0))
  );
  const liquidity = lane === "residential" ? 74 : lane === "commercial" ? 58 : 46;

  return {
    lane,
    ask,
    value,
    repairs,
    spread,
    equity,
    opportunity,
    risk,
    closeProbability,
    liquidity,
    missing,
    primaryConstraint:
      !ask || !value
        ? "Underwriting data is incomplete. Buyer confidence will stay weak until ask, value, repairs, access, and proof are complete."
        : txt(room.controlStatus, "").toLowerCase().includes("no")
        ? "Control is the binding constraint. Do not over-route until authority, contract position, or decision rights are secured."
        : risk >= 70
        ? "Risk concentration is high. Split legal/title, access, construction, and capital risk before buyer exposure."
        : "Execution sequencing is the current constraint. Verify control, route the correct counterparty, and compress decision time.",
    nextMove:
      lane === "commercial"
        ? "Build the commercial snapshot: NOI, rent roll, occupancy, debt pressure, tenant risk, cap-rate logic, and reposition thesis. Route to capital/operator fit."
        : lane === "land"
        ? "Confirm zoning, utilities, access, entitlement path, road frontage, and highest/best use. Route to developer or land buyer only after entitlement risk is explicit."
        : "Verify ask, ARV, repair scope, occupancy, control, access, and title. Route by strategy fit, not by generic state match.",
    hiddenUpside:
      spread > 75000
        ? "Spread may support multiple exits: wholesale fee, flip margin, JV structure, private capital participation, or buy-and-hold recap."
        : lane === "land"
        ? "Hidden upside likely sits in entitlement, assemblage, utility access, or highest/best-use change."
        : lane === "commercial"
        ? "Hidden upside may sit in rent reset, vacancy absorption, operator replacement, use conversion, or seller financing."
        : "Hidden upside depends on cleaner proof, seller motivation, financing structure, and faster execution path.",
    killShot: missing.length
      ? `Missing proof creates friction: ${missing.join(", ")}. Resolve these before pushing the room hard.`
      : risk >= 70
      ? "Main deal killer is unresolved risk stacking faster than buyer confidence."
      : "No fatal deal killer detected yet. Continue diligence and route with a clear decision deadline.",
    decisionTree: [
      "If control is weak: secure authority before mass routing.",
      "If numbers are weak: complete ask/value/repair proof before buyer blast.",
      "If spread is real: route buyer plus capital stack simultaneously.",
      "If risk is legal/title/access: route specialist before operator.",
    ],
  };
}

function painAnalysis(room: AnyRoom) {
  let severity = 35;
  const sev = txt(room.severity, "").toLowerCase();
  if (sev.includes("medium")) severity += 10;
  if (sev.includes("high")) severity += 25;
  if (sev.includes("critical")) severity += 38;
  if (sev.includes("emergency")) severity += 48;

  const time = txt(room.timePressure || room.timeline, "").toLowerCase();
  if (time.includes("24")) severity += 18;
  if (time.includes("72")) severity += 14;
  if (time.includes("7")) severity += 8;

  const blockers = list(room.blockers);
  const risks = list(room.risks || room.riskTypes);
  if (blockers.some((b) => ["Capital", "Title", "Legal", "Permit", "City"].includes(b))) severity += 12;
  severity = Math.max(0, Math.min(100, severity));

  const collapseRisk = Math.max(10, Math.min(100, severity + blockers.length * 5 + risks.length * 4));
  const detectionGap = Math.max(10, Math.min(100, 60 - (yes(room.rootCause) ? 16 : 0) - (blockers.length ? 10 : 0) - (yes(room.desiredSolution) ? 8 : 0)));
  const solverClarity = Math.max(10, Math.min(100, 45 + list(room.needs || room.routingNeeds).length * 12 + (blockers.length ? 10 : 0) - detectionGap * 0.25));
  const rpn = Math.round((severity / 10) * (collapseRisk / 10) * (Math.max(10, detectionGap) / 10));

  const root = yes(room.rootCause)
    ? txt(room.rootCause)
    : blockers.includes("Capital")
    ? "Likely liquidity timing mismatch or incomplete capital stack."
    : blockers.includes("Title")
    ? "Likely title/legal clearance failure."
    : blockers.includes("Contractor")
    ? "Likely vendor dependency and scope-control failure."
    : blockers.includes("Permit") || blockers.includes("City")
    ? "Likely municipal sequencing, permit, or compliance bottleneck."
    : "Root cause is not fully isolated. Start with constraint mapping before spending more time or money.";

  const corrective = blockers.includes("Capital")
    ? "Quantify exact cash gap, deadline, collateral, payoff path, and repayment source. Route to lender/private capital only after use-of-funds is precise."
    : blockers.includes("Title")
    ? "Pull title facts, identify curative issue, assign legal/title owner, and create a date-certain clearance path."
    : blockers.includes("Contractor")
    ? "Freeze scope, separate must-do from nice-to-do, verify remaining budget, and remove single-point contractor dependency."
    : blockers.includes("Permit") || blockers.includes("City")
    ? "Map required approvals, missing documents, responsible party, and inspection sequence. Route to permit expeditor or local operator."
    : "Define blocker, owner, due date, decision maker, money required, and failure consequence. Then route the correct solver.";

  return { severity, collapseRisk, detectionGap, solverClarity, rpn, root, corrective };
}

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 20 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.55)", boxShadow: "0 0 26px rgba(255,220,104,.14)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.58)", boxShadow: "0 0 26px rgba(255,70,70,.12)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 10 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 12px", fontWeight: 950, color: "#f7f7fb" };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.38, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };

function Meter({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  const clean = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={eyebrow}>{label}</div>
        <strong>{clean}%</strong>
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: "hidden", background: "#05070d", border: "1px solid rgba(207,216,230,.12)" }}>
        <div style={{ width: `${clean}%`, height: "100%", background: danger ? "#ff4b5c" : "#ffdc68" }} />
      </div>
    </div>
  );
}

function SnapshotGrid({ items }: { items: [string, string][] }) {
  return (
    <div style={grid}>
      {items.map(([label, value]) => (
        <div key={label} style={panel}>
          <div style={eyebrow}>{label}</div>
          <p style={sub}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function IntelligenceSection({
  title,
  badge,
  danger,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: string;
  danger?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      style={{
        background: "linear-gradient(180deg,#0a0f1c,#050816)",
        border: `1px solid ${danger ? "rgba(255,70,70,.35)" : "rgba(255,220,104,.24)"}`,
        borderRadius: 24,
        marginBottom: 18,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#f7f7fb",
        }}
      >
        <div>
          <div style={eyebrow}>{badge || "VAULTFORGE SECTION"}</div>
          <div style={{ fontSize: 24, fontWeight: 900, textAlign: "left" }}>{title}</div>
        </div>
        <div
          style={{
            border: `1px solid ${danger ? "rgba(255,70,70,.35)" : "rgba(255,220,104,.24)"}`,
            borderRadius: 999,
            padding: "8px 14px",
            color: danger ? "#ff8080" : "#ffd45a",
            fontWeight: 800,
          }}
        >
          {open ? "Collapse" : "Expand"}
        </div>
      </button>

      {open ? <div style={{ padding: "0 20px 20px" }}>{children}</div> : null}
    </section>
  );
}

function DiagnosticQA({ question, answer, action }: { question: string; answer: string; action: string }) {
  return (
    <div style={{ borderTop: "1px solid rgba(207,216,230,.12)", paddingTop: 12, marginTop: 12 }}>
      <div style={{ ...eyebrow, marginBottom: 6 }}>Question</div>
      <p style={muted}>{question}</p>
      <div style={{ ...eyebrow, marginBottom: 6, marginTop: 10 }}>VaultForge Analysis</div>
      <p style={sub}>{answer}</p>
      <div style={{ ...eyebrow, marginBottom: 6, marginTop: 10 }}>Action</div>
      <p style={muted}>{action}</p>
    </div>
  );
}

function DiagnosticList({ title, items }: { title: string; items: { question: string; answer: string; action: string }[] }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{title}</div>
      {items.map((item) => (
        <DiagnosticQA key={item.question} question={item.question} answer={item.answer} action={item.action} />
      ))}
    </div>
  );
}

function painFiveWhyAnswers(room: AnyRoom, ai: ReturnType<typeof painAnalysis>) {
  const blockers = list(room.blockers);
  const needs = list(room.needs || room.routingNeeds);
  return [
    {
      question: "What is stopping execution right now?",
      answer: blockers.length ? `${blockers.join(", ")} is the current constraint stack.` : ai.root,
      action: "Assign one owner to the top blocker and request documents, dollar amount, deadline, decision maker, and required approval.",
    },
    {
      question: "Why has that blocker not been removed?",
      answer: ai.detectionGap >= 50 ? "The detection gap is high. Facts are not clean enough to separate cause from symptom." : "Facts are strong enough to move from diagnosis to solver routing.",
      action: ai.detectionGap >= 50 ? "Collect missing facts before routing broadly." : "Route to the highest-fit solver and set a response deadline.",
    },
    {
      question: "Which party owns the next decision?",
      answer: txt(room.ownerSituation, "Decision ownership is not fully mapped."),
      action: "Name the decision owner, backup owner, and approval path.",
    },
    {
      question: "What resource is missing?",
      answer: needs.length ? `The room is asking for ${needs.join(", ")}.` : "The missing resource is not clearly classified.",
      action: needs.length ? "Route by exact need." : "Force-select the missing resource before routing.",
    },
    {
      question: "What happens if no action occurs inside the decision window?",
      answer: txt(room.worstCase, "Pressure compounds: cost increases, leverage weakens, options narrow, and the room can become distressed."),
      action: "Set the room to escalation watch if no response occurs inside the time pressure window.",
    },
  ];
}

function painFishboneAnswers(room: AnyRoom) {
  return [
    { question: "People", answer: txt(room.ownerSituation, "Stakeholder alignment is not mapped."), action: "Identify owner, decision maker, payer, operator, and blocking party." },
    { question: "Process", answer: list(room.blockers).length ? `Breakdown is tied to ${list(room.blockers).join(", ")}.` : "The process failure is not classified.", action: "Convert blocker into a checklist with owner and deadline." },
    { question: "Capital", answer: txt(room.capitalPressure || room.moneyNeededNow, "Capital pressure is not quantified."), action: "Document amount, timing, collateral, use of funds, and repayment/exit path." },
    { question: "Legal / Compliance", answer: txt(room.titleStatus || room.permitStatus || room.legalStatus, "Legal/title/permit/compliance exposure is not listed."), action: "Separate legal/title risk from operational risk." },
    { question: "Asset Condition", answer: txt(room.condition, "Physical condition is not listed."), action: "Add photos, scope category, safety issues, and repair owner." },
    { question: "Time", answer: txt(room.timePressure || room.deadline, "No deadline listed."), action: "Add a real decision deadline and escalation threshold." },
  ];
}

function painControlPlanAnswers(room: AnyRoom, ai: ReturnType<typeof painAnalysis>) {
  return [
    { question: "Sort", answer: "Separate symptoms from the one constraint that actually stops progress.", action: `Primary constraint: ${ai.root}` },
    { question: "Set In Order", answer: "Put the fix sequence in the order that reduces risk fastest.", action: ai.corrective },
    { question: "Shine", answer: "Clean the room data so members do not waste time interpreting incomplete facts.", action: "Add missing documents, photos, amounts, dates, authority, and contact path." },
    { question: "Standardize", answer: "Make the response path repeatable.", action: "Use blocker-owner-deadline-solver format on every pain room." },
    { question: "Sustain", answer: "Keep the room from going stale after the first message.", action: "Create 24/72-hour follow-up checks until blocker is removed or archived/resolved." },
  ];
}

function dealFiveWhyAnswers(room: AnyRoom, ai: ReturnType<typeof dealAnalysis>) {
  return [
    {
      question: "Is this executable or only attractive on the surface?",
      answer: ai.closeProbability >= 70 ? "Execution probability is strong." : ai.closeProbability >= 45 ? "The deal needs proof cleanup before it should be pushed hard." : "This behaves more like a prospect than an executable deal.",
      action: ai.closeProbability >= 70 ? "Route to the highest-fit buyer/capital/operator with a deadline." : "Close proof gaps before broad routing.",
    },
    {
      question: "What kills this deal first?",
      answer: ai.missing.length ? `Missing proof: ${ai.missing.join(", ")}.` : ai.risk >= 70 ? "Risk stacking can collapse confidence." : "Execution delay is likely the first killer.",
      action: ai.missing.length ? "Collect missing proof." : "Name owners for title, access, scope, capital, operator, and buyer.",
    },
    {
      question: "What would an institutional operator notice immediately?",
      answer: ai.lane === "commercial" ? "NOI quality, occupancy, tenant rollover, debt pressure, and cap-rate logic." : ai.lane === "land" ? "Zoning, utilities, access, entitlement path, road frontage, and highest/best use." : "Control, ARV proof, rehab scope, occupancy/access, title clarity, and timeline.",
      action: ai.lane === "commercial" ? "Add NOI, occupancy, rent roll, tenant risk, cap rate, and debt/reposition notes." : ai.lane === "land" ? "Add zoning, utilities, entitlement, frontage, acreage, and development path." : "Add beds, baths, sqft, occupancy, access, rehab, ARV, ask, title/control.",
    },
    {
      question: "Where is margin most likely to compress?",
      answer: ai.spread <= 0 ? "Margin is not proven." : ai.risk >= 65 ? "Margin can compress through repair creep, title/access delay, buyer discounting, financing friction, or timeline drag." : "Margin appears workable but still depends on scope, liquidity, and exit value.",
      action: "Stress-test repairs, holding cost, buyer discount, lender fees, and timeline delay.",
    },
    {
      question: "What resource is truly missing?",
      answer: ai.primaryConstraint,
      action: "Route the missing resource directly: buyer, lender, operator, attorney/title, contractor, or developer.",
    },
  ];
}

function dealExecutionAnswers(room: AnyRoom, ai: ReturnType<typeof dealAnalysis>) {
  return [
    { question: "Capital Stack Stress", answer: ai.spread > 75000 ? "Spread may support multiple capital structures." : "Capital stack is fragile because spread is thin or unproven.", action: "Show ask, value, repairs, collateral, payoff path, and exit." },
    { question: "Timeline Compression", answer: txt(room.timeline || room.timePressure, "").includes("24") || txt(room.timeline || room.timePressure, "").includes("72") ? "Timeline pressure is severe." : "Timeline pressure is manageable if proof and routing tighten now.", action: "Set decision deadline and route correct counterparty." },
    { question: "Lender Rejection Risk", answer: empty(room.propertyValue || room.value) || empty(room.askingPrice || room.askPrice) ? "Collateral value and purchase basis are incomplete." : empty(room.controlStatus) || txt(room.controlStatus, "").toLowerCase().includes("no") ? "Control/authority is unclear." : "Lender risk is moderate.", action: "Package value, basis, repairs, title/control, exit, operator, and timeline." },
    { question: "Operator Choke Point", answer: ai.lane === "residential" ? "Rehab scope, access, contractor reliability, and exit buyer confidence." : ai.lane === "commercial" ? "NOI verification, tenant risk, vacancy absorption, and reposition plan." : "Entitlement, utilities, access, zoning, and development feasibility.", action: "Route to an operator who solves that specific choke point." },
    { question: "Route Recommendation", answer: list(room.routeTo).length ? `Selected route: ${list(room.routeTo).join(", ")}.` : "No route lane selected.", action: list(room.routeTo).length ? "Send to highest-fit member first." : "Select route lane before sending messages." },
  ];
}

function dealExitScenarioAnswers(room: AnyRoom, ai: ReturnType<typeof dealAnalysis>) {
  return [
    { question: "Best Case", answer: ai.opportunity >= 70 ? "Control and proof hold, buyer/capital responds, and the deal converts." : "Best case requires proof cleanup first.", action: "Move only after proof survives scrutiny." },
    { question: "Base Case", answer: ai.closeProbability >= 50 ? "The deal progresses if the current constraint is removed and routing is targeted." : "The deal stalls until facts/control improve.", action: "Work the primary constraint before adding audience." },
    { question: "Worst Case", answer: ai.killShot, action: "Treat the deal killer as the first work order." },
    { question: "VaultForge Edge", answer: "The advantage is diagnosing what must be fixed, who should fix it, and what proof is needed before capital or buyers engage.", action: "Keep the room intelligence-first: proof, constraint, route, response, execution." },
  ];
}

export function RoomFrontIntelligence({ kind, room }: { kind: RoomKind; room: AnyRoom }) {
  if (kind === "pain") {
    const ai = painAnalysis(room);
    return (
      <div style={{ marginTop: 16 }}>
        <SnapshotGrid items={roomFieldSnapshot(kind, room)} />
        <div style={{ ...redPanel, marginTop: 14 }}>
          <div style={eyebrow}>VaultForge Pressure Read</div>
          <p style={sub}>{ai.root}</p>
          <Meter label="Collapse Risk" value={ai.collapseRisk} danger />
          <p style={muted}>Next move: {ai.corrective}</p>
        </div>
      </div>
    );
  }

  const ai = dealAnalysis(room);
  return (
    <div style={{ marginTop: 16 }}>
      <SnapshotGrid items={roomFieldSnapshot(kind, room)} />
      <div
        style={{
          ...goldPanel,
          marginTop: 14,
          background: "linear-gradient(180deg,#18150d,#0b0f18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={eyebrow}>VaultForge Underwriting</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#f7f7fb" }}>
              {pct(ai.closeProbability)} Execution
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,220,104,.4)",
              borderRadius: 999,
              padding: "8px 14px",
              color: "#ffd45a",
              fontWeight: 900,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Institutional Review
          </div>
        </div>

        <div style={{ ...grid, marginTop: 14 }}>
          <div style={panel}>
            <div style={eyebrow}>Opportunity</div>
            <div style={{ fontSize: 34, fontWeight: 900 }}>{pct(ai.opportunity)}</div>
          </div>

          <div style={panel}>
            <div style={eyebrow}>Risk</div>
            <div style={{ fontSize: 34, fontWeight: 900 }}>{pct(ai.risk)}</div>
          </div>

          <div style={panel}>
            <div style={eyebrow}>Spread</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{money(ai.spread)}</div>
          </div>

          <div style={panel}>
            <div style={eyebrow}>Liquidity</div>
            <div style={{ fontSize: 34, fontWeight: 900 }}>{pct(ai.liquidity)}</div>
          </div>
        </div>

        <p style={{ ...muted, marginTop: 16 }}>
          {ai.primaryConstraint}
        </p>
      </div>
    </div>
  );
}

export function RoomInsideIntelligence({ kind, room }: { kind: RoomKind; room: AnyRoom }) {
  if (kind === "pain") {
    const ai = painAnalysis(room);
    return (
      <IntelligenceSection title="VaultForge Execution Command Desk" badge="Critical Pressure" danger>
        <div style={{ ...redPanel, marginBottom: 18 }}>
          <div style={eyebrow}>VaultForge Strategic Read</div>
          <p style={sub}>{ai.root} Collapse risk is currently {pct(ai.collapseRisk)} and the room should route based on blocker severity, not broad exposure.</p>
        </div>

        <div style={grid}>
          <div style={redPanel}><div style={eyebrow}>Severity</div><h2 style={h2}>{pct(ai.severity)}</h2><p style={muted}>Operational pressure index.</p></div>
          <div style={redPanel}><div style={eyebrow}>FMEA RPN</div><h2 style={h2}>{ai.rpn}</h2><p style={muted}>Severity × collapse × detection gap.</p></div>
          <div style={panel}><div style={eyebrow}>Solver Clarity</div><h2 style={h2}>{pct(ai.solverClarity)}</h2><p style={muted}>How clear the routing lane is.</p></div>
          <div style={panel}><div style={eyebrow}>Detection Gap</div><h2 style={h2}>{pct(ai.detectionGap)}</h2><p style={muted}>How much critical info is still missing.</p></div>
        </div>

        <div style={{ ...grid, marginTop: 16 }}>
          <div style={panel}><div style={eyebrow}>Root Cause</div><p style={sub}>{ai.root}</p></div>
          <div style={panel}><div style={eyebrow}>Corrective Action</div><p style={sub}>{ai.corrective}</p></div>
          <div style={panel}><div style={eyebrow}>If Nothing Happens</div><p style={sub}>{txt(room.worstCase, "Cost increases, leverage weakens, timeline compresses, and resolution options shrink.")}</p></div>
          <div style={panel}><div style={eyebrow}>Target Outcome</div><p style={sub}>{txt(room.bestOutcome || room.desiredSolution, "Blocker removed, owner stabilized, capital/solver assigned, and room moved to resolved.")}</p></div>
        </div>

        <div style={{ ...grid, marginTop: 16 }}>
          <DiagnosticList title="5 Whys / VaultForge Analysis" items={painFiveWhyAnswers(room, ai)} />
          <DiagnosticList title="Fishbone / Ishikawa Answers" items={painFishboneAnswers(room)} />
          <DiagnosticList title="5S / Control Plan Answers" items={painControlPlanAnswers(room, ai)} />
        </div>
      </IntelligenceSection>
    );
  }

  const ai = dealAnalysis(room);
  return (
    <IntelligenceSection title="Institutional Deal Intelligence Desk" badge="Execution Intelligence">
      <div style={{ ...goldPanel, marginBottom: 18 }}>
        <div style={eyebrow}>VaultForge Strategic Read</div>
        <p style={sub}>{ai.primaryConstraint} Execution probability is currently {pct(ai.closeProbability)} with liquidity pressure at {pct(ai.liquidity)}.</p>
      </div>

      <div style={grid}>
        <div style={goldPanel}><div style={eyebrow}>Opportunity</div><h2 style={h2}>{pct(ai.opportunity)}</h2><p style={muted}>Margin, control, proof, and route readiness.</p></div>
        <div style={redPanel}><div style={eyebrow}>Risk</div><h2 style={h2}>{pct(ai.risk)}</h2><p style={muted}>Title, control, condition, access, and data gaps.</p></div>
        <div style={panel}><div style={eyebrow}>Close Probability</div><h2 style={h2}>{pct(ai.closeProbability)}</h2><p style={muted}>Probability of executable path, not just deal attractiveness.</p></div>
        <div style={panel}><div style={eyebrow}>Liquidity</div><h2 style={h2}>{pct(ai.liquidity)}</h2><p style={muted}>Estimated marketability by asset lane.</p></div>
      </div>

      <div style={{ ...grid, marginTop: 16 }}>
        <div style={panel}><div style={eyebrow}>Field Snapshot</div><SnapshotGrid items={roomFieldSnapshot(kind, room)} /></div>
        <div style={panel}><div style={eyebrow}>Primary Constraint</div><p style={sub}>{ai.primaryConstraint}</p></div>
        <div style={panel}><div style={eyebrow}>Best Next Move</div><p style={sub}>{ai.nextMove}</p></div>
        <div style={panel}><div style={eyebrow}>Hidden Upside</div><p style={sub}>{ai.hiddenUpside}</p></div>
        <div style={panel}><div style={eyebrow}>Deal Killer</div><p style={sub}>{ai.killShot}</p></div>
        <div style={panel}>{ai.decisionTree.map((item) => <p key={item} style={muted}>• {item}</p>)}</div>
      </div>

      <div style={{ ...grid, marginTop: 16 }}>
        <DiagnosticList title="Deal 5 Whys / VaultForge Analysis" items={dealFiveWhyAnswers(room, ai)} />
        <DiagnosticList title="Execution Failure Analysis" items={dealExecutionAnswers(room, ai)} />
        <DiagnosticList title="Exit Scenario Analysis" items={dealExitScenarioAnswers(room, ai)} />

        <div style={panel}>
          <div style={eyebrow}>Institutional View</div>
          <DiagnosticQA question="What does a lender see?" answer={ai.missing.length ? `The room still lacks critical underwriting proof: ${ai.missing.join(", ")}.` : "The room has enough structure to begin serious underwriting review."} action="Package collateral value, purchase basis, repairs, title/control, exit strategy, operator, and timeline." />
          <DiagnosticQA question="What does an operator see?" answer={ai.primaryConstraint} action="Assign the next operator based on the specific choke point, not just geography." />
          <DiagnosticQA question="Why does this die in underwriting?" answer={ai.killShot} action="Treat the deal killer as the first work order." />
          <DiagnosticQA question="Recommended team" answer={ai.lane === "commercial" ? "Commercial lender • operator • tenant strategist • attorney" : ai.lane === "land" ? "Developer • zoning specialist • civil engineer • land capital" : "Buyer • lender • contractor • title/closing specialist"} action="Invite the smallest team that can remove the current constraint." />
        </div>
      </div>
    </IntelligenceSection>
  );
}
