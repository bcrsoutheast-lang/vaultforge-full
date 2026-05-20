"use client";

import React from "react";

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
  if (asset.includes("commercial") || ["retail", "office", "industrial", "warehouse", "hotel", "self storage", "mixed use", "medical", "restaurant"].some((term) => type.includes(term))) return "commercial";
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
  const base: [string, string][] = [
    ["Asset", txt(room.assetClass, "Deal")],
    ["Type", txt(room.propertyType)],
    ["Strategy", list(room.strategy).join(", ") || "Not selected"],
    ["Ask", txt(room.askingPrice || room.askPrice)],
    ["ARV / Value", txt(room.propertyValue || room.value)],
    ["Repairs", txt(room.repairs)],
  ];

  if (lane === "commercial") {
    return [["Asset", "Commercial"], ["Use", txt(room.propertyType)], ["Units", txt(room.units)], ["NOI", txt(room.noi)], ["Cap Rate", txt(room.capRate)], ["Occupancy", txt(room.occupancy)]];
  }

  if (lane === "land") {
    return [["Asset", "Land"], ["Type", txt(room.propertyType)], ["Acres", txt(room.acres)], ["Zoning", txt(room.zoning)], ["Utilities", txt(room.utilities)], ["Entitlement", txt(room.entitlementStatus)]];
  }

  return [...base.slice(0, 2), ["Beds", txt(room.beds)], ["Baths", txt(room.baths)], ["Sqft", txt(room.sqft)], ["Occupancy", txt(room.occupancy)]];
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
  const missing = [["asking price", ask], ["ARV/value", value], ["repair budget", repairs], ["control status", room.controlStatus], ["access status", room.accessStatus], ["title status", room.titleStatus]].filter(([, v]) => !v || txt(v, "") === "Unknown").map(([label]) => String(label));

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

  const closeProbability = Math.max(5, Math.min(95, opportunity - risk * 0.35 + (txt(room.controlStatus, "").toLowerCase().includes("controlled") ? 15 : 0)));
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
    primaryConstraint: !ask || !value ? "Underwriting data is incomplete. Buyer confidence will stay weak until ask, value, repairs, access, and proof are complete." : txt(room.controlStatus, "").toLowerCase().includes("no") ? "Control is the binding constraint. Do not over-route until authority, contract position, or decision rights are secured." : risk >= 70 ? "Risk concentration is high. Split legal/title, access, construction, and capital risk before buyer exposure." : "Execution sequencing is the current constraint. Verify control, route the correct counterparty, and compress decision time.",
    nextMove: lane === "commercial" ? "Build the commercial snapshot: NOI, rent roll, occupancy, debt pressure, tenant risk, cap-rate logic, and reposition thesis. Route to capital/operator fit." : lane === "land" ? "Confirm zoning, utilities, access, entitlement path, road frontage, and highest/best use. Route to developer or land buyer only after entitlement risk is explicit." : "Verify ask, ARV, repair scope, occupancy, control, access, and title. Route by strategy fit, not by generic state match.",
    hiddenUpside: spread > 75000 ? "Spread may support multiple exits: wholesale fee, flip margin, JV structure, private capital participation, or buy-and-hold recap." : lane === "land" ? "Hidden upside likely sits in entitlement, assemblage, utility access, or highest/best-use change." : lane === "commercial" ? "Hidden upside may sit in rent reset, vacancy absorption, operator replacement, use conversion, or seller financing." : "Hidden upside depends on cleaner proof, seller motivation, financing structure, and faster execution path.",
    killShot: missing.length ? `Missing proof creates friction: ${missing.join(", ")}. Resolve these before pushing the room hard.` : risk >= 70 ? "Main deal killer is unresolved risk stacking faster than buyer confidence." : "No fatal deal killer detected yet. Continue diligence and route with a clear decision deadline.",
    decisionTree: ["If control is weak: secure authority before mass routing.", "If numbers are weak: complete ask/value/repair proof before buyer blast.", "If spread is real: route buyer plus capital stack simultaneously.", "If risk is legal/title/access: route specialist before operator."],
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

  const root = yes(room.rootCause) ? txt(room.rootCause) : blockers.includes("Capital") ? "Likely liquidity timing mismatch or incomplete capital stack." : blockers.includes("Title") ? "Likely title/legal clearance failure." : blockers.includes("Contractor") ? "Likely vendor dependency and scope-control failure." : blockers.includes("Permit") || blockers.includes("City") ? "Likely municipal sequencing, permit, or compliance bottleneck." : "Root cause is not fully isolated. Start with constraint mapping before spending more time or money.";
  const corrective = blockers.includes("Capital") ? "Quantify exact cash gap, deadline, collateral, payoff path, and repayment source. Route to lender/private capital only after use-of-funds is precise." : blockers.includes("Title") ? "Pull title facts, identify curative issue, assign legal/title owner, and create a date-certain clearance path." : blockers.includes("Contractor") ? "Freeze scope, separate must-do from nice-to-do, verify remaining budget, and remove single-point contractor dependency." : blockers.includes("Permit") || blockers.includes("City") ? "Map required approvals, missing documents, responsible party, and inspection sequence. Route to permit expeditor or local operator." : "Define blocker, owner, due date, decision maker, money required, and failure consequence. Then route the correct solver.";

  return {
    severity,
    collapseRisk,
    detectionGap,
    solverClarity,
    rpn,
    root,
    corrective,
    fiveWhy: ["What is stopping execution right now?", "Why has that blocker not been removed?", "Which party owns the next decision?", "What resource is missing: capital, authority, document, vendor, buyer, or time?", "What happens if no action occurs inside the next decision window?"],
    fishbone: [`People: ${txt(room.ownerSituation, "decision maker / stakeholder alignment not fully mapped")}`, `Process: ${blockers.join(", ") || "process blocker not classified"}`, `Capital: ${txt(room.capitalPressure || room.moneyNeededNow)}`, `Legal/Compliance: ${txt(room.titleStatus || room.permitStatus || room.legalStatus)}`, `Asset Condition: ${txt(room.condition)}`, `Time: ${txt(room.timePressure || room.deadline)}`],
    actionPlan: ["Stabilize: stop new spend until the single constraint is named.", "Define: capture owner, deadline, required money/docs, and failure consequence.", "Route: send to the highest-fit solver, not the broadest audience.", "Control: create 24/72-hour check-in loop until blocker is removed.", "Close: mark resolved only when the blocker is actually cleared."],
  };
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

export function RoomFrontIntelligence({ kind, room }: { kind: RoomKind; room: AnyRoom }) {
  if (kind === "pain") {
    const ai = painAnalysis(room);
    return (
      <div style={{ marginTop: 16 }}>
        <SnapshotGrid items={roomFieldSnapshot(kind, room)} />
        <div style={{ ...redPanel, marginTop: 14 }}>
          <div style={eyebrow}>AI Pressure Read</div>
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
      <div style={{ ...goldPanel, marginTop: 14 }}>
        <div style={eyebrow}>AI Underwriting Read</div>
        <p style={sub}>{ai.primaryConstraint}</p>
        <Meter label="Close Probability" value={ai.closeProbability} />
        <p style={muted}>Spread: {money(ai.spread)} • Equity: {pct(ai.equity)}</p>
      </div>
    </div>
  );
}


function DiagnosticQA({
  question,
  answer,
  action,
}: {
  question: string;
  answer: string;
  action: string;
}) {
  return (
    <div style={{ borderTop: "1px solid rgba(207,216,230,.12)", paddingTop: 12, marginTop: 12 }}>
      <div style={{ ...eyebrow, marginBottom: 6 }}>Question</div>
      <p style={muted}>{question}</p>
      <div style={{ ...eyebrow, marginBottom: 6, marginTop: 10 }}>AI Answer</div>
      <p style={sub}>{answer}</p>
      <div style={{ ...eyebrow, marginBottom: 6, marginTop: 10 }}>Action</div>
      <p style={muted}>{action}</p>
    </div>
  );
}

function DiagnosticList({
  title,
  items,
}: {
  title: string;
  items: { question: string; answer: string; action: string }[];
}) {
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
      answer: blockers.length
        ? `${blockers.join(", ")} is the current constraint stack. The room is not blocked by generic activity; it is blocked by a named execution constraint.`
        : ai.root,
      action: "Assign one owner to the top blocker and create a 24-hour evidence request: documents, dollar amount, deadline, decision maker, and required approval.",
    },
    {
      question: "Why has that blocker not been removed?",
      answer: ai.detectionGap >= 50
        ? "The detection gap is high. The system does not yet have enough clean facts to separate cause from symptom."
        : "The facts are strong enough to move from diagnosis to solver routing.",
      action: ai.detectionGap >= 50
        ? "Collect missing facts before routing broadly. Do not let members guess at the solution."
        : "Route to the highest-fit solver and set a response deadline.",
    },
    {
      question: "Which party owns the next decision?",
      answer: txt(room.ownerSituation, "Decision ownership is not fully mapped. That creates delay risk because nobody is clearly accountable for the next move."),
      action: "Name the decision owner, backup owner, and approval path before spending more time or capital.",
    },
    {
      question: "What resource is missing?",
      answer: needs.length
        ? `The room is asking for ${needs.join(", ")}. That is the resource lane VaultForge should route first.`
        : "The missing resource is not clearly classified. This makes routing weaker.",
      action: needs.length
        ? "Route by exact need, not by general member type. Match lender to capital gap, attorney to title/legal, operator to execution, contractor to scope."
        : "Force-select the missing resource before routing.",
    },
    {
      question: "What happens if no action occurs inside the decision window?",
      answer: txt(room.worstCase, "Pressure compounds: cost increases, leverage weakens, options narrow, and the room can move from solvable to distressed."),
      action: "Set the room to escalation watch if no member response occurs within the stated time pressure window.",
    },
  ];
}

function painFishboneAnswers(room: AnyRoom) {
  return [
    {
      question: "People",
      answer: txt(room.ownerSituation, "Stakeholder alignment is not mapped. This can create hidden veto power, slow approvals, and unclear authority."),
      action: "Identify owner, decision maker, payer, operator, and any blocking party.",
    },
    {
      question: "Process",
      answer: list(room.blockers).length
        ? `Process breakdown is tied to ${list(room.blockers).join(", ")}.`
        : "The process failure is not yet classified.",
      action: "Convert the blocker into a step-by-step checklist with owner and deadline.",
    },
    {
      question: "Capital",
      answer: txt(room.capitalPressure || room.moneyNeededNow, "Capital pressure is not quantified. That makes lender routing weak."),
      action: "Document amount needed, timing, collateral, use of funds, and repayment/exit path.",
    },
    {
      question: "Legal / Compliance",
      answer: txt(room.titleStatus || room.permitStatus || room.legalStatus, "Legal, title, permit, or compliance exposure is not listed."),
      action: "Separate legal/title risk from operational risk and route to specialist if unclear.",
    },
    {
      question: "Asset Condition",
      answer: txt(room.condition, "Physical condition is not listed. Repair, safety, access, and scope risk remain open."),
      action: "Add photos, scope category, immediate safety issues, and repair owner.",
    },
    {
      question: "Time",
      answer: txt(room.timePressure || room.deadline, "No deadline listed. Without a deadline, the system cannot prioritize urgency correctly."),
      action: "Add a real decision deadline and escalation threshold.",
    },
  ];
}

function painControlPlanAnswers(room: AnyRoom, ai: ReturnType<typeof painAnalysis>) {
  return [
    {
      question: "Sort",
      answer: "Separate symptoms from the one constraint that actually stops progress.",
      action: `Primary constraint: ${ai.root}`,
    },
    {
      question: "Set In Order",
      answer: "Put the fix sequence in the order that reduces risk fastest.",
      action: ai.corrective,
    },
    {
      question: "Shine",
      answer: "Clean the room data so members do not waste time interpreting incomplete facts.",
      action: "Add missing documents, photos, amounts, dates, authority, and contact path.",
    },
    {
      question: "Standardize",
      answer: "Make the response path repeatable so every similar problem can be routed faster next time.",
      action: "Use the same blocker-owner-deadline-solver format on every pain room.",
    },
    {
      question: "Sustain",
      answer: "Keep the room from going stale after the first message.",
      action: "Create 24/72-hour follow-up checks until blocker is removed or room is archived/resolved.",
    },
  ];
}


export function RoomInsideIntelligence({ kind, room }: { kind: RoomKind; room: AnyRoom }) {
  if (kind === "pain") {
    const ai = painAnalysis(room);
    return (
      <section style={{ background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(255,70,70,.35)", borderRadius: 26, padding: 26, marginBottom: 22 }}>
        <div style={eyebrow}>AI Problem Solver Desk</div>
        <h2 style={h2}>Surgical pain-room diagnosis.</h2>
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
          <DiagnosticList title="5 Whys / AI Answers" items={painFiveWhyAnswers(room, ai)} />
          <DiagnosticList title="Fishbone / Ishikawa Answers" items={painFishboneAnswers(room)} />
          <DiagnosticList title="5S / Control Plan Answers" items={painControlPlanAnswers(room, ai)} />
        </div>
      </section>
    );
  }

  const ai = dealAnalysis(room);
  return (
    <section style={{ background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.36)", borderRadius: 26, padding: 26, marginBottom: 22 }}>
      <div style={eyebrow}>AI Deal Intelligence Desk</div>
      <h2 style={h2}>Institutional underwriting and execution read.</h2>

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
        <div style={panel}>
          <div style={eyebrow}>Decision Tree</div>
          {ai.decisionTree.map((item) => <p key={item} style={muted}>• {item}</p>)}
        </div>
      </div>
    </section>
  );
}
