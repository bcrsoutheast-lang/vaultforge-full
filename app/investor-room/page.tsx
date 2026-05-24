"use client";


import Link from "next/link";
import VaultForgeAlertCenter from "../components/VaultForgeAlertCenter";
import { useEffect, useMemo, useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const INVESTOR_SESSION_KEY = "vaultforge_investor_session_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";
const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";
const INVESTOR_EXECUTION_REQUESTS_KEY =
  "vaultforge_investor_execution_requests_v1";
const DESIGNATED_ROUTE_MESSAGES_KEY = "vaultforge_designated_route_messages_v1";
const INVESTOR_ADMIN_MESSAGES_KEY = "vaultforge_investor_admin_messages_v1";
const ADMIN_INBOX_KEY = "vaultforge_admin_investor_inbox_v1";
const SIMPLE_REQUESTS_KEY = "vaultforge_requests_v1";
const OWNER_DIRECT_MESSAGES_KEY = "vaultforge_owner_direct_messages_v1";
const INVESTOR_CLEANUP_KEY = "vaultforge_investor_room_cleanup_v2";
const INVESTOR_HIDDEN_KEY = "vaultforge_investor_room_hidden_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const EXECUTION_LANES = [
  {
    key: "lender",
    title: "Request Lender",
    note: "Route this opportunity to private funding sources inside the member network.",
  },
  {
    key: "hard_money",
    title: "Request Hard Money",
    note: "Request fast bridge, rehab, or acquisition capital.",
  },
  {
    key: "jv_partner",
    title: "Request JV Partner",
    note: "Ask for an execution or capital partner for this opportunity.",
  },
  {
    key: "contractor",
    title: "Request Contractor",
    note: "Ask for rehab, construction, bid, or field execution help.",
  },
  {
    key: "title_closing",
    title: "Request Title / Closing",
    note: "Ask for title, closing, escrow, or transaction coordination help.",
  },
  {
    key: "insurance",
    title: "Request Insurance",
    note: "Ask for property insurance or risk coverage help.",
  },
  {
    key: "property_management",
    title: "Request Property Management",
    note: "Ask for leasing, rental, or management support.",
  },
  {
    key: "operator",
    title: "Request Operator",
    note: "Ask for an operator, asset manager, or boots-on-ground execution help.",
  },
  {
    key: "disposition",
    title: "Request Disposition Help",
    note: "Ask for resale, buyer, or exit strategy support.",
  },
  {
    key: "boots_on_ground",
    title: "Request Boots On Ground",
    note: "Ask for local eyes, site visit, photos, or field support.",
  },
  {
    key: "equity_partner",
    title: "Request Equity Partner",
    note: "Ask for private capital or equity partnership routing.",
  },
];

const TICKER_ITEMS = [
  "VAULTFORGE INVESTOR ACCESS",
  "PRIVATE DEAL SIGNALS",
  "PAIN PRESSURE ROUTING",
  "FUNDING THROUGH NETWORK",
  "EXECUTION THROUGH MEMBERS",
  "NO PRIVATE CONTACT EXPOSED",
  "REQUEST INFO CONTROLLED",
  "PROFILE ATTACHED TO REQUESTS",
  "MEMBER APPROVAL REQUIRED",
  "ONE-STOP EXECUTION LANE",
];

const INTELLIGENCE_BLURBS = [
  "VaultForge routes investor requests with buyer profile context attached.",
  "Private member data stays hidden until deeper access is approved.",
  "Deal and Pain cards are teaser intelligence, not public listings.",
  "More complete investor profiles create stronger routing and better member confidence.",
  "Execution requests route to the private network without exposing the directory.",
];

const LOGOS = [
  "/vaultforge-logo.png",
  "/VaultForge-logo.png",
  "/vaultforge-logo.jpg",
  "/logo.png",
  "/vf-logo.png",
  "/vaultforge.png",
];

type Kind = "Deal" | "Pain";
type Folder = "active" | "saved" | "archived" | "deleted";
type ActiveRoom = { kind: Kind; item: any } | null;


function browserValue(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isQuotaError(error: any) {
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    name.includes("quota") ||
    message.includes("quota") ||
    message.includes("exceeded")
  );
}

function trimText(value: unknown, limit = 900) {
  const text = String(value || "").trim();
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function compactInvestorProfile(profile: any) {
  return {
    photoUrl: trimText(profile?.photoUrl, 500),
    contactName: trimText(profile?.contactName || profile?.name, 120),
    company: trimText(profile?.company, 120),
    email: trimText(profile?.email, 160),
    phone: trimText(profile?.phone, 80),
    website: trimText(profile?.website, 160),
    investorTypes: Array.isArray(profile?.investorTypes)
      ? profile.investorTypes.slice(0, 10)
      : profile?.investorTypes || [],
    buyingStrategies: Array.isArray(profile?.buyingStrategies)
      ? profile.buyingStrategies.slice(0, 10)
      : profile?.buyingStrategies || [],
    assetTypes: Array.isArray(profile?.assetTypes)
      ? profile.assetTypes.slice(0, 10)
      : profile?.assetTypes || [],
    statesInterested: Array.isArray(profile?.statesInterested)
      ? profile.statesInterested.slice(0, 12)
      : profile?.statesInterested || [],
    countiesInterested: trimText(profile?.countiesInterested, 500),
    citiesInterested: trimText(profile?.citiesInterested, 500),
    minDeal: trimText(profile?.minDeal, 80),
    maxDeal: trimText(profile?.maxDeal, 80),
    monthlyVolume: trimText(profile?.monthlyVolume, 80),
    yearlyVolume: trimText(profile?.yearlyVolume, 80),
    closeSpeed: trimText(profile?.closeSpeed, 80),
    proofFunds: trimText(profile?.proofFunds, 80),
    directBuyer: trimText(profile?.directBuyer, 80),
    fundingNeeded: trimText(profile?.fundingNeeded, 80),
    openToJV: trimText(profile?.openToJV, 80),
    openToWholesalers: trimText(profile?.openToWholesalers, 80),
    capitalSource: trimText(profile?.capitalSource, 160),
    notes: trimText(profile?.notes, 500),
  };
}

function safeStorageSize(value: unknown) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

function stripHeavyInvestorProfileStorage() {
  const profileKeys = [
    INVESTOR_APP_KEY,
    "vaultforge_investor_applications_v1",
    "vaultforge_profile",
    "vaultforge_member_profile",
    "vaultforge_clean_profile",
    "vaultforge_member_directory_v1",
  ];

  const heavyFields = [
    "photoUrl",
    "profilePhoto",
    "companyLogo",
    "logoUrl",
    "avatar",
    "image",
    "imageUrl",
    "photos",
    "photo_urls",
    "photoUrls",
    "files",
    "attachments",
  ];

  for (const key of profileKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const stripRow = (row: any) => {
        if (!row || typeof row !== "object") return row;
        const next = { ...row };
        for (const field of heavyFields) {
          if (typeof next[field] === "string" && next[field].length > 1200)
            next[field] = "";
          if (
            Array.isArray(next[field]) &&
            JSON.stringify(next[field]).length > 1200
          )
            next[field] = [];
        }
        return next;
      };
      const compacted = Array.isArray(parsed)
        ? parsed.slice(0, 25).map(stripRow)
        : stripRow(parsed);
      localStorage.setItem(key, JSON.stringify(compacted));
    } catch {
      // ignore malformed profile cache
    }
  }
}

function aggressiveVaultForgeQuotaPurge(protectKeys: string[] = []) {
  const protectedSet = new Set([
    INVESTOR_SESSION_KEY,
    INVESTOR_APP_KEY,
    "vaultforge_investor_email",
    "vaultforge_investor_login_v1",
    ...protectKeys,
  ]);

  stripHeavyInvestorProfileStorage();

  const candidates: { key: string; size: number; removeScore: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || "";
      if (
        !key.toLowerCase().includes("vaultforge") &&
        !key.toLowerCase().startsWith("vf_")
      )
        continue;
      if (protectedSet.has(key)) continue;
      const raw = localStorage.getItem(key) || "";
      const lowerKey = key.toLowerCase();
      let removeScore = 0;
      if (lowerKey.includes("deleted")) removeScore += 50;
      if (lowerKey.includes("archived")) removeScore += 35;
      if (lowerKey.includes("debug")) removeScore += 35;
      if (lowerKey.includes("message")) removeScore += 20;
      if (lowerKey.includes("thread")) removeScore += 20;
      if (lowerKey.includes("request")) removeScore += 15;
      if (raw.length > 100000) removeScore += 40;
      if (raw.length > 250000) removeScore += 80;
      candidates.push({ key, size: raw.length, removeScore });
    }

    candidates.sort((a, b) => b.removeScore - a.removeScore || b.size - a.size);

    for (const item of candidates.slice(0, 12)) {
      try {
        if (item.removeScore >= 35 || item.size > 150000)
          localStorage.removeItem(item.key);
      } catch {
        // keep purging other keys
      }
    }
  } catch {
    // ignore storage scan errors
  }
}

function safeSetJsonWithPurge(key: string, value: unknown) {
  const json = JSON.stringify(value);
  try {
    localStorage.setItem(key, json);
    return true;
  } catch (error: any) {
    if (!isQuotaError(error)) throw error;
    aggressiveVaultForgeQuotaPurge([key]);
    localStorage.removeItem(key);
    localStorage.setItem(key, json);
    return true;
  }
}

function compactStorageRow(row: any) {
  const profile = compactInvestorProfile(row?.investorProfile || row || {});
  return {
    ...row,
    body: trimText(row?.body, 1200),
    message: trimText(row?.message, 1600),
    notes: trimText(row?.notes, 900),
    roomHeader: trimText(row?.roomHeader, 500),
    investorProfile: compactInvestorProfile(profile),
    investorEmail: row?.investorEmail || profile.email || "",
    investorCompany: row?.investorCompany || profile.company || "",
    investorName: row?.investorName || profile.contactName || "",
    investorPhotoUrl: row?.investorPhotoUrl || profile.photoUrl || "",
  };
}

function compactRowsForKey(key: string, value: unknown) {
  if (!Array.isArray(value)) return value;

  const maxRowsByKey: Record<string, number> = {
    [ADMIN_INBOX_KEY]: 60,
    [INVESTOR_EXECUTION_REQUESTS_KEY]: 60,
    [INVESTOR_REQUESTS_KEY]: 60,
    [INVESTOR_ADMIN_MESSAGES_KEY]: 40,
    [CONTROLLED_THREADS_KEY]: 50,
    vaultforge_admin_messages_v1: 40,
  };

  const max = maxRowsByKey[key] || 80;
  return value
    .slice(0, max)
    .map((row) =>
      row && typeof row === "object" ? compactStorageRow(row) : row,
    );
}

function compactVaultForgeLocalStorage() {
  const keysToCompact = [
    ADMIN_INBOX_KEY,
    INVESTOR_EXECUTION_REQUESTS_KEY,
    INVESTOR_REQUESTS_KEY,
    INVESTOR_ADMIN_MESSAGES_KEY,
    CONTROLLED_THREADS_KEY,
    "vaultforge_admin_messages_v1",
    "vaultforge_message_threads_v2",
    "vaultforge_message_command_threads_v1",
  ];

  for (const key of keysToCompact) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) {
        localStorage.setItem(
          key,
          JSON.stringify(compactRowsForKey(key, parsed)),
        );
      }
    } catch {
      // If one cache is malformed or too large to parse, leave it alone.
    }
  }
}

function emergencyFreeVaultForgeRequestStorage() {
  const keysToShrink = [
    ADMIN_INBOX_KEY,
    INVESTOR_EXECUTION_REQUESTS_KEY,
    INVESTOR_REQUESTS_KEY,
    INVESTOR_ADMIN_MESSAGES_KEY,
    CONTROLLED_THREADS_KEY,
    "vaultforge_admin_messages_v1",
    "vaultforge_message_threads_v2",
    "vaultforge_message_command_threads_v1",
  ];

  for (const key of keysToShrink) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) {
        const tiny = parsed
          .slice(0, 10)
          .map((row) =>
            row && typeof row === "object" ? compactStorageRow(row) : row,
          );
        localStorage.removeItem(key);
        localStorage.setItem(key, JSON.stringify(tiny));
      }
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }
}

function writeJson(key: string, value: unknown) {
  const compactValue = compactRowsForKey(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(compactValue));
    return true;
  } catch (error: any) {
    if (!isQuotaError(error)) throw error;

    compactVaultForgeLocalStorage();
    stripHeavyInvestorProfileStorage();

    try {
      safeSetJsonWithPurge(key, compactValue);
      return true;
    } catch (secondError: any) {
      if (Array.isArray(compactValue)) {
        const emergencyValue = compactValue
          .slice(0, 3)
          .map((row) =>
            row && typeof row === "object" ? compactStorageRow(row) : row,
          );

        emergencyFreeVaultForgeRequestStorage();
        aggressiveVaultForgeQuotaPurge([key]);
        safeSetJsonWithPurge(key, emergencyValue);
        return true;
      }
      throw secondError;
    }
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function itemState(item: any) {
  return clean(
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
      item?.location_state,
  ).toUpperCase();
}

function itemTitle(item: any, kind: Kind) {
  return clean(
    item?.title || item?.name || item?.headline || item?.summary,
    `${kind} Teaser`,
  );
}

function itemId(item: any, kind: Kind, index = 0) {
  return clean(
    item?.id ||
      item?.roomId ||
      item?.room_id ||
      item?.dealId ||
      item?.deal_id ||
      item?.painId ||
      item?.pain_id ||
      item?.signalId ||
      item?.signal_id,
    `${kind}-${itemTitle(item, kind)}-${itemState(item)}-${index}`,
  );
}

function itemKey(item: any, kind: Kind, index = 0) {
  return `${kind}:${itemId(item, kind, index)}:${itemState(item)}:${itemTitle(item, kind)}`.toLowerCase();
}

function cleanupKey(item: any, kind: Kind) {
  return `${kind}:${itemState(item)}:${itemTitle(item, kind)}:${itemId(item, kind)}`.toLowerCase();
}

function readRows(keys: string[]) {
  if (typeof window === "undefined") return [];
  const rows: any[] = [];
  keys.forEach((key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) rows.push(...parsed);
      else if (parsed && typeof parsed === "object")
        rows.push(...Object.values(parsed));
    } catch {
      // ignore malformed browser data
    }
  });
  return rows;
}

function dedupe(rows: any[], kind: Kind) {
  const map = new Map<string, any>();
  rows.forEach((item, index) => {
    const key = itemKey(item, kind, index);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

function cleanupMap() {
  return readJson<Record<string, Folder>>(INVESTOR_CLEANUP_KEY, {});
}

function hiddenMap() {
  return readJson<Record<string, boolean>>(INVESTOR_HIDDEN_KEY, {});
}

function getFolder(item: any, kind: Kind): Folder {
  return cleanupMap()[cleanupKey(item, kind)] || "active";
}

function setFolderForItem(item: any, kind: Kind, folder: Folder) {
  const map = cleanupMap();
  const key = cleanupKey(item, kind);
  if (folder === "active") delete map[key];
  else map[key] = folder;
  writeJson(INVESTOR_CLEANUP_KEY, map);
  window.dispatchEvent(new Event("vaultforge-investor-room-change"));
}

function hideForever(item: any, kind: Kind) {
  const map = hiddenMap();
  map[cleanupKey(item, kind)] = true;
  writeJson(INVESTOR_HIDDEN_KEY, map);

  const cleanup = cleanupMap();
  delete cleanup[cleanupKey(item, kind)];
  writeJson(INVESTOR_CLEANUP_KEY, cleanup);

  window.dispatchEvent(new Event("vaultforge-investor-room-change"));
}

function isHidden(item: any, kind: Kind) {
  return Boolean(hiddenMap()[cleanupKey(item, kind)]);
}

function investorProfileSnapshot(investor: any) {
  return {
    photoUrl: investor?.photoUrl || "",
    contactName: investor?.contactName || "",
    company: investor?.company || "",
    email: investor?.email || "",
    phone: investor?.phone || "",
    website: investor?.website || "",
    investorTypes: investor?.investorTypes || investor?.assetTypes || [],
    buyingStrategies:
      investor?.buyingStrategies || investor?.buyingStrategy || [],
    assetTypes: investor?.assetTypes || [],
    statesInterested: investor?.statesInterested || [],
    countiesInterested: investor?.countiesInterested || "",
    citiesInterested: investor?.citiesInterested || "",
    minDeal: investor?.minDeal || "",
    maxDeal: investor?.maxDeal || "",
    monthlyVolume: investor?.monthlyVolume || "",
    yearlyVolume: investor?.yearlyVolume || "",
    closeSpeed: investor?.closeSpeed || "",
    proofFunds: investor?.proofFunds || "",
    directBuyer: investor?.directBuyer || "",
    fundingNeeded: investor?.fundingNeeded || "",
    openToJV: investor?.openToJV || "",
    openToWholesalers: investor?.openToWholesalers || "",
    capitalSource: investor?.capitalSource || "",
    notes: investor?.notes || "",
  };
}

function saveInvestorOwnerMessage(subject: string, body: string) {
  const rows = readJson<any[]>(INVESTOR_ADMIN_MESSAGES_KEY, []);
  const investor = readInvestor();
  const profile = investorProfileSnapshot(investor);

  rows.unshift({
    id: `investor-admin-message-${Date.now()}`,
    topic: subject || "Investor message to admin",
    subject: subject || "Investor message to admin",
    body,
    message: body,
    status: "new_owner_message",
    priority: "normal",
    lane: "investor-admin",
    investorEmail: profile.email,
    investorCompany: profile.company,
    investorName: profile.contactName,
    investorPhotoUrl: profile.photoUrl,
    investorProfile: compactInvestorProfile(profile),
    createdAt: new Date().toISOString(),
  });

  writeJson(INVESTOR_ADMIN_MESSAGES_KEY, rows.slice(0, 40));

  const adminRows = readJson<any[]>("vaultforge_admin_messages_v1", []);
  adminRows.unshift({
    id: `investor-admin-message-${Date.now()}`,
    topic: `Investor Message: ${subject || "No subject"}`,
    body,
    email: profile.email || "",
    status: "new",
    priority: "normal",
    source: "owner-direct-message",
    investorProfile: compactInvestorProfile(profile),
    createdAt: new Date().toISOString(),
  });
  writeJson("vaultforge_admin_messages_v1", adminRows.slice(0, 40));

  pushOwnerInbox({
    id: `admin-message-to-admin-${Date.now()}`,
    type: "message_admin",
    requestTitle: subject || "Message Owner",
    title: subject || "Message Owner",
    subject: subject || "Message Owner",
    body: body || "Investor requested admin support.",
    message: body || "Investor requested admin support.",
    status: "new",
    source: "investor-room-message-admin",
    investorProfile: compactInvestorProfile(profile || safeInvestorSnapshot()),
    investorEmail: profile?.email || "",
    investorCompany: profile?.company || "",
    investorName: profile?.contactName || "",
    investorPhotoUrl: profile?.photoUrl || "",
  });

  window.dispatchEvent(new Event("vaultforge-investor-admin-message-change"));
  window.dispatchEvent(new Event("vaultforge-admin-message-change"));
  window.dispatchEvent(new Event("vaultforge-owner-message-change"));
}


function designatedRecipientForLane(lane: any) {
  const key = String(lane?.key || "").toLowerCase();

  const map: Record<string, { label: string; role: string; queue: string }> = {
    lender: {
      label: "Designated Lender Lane",
      role: "lender",
      queue: "lenders",
    },
    hard_money: {
      label: "Designated Hard Money Lane",
      role: "hard_money_lender",
      queue: "hard_money",
    },
    jv_partner: {
      label: "Designated JV Partner Lane",
      role: "jv_partner",
      queue: "jv_partners",
    },
    contractor: {
      label: "Designated Contractor Lane",
      role: "contractor",
      queue: "contractors",
    },
    title_closing: {
      label: "Designated Title / Closing Lane",
      role: "title_closing",
      queue: "title_closing",
    },
    insurance: {
      label: "Designated Insurance Lane",
      role: "insurance",
      queue: "insurance",
    },
    property_management: {
      label: "Designated Property Management Lane",
      role: "property_manager",
      queue: "property_management",
    },
    operator: {
      label: "Designated Operator Lane",
      role: "operator",
      queue: "operators",
    },
    disposition: {
      label: "Designated Disposition Lane",
      role: "disposition",
      queue: "disposition",
    },
    boots_on_ground: {
      label: "Designated Boots-On-Ground Lane",
      role: "boots_on_ground",
      queue: "boots_on_ground",
    },
    equity_partner: {
      label: "Designated Equity Partner Lane",
      role: "equity_partner",
      queue: "equity_partners",
    },
  };

  return map[key] || {
    label: "Designated Member Lane",
    role: key || "member",
    queue: key || "members",
  };
}


function saveExecutionRequest(kind: Kind, item: any, lane: any, notes: string) {
  try {
    compactVaultForgeLocalStorage();
    stripHeavyInvestorProfileStorage();

    const investor = readInvestor();
    const profile = investorProfileSnapshot(investor);
    const title = itemTitle(item, kind);
    const state = itemState(item);
    const now = Date.now();
    const createdAt = new Date().toISOString();
    const executionId = `execution-request-${now}`;
    const adminInboxId = `admin-execution-request-${now}`;
    const designated = designatedRecipientForLane(lane);
    const header = `${lane.title} - ${kind} - ${title} - ${state || "Unknown State"}`;
    const compactProfile = compactInvestorProfile(
      profile || safeInvestorSnapshot(),
    );

    const adminInboxRow = compactStorageRow({
      id: adminInboxId,
      routedTo: designated.label,
      designatedRole: designated.role,
      designatedQueue: designated.queue,
      type: "execution_request",
      requestType: lane.key,
      requestTitle: lane.title,
      title,
      subject: `${lane.title} - ${title}`,
      body: notes || "Investor requested execution support.",
      message: `${header}\n\n${notes || "Investor requested execution support."}`,
      status: "new",
      source: "designated-route-message",
      kind,
      itemId: itemId(item, kind),
      state,
      roomHeader: header,
      investorProfile: compactProfile,
      investorEmail: compactProfile?.email || "",
      investorCompany: compactProfile?.company || "",
      investorName: compactProfile?.contactName || "",
      investorPhotoUrl: compactProfile?.photoUrl || "",
      createdAt,
      updatedAt: createdAt,
    });

    const designatedRows = readJson<any[]>(DESIGNATED_ROUTE_MESSAGES_KEY, []);
    writeJson(DESIGNATED_ROUTE_MESSAGES_KEY, [adminInboxRow, ...designatedRows].slice(0, 120));

    // Owner visibility mirror only. The request is routed to the designated lane, not admin routing.
    const currentInbox = readJson<any[]>(ADMIN_INBOX_KEY, []);
    writeJson(ADMIN_INBOX_KEY, [adminInboxRow, ...currentInbox].slice(0, 25));

    const savedOwnerInboxRows = readJson<any[]>(ADMIN_INBOX_KEY, []);
    const adminSaved = savedOwnerInboxRows.some(
      (row) => row?.id === adminInboxId,
    );

    if (!adminSaved) {
      aggressiveVaultForgeQuotaPurge([ADMIN_INBOX_KEY]);
      writeJson(ADMIN_INBOX_KEY, [adminInboxRow]);
    }

    const verifiedInboxRows = readJson<any[]>(ADMIN_INBOX_KEY, []);
    const verifiedOwnerSaved = verifiedInboxRows.some(
      (row) => row?.id === adminInboxId,
    );
    if (!verifiedOwnerSaved) {
      throw new Error(
        "Owner inbox could not save after emergency cleanup. Clear Safari site data for this domain once, then resend.",
      );
    }

    const executionRow = compactStorageRow({
      id: executionId,
      requestType: lane.key,
      requestTitle: lane.title,
      kind,
      itemId: itemId(item, kind),
      title,
      state,
      roomHeader: header,
      investorEmail: compactProfile.email,
      investorCompany: compactProfile.company,
      investorName: compactProfile.contactName,
      investorPhotoUrl: compactProfile.photoUrl,
      investorProfile: compactProfile,
      notes: notes || "",
      message: `${header}\n\n${notes || "Investor requested execution support."}`,
      status: "new",
      createdAt,
      updatedAt: createdAt,
      adminInboxId,
    });

    try {
      const executionRows = readJson<any[]>(
        INVESTOR_EXECUTION_REQUESTS_KEY,
        [],
      );
      writeJson(
        INVESTOR_EXECUTION_REQUESTS_KEY,
        [executionRow, ...executionRows].slice(0, 15),
      );
    } catch {
      // Owner inbox is the source of truth. Do not fail the send just because duplicate investor tracking is full.
    }

    window.dispatchEvent(
      new Event("vaultforge-investor-execution-request-change"),
    );
    window.dispatchEvent(new Event("vaultforge-admin-investor-inbox-change"));
    window.dispatchEvent(new Event("vaultforge-admin-investor-request-change"));

    return {
      ok: true,
      message: `${lane.title} sent to ${designated.label} with investor profile attached.`,
      executionId,
      adminInboxId,
    };
  } catch (error: any) {
    const message = error?.message || "Unknown localStorage save error.";
    console.error("VaultForge execution request failed", error);
    return {
      ok: false,
      message: `Execution request failed: ${message}`,
    };
  }
}

function readInvestor() {
  const session = readJson<any>(INVESTOR_SESSION_KEY, {});
  const application = readJson<any>(INVESTOR_APP_KEY, {});
  const applications = readJson<any[]>(
    "vaultforge_investor_applications_v1",
    [],
  );
  const sessionEmail = clean(
    session?.email ||
      application?.email ||
      browserValue("vaultforge_investor_email"),
  ).toLowerCase();
  const matching = Array.isArray(applications)
    ? applications.find(
        (row) =>
          clean(
            row?.email || row?.investorEmail || row?.investor_email,
          ).toLowerCase() === sessionEmail,
      )
    : null;

  return {
    ...(matching || {}),
    ...(application || {}),
    ...(session || {}),
    email:
      sessionEmail ||
      clean(application?.email || matching?.email || session?.email),
  };
}

function safeInvestorSnapshot() {
  const investor = readInvestor();
  try {
    if (typeof investorProfileSnapshot === "function")
      return investorProfileSnapshot(investor);
  } catch {
    // ignore
  }

  return {
    photoUrl: investor?.photoUrl || "",
    contactName: investor?.contactName || "",
    company: investor?.company || "",
    email:
      investor?.email ||
      browserValue("vaultforge_investor_email") ||
      "",
    phone: investor?.phone || "",
    website: investor?.website || "",
    investorTypes: investor?.investorTypes || [],
    buyingStrategies: investor?.buyingStrategies || [],
    assetTypes: investor?.assetTypes || [],
    statesInterested: investor?.statesInterested || [],
    minDeal: investor?.minDeal || "",
    maxDeal: investor?.maxDeal || "",
    monthlyVolume: investor?.monthlyVolume || "",
    yearlyVolume: investor?.yearlyVolume || "",
    closeSpeed: investor?.closeSpeed || "",
    proofFunds: investor?.proofFunds || "",
    directBuyer: investor?.directBuyer || "",
    fundingNeeded: investor?.fundingNeeded || "",
    notes: investor?.notes || "",
  };
}

function pushOwnerInbox(row: any) {
  const rows = readJson<any[]>(ADMIN_INBOX_KEY, []);
  const profile = compactInvestorProfile(
    row.investorProfile || safeInvestorSnapshot(),
  );
  const normalized = {
    id: row.id || `admin-inbox-${Date.now()}`,
    type: row.type || "investor_message",
    requestTitle:
      row.requestTitle || row.title || row.subject || "Investor Message",
    title: row.title || row.requestTitle || row.subject || "Investor Message",
    subject: row.subject || row.requestTitle || row.title || "Investor Message",
    body: row.body || row.message || row.notes || "",
    message: row.message || row.body || row.notes || "",
    status: row.status || "new",
    priority: row.priority || "normal",
    source: row.source || "investor-room",
    kind: row.kind || "Investor",
    itemId: row.itemId || "",
    state: row.state || "",
    roomHeader: row.roomHeader || row.header || "",
    investorEmail: row.investorEmail || profile.email || "",
    investorCompany: row.investorCompany || profile.company || "",
    investorName: row.investorName || profile.contactName || "",
    investorPhotoUrl: row.investorPhotoUrl || profile.photoUrl || "",
    investorProfile: compactInvestorProfile(profile),
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeJson(ADMIN_INBOX_KEY, [normalized, ...rows].slice(0, 60));
  window.dispatchEvent(new Event("vaultforge-admin-investor-inbox-change"));
}

function sendRequest(kind: Kind, item: any, body: string) {
  const rows = readJson<any[]>(INVESTOR_REQUESTS_KEY, []);
  const investor = readInvestor();
  const profile = investorProfileSnapshot(investor);
  const title = itemTitle(item, kind);
  const state = itemState(item);
  const header = `${kind} Request • ${title} • ${state || "Unknown State"}`;

  const profileText = [
    `Investor: ${profile.contactName || "Not listed"}`,
    `Company: ${profile.company || "Not listed"}`,
    `Email: ${profile.email || "Not listed"}`,
    `Phone: ${profile.phone || "Not listed"}`,
    `Types: ${Array.isArray(profile.investorTypes) ? profile.investorTypes.join(", ") : profile.investorTypes || "Not listed"}`,
    `Strategy: ${Array.isArray(profile.buyingStrategies) ? profile.buyingStrategies.join(", ") : profile.buyingStrategies || "Not listed"}`,
    `Markets: ${Array.isArray(profile.statesInterested) ? profile.statesInterested.join(", ") : profile.statesInterested || "Not listed"}`,
    `Buy Box: ${profile.minDeal || "Not listed"} - ${profile.maxDeal || "Not listed"}`,
    `Volume: ${profile.monthlyVolume || "Not listed"} / month, ${profile.yearlyVolume || "Not listed"} / year`,
    `Close Speed: ${profile.closeSpeed || "Not listed"}`,
    `Proof of Funds: ${profile.proofFunds || "Not listed"}`,
    `Direct Buyer: ${profile.directBuyer || "Not listed"}`,
    `Funding Needed: ${profile.fundingNeeded || "Not listed"}`,
  ].join("\n");

  rows.unshift({
    id: `investor-request-${Date.now()}`,
    kind,
    itemId: itemId(item, kind),
    title,
    state,
    roomHeader: header,
    investorEmail: profile.email,
    investorCompany: profile.company,
    investorName: profile.contactName,
    investorPhotoUrl: profile.photoUrl,
    investorProfile: compactInvestorProfile(profile),
    message: `${header}\n\n${body || "Investor requested more information."}`,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  writeJson(INVESTOR_REQUESTS_KEY, rows.slice(0, 60));
  pushOwnerInbox({
    id: `admin-deal-pain-request-${Date.now()}`,
    type: "deal_pain_request",
    requestTitle: `${kind} Request`,
    title,
    subject: `${kind} Request - ${title}`,
    body: body || "Investor requested more information.",
    message: `${header}\n\n${body || "Investor requested more information."}`,
    status: "new",
    source: "investor-room-request",
    kind,
    itemId: itemId(item, kind),
    state,
    roomHeader: header,
    investorProfile: compactInvestorProfile(profile || safeInvestorSnapshot()),
    investorEmail: profile?.email || "",
    investorCompany: profile?.company || "",
    investorName: profile?.contactName || "",
    investorPhotoUrl: profile?.photoUrl || "",
  });

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
  paddingBottom: 100,
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 16,
};
const wideGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 18,
};
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const tickerWrap: React.CSSProperties = {
  borderTop: "1px solid rgba(245,197,66,.25)",
  borderBottom: "1px solid rgba(245,197,66,.25)",
  background: "#090d14",
  overflow: "hidden",
  margin: "0 0 20px",
  borderRadius: 18,
};

const tickerTrack: React.CSSProperties = {
  display: "flex",
  gap: 40,
  width: "max-content",
  padding: "14px 0",
  animation: "vfTickerMove 34s linear infinite",
};

const panel: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 24,
  padding: 22,
};
const goldPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(245,197,66,.52)",
  boxShadow: "0 0 28px rgba(245,197,66,.10)",
};
const redPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(255,70,70,.52)",
  boxShadow: "0 0 28px rgba(255,70,70,.10)",
};
const activePanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(0,132,255,.62)",
  boxShadow: "0 0 34px rgba(0,132,255,.16)",
  background: "linear-gradient(180deg,#111a2a,#0b1020)",
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
const redBtn: React.CSSProperties = {
  ...btn,
  background: "#271016",
  borderColor: "rgba(255,70,70,.48)",
  color: "#ffaaaa",
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


type BloombergMessagePayload = {
  messageType: string;
  urgency: string;
  subject: string;
  body: string;
  amount: string;
  timeline: string;
  conditions: string;
  nextMove: string;
  privateNote: string;
  summary: string;
  sender: string;
  recipient: string;
  header: string;
};

function buildBloombergSummary(payload: Omit<BloombergMessagePayload, "summary">) {
  return [
    `TYPE: ${payload.messageType}`,
    `URGENCY: ${payload.urgency}`,
    `SUBJECT: ${payload.subject || "Not listed"}`,
    `SENDER: ${payload.sender || "Not listed"}`,
    `RECIPIENT: ${payload.recipient || "Not listed"}`,
    `HEADER: ${payload.header || "Not listed"}`,
    "",
    `MESSAGE: ${payload.body || "No message body provided."}`,
    "",
    `AMOUNT / BUDGET: ${payload.amount || "Not listed"}`,
    `TIMELINE: ${payload.timeline || "Not listed"}`,
    `CONDITIONS: ${payload.conditions || "Not listed"}`,
    `NEXT MOVE: ${payload.nextMove || "Not listed"}`,
    payload.privateNote ? `PRIVATE NOTE: ${payload.privateNote}` : "",
  ].filter(Boolean).join("\\n");
}

function BloombergMessageForm({
  sender,
  recipient,
  header,
  defaultSubject,
  submitLabel,
  defaultType,
  onSend,
  onCancel,
}: {
  sender: string;
  recipient: string;
  header: string;
  defaultSubject?: string;
  submitLabel: string;
  defaultType?: string;
  onSend: (payload: BloombergMessagePayload) => void;
  onCancel?: () => void;
}) {
  const [messageType, setMessageType] = useState(defaultType || "Request Update");
  const [urgency, setUrgency] = useState("Normal");
  const [subject, setSubject] = useState(defaultSubject || header || "");
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [conditions, setConditions] = useState("");
  const [nextMove, setNextMove] = useState("");
  const [privateNote, setPrivateNote] = useState("");

  function submit() {
    const base = {
      messageType,
      urgency,
      subject,
      body,
      amount,
      timeline,
      conditions,
      nextMove,
      privateNote,
      sender,
      recipient,
      header,
    };
    const summary = buildBloombergSummary(base);
    onSend({ ...base, summary });
    setBody("");
    setAmount("");
    setTimeline("");
    setConditions("");
    setNextMove("");
    setPrivateNote("");
  }

  return (
    <div style={{ ...panel, marginTop: 14 }}>
      <div style={eyebrow}>Bloomberg Message Ticket</div>
      <h3 style={h3}>{subject || "Structured Request Message"}</h3>

      <div style={{ ...grid, marginTop: 12 }}>
        <div style={panel}>
          <div style={eyebrow}>Sender</div>
          <p style={muted}>{sender || "Auto-filled sender"}</p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>Recipient</div>
          <p style={muted}>{recipient || "Auto-filled recipient"}</p>
        </div>
      </div>

      <div style={{ ...panel, marginTop: 12 }}>
        <div style={eyebrow}>Attached Header</div>
        <p style={sub}>{header || "Request/deal/pain context auto-attached"}</p>
      </div>

      <div style={{ ...grid, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Message Type</span>
          <select style={input} value={messageType} onChange={(event) => setMessageType(event.target.value)}>
            {["Message Owner", "Request Update", "Interested / Accept", "Submit Terms", "Pass", "Need Documents", "Release Contact Request", "Funding Offer", "Contractor Bid", "Title / Closing Update", "Owner Note", "Member Reply", "Investor Reply"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Urgency</span>
          <select style={input} value={urgency} onChange={(event) => setUrgency(event.target.value)}>
            {["Normal", "Time Sensitive", "Urgent", "Closing Risk"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Subject</span>
        <input style={input} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Auto-filled from request, editable..." />
      </label>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Message / Terms / Ask</span>
        <textarea style={{ ...input, minHeight: 120 }} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write the actual request, reply, terms, bid, question, or update..." />
      </label>

      <div style={{ ...grid, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Amount / Budget</span>
          <input style={input} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="$ amount, LTC/LTV, bid, budget..." />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={eyebrow}>Timeline</span>
          <input style={input} value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="Close date, response deadline, work start..." />
        </label>
      </div>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Conditions</span>
        <input style={input} value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder="Subject to docs, walkthrough, proof, title, underwriting..." />
      </label>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Best Next Move</span>
        <input style={input} value={nextMove} onChange={(event) => setNextMove(event.target.value)} placeholder="Schedule call, send docs, release contact, route to member..." />
      </label>

      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <span style={eyebrow}>Private Note</span>
        <input style={input} value={privateNote} onChange={(event) => setPrivateNote(event.target.value)} placeholder="Internal note, caution, context. Saved inside structured message." />
      </label>

      <VaultForgeAISnapshot kind={kind} item={item} />

        <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn} onClick={submit}>{submitLabel}</button>
        {onCancel ? <button type="button" style={btn} onClick={onCancel}>Collapse / Done</button> : null}
      </div>
    </div>
  );
}



const MOCK_MEMBER_PAYMENT_KEY = "vaultforge_mock_member_payment_v1";
const MOCK_INVESTOR_PAYMENT_KEY = "vaultforge_mock_investor_payment_v1";
const MOCK_APPROVALS_KEY = "vaultforge_mock_access_approvals_v1";

function mockAccessRecord(email: string, kind: "member" | "investor") {
  const approvals = readJson<Record<string, any>>(MOCK_APPROVALS_KEY, {});
  const key = `${kind}:${String(email || "").toLowerCase()}`;
  return approvals[key] || {};
}

function setMockAccessRecord(email: string, kind: "member" | "investor", patch: any) {
  const approvals = readJson<Record<string, any>>(MOCK_APPROVALS_KEY, {});
  const key = `${kind}:${String(email || "").toLowerCase()}`;
  approvals[key] = { ...(approvals[key] || {}), ...patch, updatedAt: new Date().toISOString() };
  writeJson(MOCK_APPROVALS_KEY, approvals);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("vaultforge-mock-access-change"));
    window.dispatchEvent(new Event("vaultforge-access-change"));
  }
}

function paymentStatusFor(email: string, kind: "member" | "investor") {
  const record = mockAccessRecord(email, kind);
  const paymentKey = kind === "member" ? MOCK_MEMBER_PAYMENT_KEY : MOCK_INVESTOR_PAYMENT_KEY;
  const direct = readJson<any>(paymentKey, {});
  return {
    approved: Boolean(
      record.approved ||
      record.adminApproved ||
      record.approvedForPayment ||
      record.paymentStatus === "ready" ||
      record.accessStatus === "payment_ready" ||
      direct.approved ||
      direct.approvedForPayment ||
      direct.paymentStatus === "ready" ||
      direct.accessStatus === "payment_ready"
    ),
    paid: Boolean(record.paid || record.paymentStatus === "paid" || direct.paid || direct.paymentStatus === "paid"),
    unlocked: Boolean(record.unlocked || record.accessStatus === "active" || direct.unlocked || direct.accessStatus === "active"),
  };
}

function MockPaymentButton({
  kind,
  email,
  label,
  price,
}: {
  kind: "member" | "investor";
  email: string;
  label: string;
  price: string;
}) {
  const [tick, setTick] = useState(0);
  const status = paymentStatusFor(email, kind);
  const ownerBypass = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const canPay = status.approved || ownerBypass;
  const unlocked = status.paid || status.unlocked;

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-mock-access-change", refresh);
    window.addEventListener("vaultforge-access-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-mock-access-change", refresh);
      window.removeEventListener("vaultforge-access-change", refresh);
    };
  }, []);

  return (
    <section className={canPay && !unlocked ? "vf-pulse" : ""} style={canPay && !unlocked ? goldPanel : panel}>
      <div style={eyebrow}>{label}</div>
      <h2 style={h2}>{unlocked ? "Room Unlocked" : canPay ? "PAYMENT READY — CLICK MOCK PAY" : "LOCKED — Waiting On Owner Approval"}</h2>
      <div style={{ ...panel, marginTop: 10, borderColor: canPay && !unlocked ? "rgba(255,220,104,.92)" : "rgba(255,70,70,.42)" }}>
        <div style={eyebrow}>{unlocked ? "Access Active" : canPay ? ownerBypass ? "Owner/Test Bypass — Payment Available" : "Owner Approved — Payment Available" : "Locked Preview"}</div>
        <p style={muted}>{unlocked ? "This room is unlocked." : canPay ? "This card should be visibly pulsing. Click Mock Pay to unlock for testing." : "Regular users should see this locked until admin approval."}</p>
      </div>
      <p style={{ ...sub, marginTop: 12 }}>
        {unlocked
          ? "Mock payment is complete. This room is unlocked for testing."
          : canPay
            ? `${price} mock payment is ready. Click to unlock this room for testing.`
            : "Submit profile and wait for admin approval. This room remains locked until approval and payment."}
      </p>
      <div style={{ ...row, marginTop: 14 }}>
        <button
          type="button"
          style={canPay ? goldBtn : btn}
          disabled={!canPay || unlocked}
          onClick={() => {
            setMockAccessRecord(email, kind, {
              approved: true,
              paid: true,
              unlocked: true,
              paymentStatus: "paid",
              accessStatus: "active",
            });
            const paymentKey = kind === "member" ? MOCK_MEMBER_PAYMENT_KEY : MOCK_INVESTOR_PAYMENT_KEY;
            writeJson(paymentKey, {
              email,
              paid: true,
              unlocked: true,
              paymentStatus: "paid",
              accessStatus: "active",
              paidAt: new Date().toISOString(),
            });
            setTick((value) => value + 1);
          }}
        >
          {unlocked ? "Paid / Unlocked" : canPay ? `Mock Pay ${price}` : "Locked Until Approved"}
        </button>

        <button
          type="button"
          style={btn}
          onClick={() => {
            setMockAccessRecord(email, kind, {
              approved: true,
              adminApproved: true,
              paymentStatus: "ready",
              accessStatus: "payment_ready",
            });
            setTick((value) => value + 1);
          }}
        >
          Test Approve
        </button>
      </div>
      <p style={muted}>Test mode only. This does not touch Stripe, auth, middleware, or billing.</p>
    </section>
  );
}


function LogoBlock() {
  const [index, setIndex] = useState(0);
  const src = LOGOS[index];

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}
    >
      <div
        style={{
          width: "min(420px,88vw)",
          border: "1px solid rgba(245,197,66,.28)",
          borderRadius: 26,
          padding: 16,
          background: "#070b14",
        }}
      >
        {src ? (
          <img
            src={src}
            alt="VaultForge"
            style={{ width: "100%", display: "block", borderRadius: 16 }}
            onError={() =>
              setIndex((value) =>
                value + 1 < LOGOS.length ? value + 1 : LOGOS.length,
              )
            }
          />
        ) : (
          <div
            style={{
              minHeight: 150,
              display: "grid",
              placeItems: "center",
              color: "#ffd45a",
              fontSize: 52,
              fontWeight: 950,
            }}
          >
            VAULTFORGE
          </div>
        )}
      </div>
    </div>
  );
}

function logoutInvestor() {
  try {
    localStorage.removeItem("vaultforge_investor_session_v1");
    localStorage.removeItem("vaultforge_investor_email");
    localStorage.removeItem("vaultforge_investor_login_v1");
    window.dispatchEvent(new Event("vaultforge-investor-change"));
  } catch {
    // Ignore browser storage errors.
  }

  window.location.href = "/investor-login";
}

function TopNav({
  onMessageOwner,
  isOwner,
}: {
  onMessageOwner: () => void;
  isOwner: boolean;
}) {
  return (
    <div style={{ ...row, justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ color: "#ffd45a", fontSize: 26, fontWeight: 950 }}>
        VAULTFORGE
      </div>
      <div style={row}>
        <Link href="/" style={btn}>
          Home
        </Link>
        <Link href="/investor-access" style={btn}>
          Investor Access
        </Link>
        <Link href="/investor-payment" style={btn}>
          Payment
        </Link>
        <button type="button" style={goldBtn} onClick={onMessageOwner}>
          Message Owner
        </button>
        <button type="button" style={btn} onClick={logoutInvestor}>
          Logout
        </button>
        <Link href="/admin" style={redBtn}>
          Owner
        </Link>
      </div>
    </div>
  );
}

function TickerRibbon() {
  return (
    <div style={tickerWrap}>
      <div style={tickerTrack}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
          <div
            key={`${item}-${index}`}
            style={{
              whiteSpace: "nowrap",
              color: "#ffd45a",
              fontWeight: 950,
              letterSpacing: 3,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function profileScore(investor: any) {
  const fields = [
    investor?.photoUrl,
    investor?.contactName,
    investor?.company,
    investor?.email,
    investor?.phone,
    investor?.investorTypes?.length,
    investor?.buyingStrategies?.length,
    investor?.assetTypes?.length,
    investor?.statesInterested?.length,
    investor?.minDeal,
    investor?.maxDeal,
    investor?.monthlyVolume,
    investor?.yearlyVolume,
    investor?.closeSpeed,
    investor?.proofFunds,
    investor?.directBuyer,
    investor?.fundingNeeded,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.min(100, Math.round((filled / fields.length) * 100));
}

function IntelligencePanel({ investor }: { investor: any }) {
  const score = profileScore(investor);
  const blurb = INTELLIGENCE_BLURBS[score % INTELLIGENCE_BLURBS.length];

  return (
    <section style={goldPanel}>
      <div style={eyebrow}>VaultForge Intelligence</div>
      <h2 style={h2}>{score}% Profile Signal</h2>
      <p style={sub}>{blurb}</p>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
          marginTop: 14,
        }}
      >
        <div
          style={{ height: "100%", width: `${score}%`, background: "#ffdc68" }}
        />
      </div>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href="/investor-application" style={goldBtn}>
          Improve Investor Profile
        </Link>
      </div>
    </section>
  );
}


function updateStoredRequestStatus(requestId: string, nextStatus: string) {
  const keys = [
    "vaultforge_requests_v1",
    "vaultforge_owner_direct_messages_v1",
    "vaultforge_admin_investor_inbox_v1",
    "vaultforge_investor_requests_v1",
    "vaultforge_investor_execution_requests_v1",
  ];

  keys.forEach((key) => {
    const rows = readJson<any[]>(key, []);
    if (!Array.isArray(rows)) return;

    const nextRows = rows.map((row) => {
      if (String(row?.id || "") !== String(requestId || "")) return row;
      return {
        ...row,
        status: nextStatus,
        folder: nextStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    writeJson(key, nextRows);
  });

  window.dispatchEvent(new Event("vaultforge-request-change"));
  window.dispatchEvent(new Event("vaultforge-owner-message-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-inbox-change"));
}

function deleteStoredRequestForever(requestId: string) {
  const keys = [
    "vaultforge_requests_v1",
    "vaultforge_owner_direct_messages_v1",
    "vaultforge_admin_investor_inbox_v1",
    "vaultforge_investor_requests_v1",
    "vaultforge_investor_execution_requests_v1",
  ];

  keys.forEach((key) => {
    const rows = readJson<any[]>(key, []);
    if (!Array.isArray(rows)) return;
    writeJson(
      key,
      rows.filter((row) => String(row?.id || "") !== String(requestId || "")),
    );
  });

  window.dispatchEvent(new Event("vaultforge-request-change"));
  window.dispatchEvent(new Event("vaultforge-owner-message-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-inbox-change"));
}


function RequestPipeline() {
  return (
    <section style={panel}>
      <div style={eyebrow}>Request Pipeline</div>
      <div style={grid}>
        <div style={panel}>
          <div style={eyebrow}>01 Submitted</div>
          <p style={muted}>
            Investor request is captured with profile attached.
          </p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>02 Routed</div>
          <p style={muted}>
            VaultForge routes internally without exposing member directory.
          </p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>03 Reviewed</div>
          <p style={muted}>
            Owner/member reviews investor fit and request context.
          </p>
        </div>
        <div style={panel}>
          <div style={eyebrow}>04 Approved</div>
          <p style={muted}>
            Contact or deeper access can be shared only after approval.
          </p>
        </div>
      </div>
    </section>
  );
}

function UrgencyBadges({ kind }: { kind: Kind }) {
  const badges =
    kind === "Deal"
      ? [
          "OFF MARKET",
          "ARV SIGNAL",
          "FUNDING AVAILABLE",
          "EXECUTION NETWORK",
          "REQUEST CONTROLLED",
        ]
      : [
          "DISTRESS",
          "CAPITAL GAP",
          "OPERATOR NEEDED",
          "URGENT SIGNAL",
          "PRIVATE ROUTING",
        ];

  return (
    <div style={{ ...row, marginTop: 10 }}>
      {badges.map((badge) => (
        <span
          key={badge}
          style={{
            border: "1px solid rgba(245,197,66,.32)",
            borderRadius: 999,
            padding: "8px 11px",
            color: "#ffd45a",
            background: "rgba(245,197,66,.07)",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function InvestorIdentityCard({
  investor,
  onMessageOwner,
}: {
  investor: any;
  onMessageOwner: () => void;
}) {
  const score = typeof profileScore === "function" ? profileScore(investor) : 0;
  const email = String(
    investor?.email || browserValue("vaultforge_investor_email") || "",
  ).toLowerCase();
  const isOwner = email === OWNER_EMAIL;

  return (
    <section style={{ ...goldPanel, marginBottom: 18 }}>
      <div
        style={{
          ...row,
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ ...row, alignItems: "flex-start" }}>
          {investor?.photoUrl ? (
            <img
              src={investor.photoUrl}
              alt="Investor profile"
              style={{
                width: 96,
                height: 96,
                objectFit: "cover",
                borderRadius: 24,
                border: "1px solid rgba(245,197,66,.45)",
                boxShadow: "0 0 26px rgba(245,197,66,.12)",
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                border: "1px solid rgba(245,197,66,.35)",
                display: "grid",
                placeItems: "center",
                color: "#ffd45a",
                fontWeight: 950,
                background: "#080d19",
              }}
            >
              VF
            </div>
          )}

          <div>
            <div style={eyebrow}>Logged In Investor</div>
            <h2 style={h2}>
              {investor?.contactName || investor?.company || "Investor Profile"}
            </h2>
            <p style={sub}>{investor?.company || "Company not listed"}</p>
            <p style={muted}>{email || "Investor email not detected"}</p>
            <p style={muted}>
              Access: {investor?.accessStatus || investor?.access || "locked"} •
              Payment: {investor?.paymentStatus || "unpaid"} • Status:{" "}
              {investor?.status || "pending"}
            </p>
            <p style={muted}>Profile Intelligence: {score}% complete</p>
            {isOwner ? (
              <p style={muted}>Owner/admin identity detected.</p>
            ) : null}
          </div>
        </div>

        <div style={row}>
          <Link href="/investor-application" style={goldBtn}>
            Profile
          </Link>
          <Link href="/investor-payment" style={btn}>
            Payment
          </Link>
          <button type="button" style={btn} onClick={onMessageOwner}>
            Message Owner
          </button>
          <button type="button" style={btn} onClick={logoutInvestor}>
            Logout
          </button>
          {isOwner ? (
            <Link href="/admin" style={redBtn}>
              Owner
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({
  title,
  count,
  note,
  active,
  pulse,
  onClick,
}: {
  title: string;
  count: number | string;
  note: string;
  active?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={pulse ? 'vf-pulse' : ''}
      style={{
        ...(active || pulse ? goldPanel : panel),
        width: "100%",
        textAlign: "left",
      }}
      onClick={onClick}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function MiniValues({ item }: { item: any }) {
  const city = item?.city || item?.market || item?.area || "Market not listed";
  const asset =
    item?.assetType || item?.asset_type || item?.type || "Asset not listed";
  const price =
    item?.askingPrice ||
    item?.asking_price ||
    item?.price ||
    item?.amount ||
    "Not listed";
  const repairs =
    item?.repairs ||
    item?.repairEstimate ||
    item?.repair_estimate ||
    "Not listed";
  const arv =
    item?.arv ||
    item?.afterRepairValue ||
    item?.after_repair_value ||
    "Not listed";

  return (
    <>
      <p style={sub}>
        {city} • {asset}
      </p>
      <div style={{ marginTop: 14 }}>
        <div style={eyebrow}>Asking / Need</div>
        <p style={muted}>{String(price)}</p>
        <div style={eyebrow}>Repairs</div>
        <p style={muted}>{String(repairs)}</p>
        <div style={eyebrow}>ARV / Value</div>
        <p style={muted}>{String(arv)}</p>
      </div>
    </>
  );
}


function saveSimpleControlledRequest(payload: {
  kind: Kind;
  item: any;
  action: string;
  name: string;
  email: string;
  phone: string;
  contactMethod: string;
  message: string;
}) {
  const investor = readInvestor();
  const profile = investorProfileSnapshot(investor);
  const title = itemTitle(payload.item, payload.kind);
  const state = itemState(payload.item);
  const city = clean(payload.item?.city || payload.item?.market || payload.item?.area || "Market not listed");
  const now = new Date().toISOString();

  const request = compactStorageRow({
    id: `vf-request-${Date.now()}`,
    type: "controlled_request",
    source: "owner-direct-message",
    status: "new",
    action: payload.action,
    buttonClicked: payload.action,
    kind: payload.kind,
    itemId: itemId(payload.item, payload.kind),
    title,
    requestTitle: `${payload.action} - ${payload.kind}`,
    subject: `${payload.action} - ${title}`,
    state,
    city,
    roomHeader: `${payload.kind} • ${title} • ${city}, ${state || "NA"}`,
    name: payload.name || profile.contactName || "",
    email: payload.email || profile.email || "",
    phone: payload.phone || profile.phone || "",
    contactMethod: payload.contactMethod,
    body: payload.message || `${payload.action} message submitted.`,
    message: payload.message || `${payload.action} message submitted.`,
    investorEmail: payload.email || profile.email || "",
    investorCompany: profile.company || "",
    investorName: payload.name || profile.contactName || "",
    investorPhotoUrl: profile.photoUrl || "",
    investorProfile: compactInvestorProfile(profile),
    createdAt: now,
    updatedAt: now,
  });

  const requests = readJson<any[]>(SIMPLE_REQUESTS_KEY, []);
  writeJson(SIMPLE_REQUESTS_KEY, [request, ...requests].slice(0, 120));

  const ownerMessages = readJson<any[]>(OWNER_DIRECT_MESSAGES_KEY, []);
  writeJson(OWNER_DIRECT_MESSAGES_KEY, [request, ...ownerMessages].slice(0, 120));

  const adminInbox = readJson<any[]>(ADMIN_INBOX_KEY, []);
  writeJson(ADMIN_INBOX_KEY, [request, ...adminInbox].slice(0, 120));

  window.dispatchEvent(new Event("vaultforge-request-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-inbox-change"));
  window.dispatchEvent(new Event("vaultforge-admin-message-change"));
  window.dispatchEvent(new Event("vaultforge-owner-message-change"));
  return request;
}

function SimpleRequestModal({
  open,
  kind,
  item,
  action,
  onClose,
}: {
  open: boolean;
  kind: Kind;
  item: any;
  action: string;
  onClose: () => void;
}) {
  const investor = readInvestor();
  const profile = investorProfileSnapshot(investor);
  const [name, setName] = useState(profile.contactName || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [contactMethod, setContactMethod] = useState("VaultForge message");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  if (!open) return null;

  const title = itemTitle(item, kind);
  const state = itemState(item);
  const city = clean(item?.city || item?.market || item?.area || "Market not listed");

  function submit() {
    try {
      if (!String(email || "").trim()) throw new Error("Email is required.");
      saveSimpleControlledRequest({ kind, item, action, name, email, phone, contactMethod, message });
      setNotice("Message sent directly to owner.");
    } catch (error: any) {
      setNotice(error?.message || "Request could not be saved.");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.78)", padding: 18, overflow: "auto" }}>
      <div style={{ maxWidth: 760, margin: "40px auto", ...goldPanel }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div>
            <div style={eyebrow}>Owner Direct Message</div>
            <h2 style={h2}>{action}</h2>
          </div>
          <button type="button" style={btn} onClick={onClose}>Close</button>
        </div>

        <div style={{ ...panel, marginTop: 14 }}>
          <div style={eyebrow}>Attached Room</div>
          <p style={sub}>{kind} • {title}</p>
          <p style={muted}>{city}, {state || "NA"}</p>
        </div>

        <div style={{ ...grid, marginTop: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={eyebrow}>Name</span>
            <input style={input} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={eyebrow}>Email</span>
            <input style={input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={eyebrow}>Phone</span>
            <input style={input} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Your phone" />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={eyebrow}>Best Contact</span>
            <select style={input} value={contactMethod} onChange={(event) => setContactMethod(event.target.value)}>
              <option>VaultForge message</option>
              <option>Phone</option>
              <option>Email</option>
              <option>Text</option>
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
          <span style={eyebrow}>Message</span>
          <textarea style={{ ...input, minHeight: 130 }} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What do you want the owner to know?" />
        </label>

        <div style={{ ...row, marginTop: 16 }}>
          <button type="button" style={goldBtn} onClick={submit}>Send To Owner</button>
          <button type="button" style={btn} onClick={onClose}>Cancel</button>
        </div>

        {notice ? <p style={{ ...sub, marginTop: 14, color: notice.includes("sent") ? "#9effb2" : "#ffaaaa" }}>{notice}</p> : null}
      </div>
    </div>
  );
}



function vfNum(value: any) {
  const m = String(value || "").replace(/[$,\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function vfPick(item: any, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = key.split(".").reduce((acc: any, part) => acc?.[part], item);
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function vfText(item: any) {
  return [
    item?.title,
    item?.headline,
    item?.summary,
    item?.notes,
    item?.description,
    item?.assetType,
    item?.propertyType,
    item?.need,
    item?.urgency,
    item?.timeline,
    item?.city,
    item?.state,
  ].map((x) => String(x || "").toLowerCase()).join(" ");
}

function vaultForgeAI(kind: Kind, item: any) {
  const text = vfText(item);
  const asking = vfNum(vfPick(item, ["askingPrice", "asking_price", "asking", "price", "purchasePrice", "amount"]));
  const repairs = vfNum(vfPick(item, ["repairs", "repairEstimate", "repair_estimate", "fixAmount", "rehab", "rehabBudget"]));
  const arv = vfNum(vfPick(item, ["arv", "afterRepairValue", "after_repair_value", "value", "projectedValue"]));
  const spread = arv && asking ? arv - asking - repairs : 0;
  const spreadPct = arv ? Math.round((spread / arv) * 100) : 0;

  let score = 60;
  let urgency = 4;
  let risk = 4;
  let difficulty = 4;
  let capitalNeed = 4;
  let bottleneck = "Missing information";
  let bestFit = "Owner/member review";
  let nextMove = "Request more details";
  let market = "Normal";

  if (kind === "Deal") {
    if (spreadPct >= 25) score += 20;
    else if (spreadPct >= 15) score += 12;
    else if (spreadPct <= 5 && arv) score -= 18;

    if (repairs > 75000) difficulty += 3;
    if (repairs > 25000) capitalNeed += 2;
    if (asking > 300000) capitalNeed += 2;
    if (/commercial|land|development|entitlement/.test(text)) difficulty += 2;
    if (/urgent|fast|closing|deadline/.test(text)) urgency += 3;

    if (/contractor|rehab|scope|construction/.test(text)) bottleneck = "Contractor / scope control";
    else if (/capital|funding|lender|loan/.test(text)) bottleneck = "Capital stack";
    else if (/title|closing|escrow/.test(text)) bottleneck = "Title / closing";
    else bottleneck = "Number verification";

    if (/land|development|entitlement/.test(text)) {
      bestFit = "Developer + equity partner";
      nextMove = "Request zoning, entitlement status, survey, and capital need";
    } else if (repairs > 50000) {
      bestFit = "Operator + contractor + private lender";
      nextMove = "Request rehab scope, bid, photos, and lender route";
    } else if (spreadPct >= 18) {
      bestFit = "Cash buyer + private lender";
      nextMove = "Request underwriting package and owner/member release";
    } else {
      bestFit = "Acquisitions reviewer";
      nextMove = "Verify price, ARV, repairs, access, and seller path";
    }

    risk = Math.min(10, Math.max(2, difficulty + (spreadPct <= 8 && arv ? 2 : 0)));
    market = spreadPct >= 18 ? "Strong" : spreadPct >= 8 ? "Watch" : "Needs verification";
  } else {
    urgency = /urgent|emergency|closing|deadline|same day|72/.test(text) ? 9 : 5;

    if (/capital|funding|lender|loan|gap/.test(text)) {
      bottleneck = "Funding gap";
      bestFit = "Private lender / JV capital";
      nextMove = "Request amount, deadline, collateral, docs, and exit strategy";
      capitalNeed = 8;
    } else if (/contractor|rehab|construction|stalled/.test(text)) {
      bottleneck = "Execution labor";
      bestFit = "Contractor / operator";
      nextMove = "Request scope, access, photos, bid deadline, and permit status";
      difficulty = 7;
    } else if (/title|legal|closing|escrow/.test(text)) {
      bottleneck = "Title / legal blocker";
      bestFit = "Title / attorney / closing specialist";
      nextMove = "Request issue summary, title docs, and closing date";
      difficulty = 6;
    } else if (/operator|boots|ground|site/.test(text)) {
      bottleneck = "Local execution";
      bestFit = "Operator / boots-on-ground";
      nextMove = "Request exact site task, deadline, photos, and compensation";
      difficulty = 6;
    } else {
      bottleneck = "Problem classification";
      bestFit = "Owner review + routed member";
      nextMove = "Classify the problem and choose the correct execution lane";
    }

    risk = Math.min(10, Math.max(4, urgency - 1));
    score = Math.min(96, 48 + urgency * 4 + difficulty);
    market = urgency >= 8 ? "Pressure" : "Developing";
  }

  return {
    score: Math.min(98, Math.max(12, score)),
    label: score >= 78 ? "HIGH" : score >= 55 ? "MEDIUM" : "LOW",
    urgency: Math.min(10, Math.max(1, urgency)),
    risk: Math.min(10, Math.max(1, risk)),
    riskLabel: risk >= 8 ? "HIGH" : risk >= 5 ? "MEDIUM" : "LOW",
    difficulty: Math.min(10, Math.max(1, difficulty)),
    capitalNeed: Math.min(10, Math.max(1, capitalNeed)),
    bottleneck,
    bestFit,
    nextMove,
    market,
    spread,
    spreadPct,
  };
}

function VaultForgeAISnapshot({ kind, item }: { kind: Kind; item: any }) {
  const ai = vaultForgeAI(kind, item);
  return (
    <div style={{ ...goldPanel, marginTop: 14 }}>
      <div style={eyebrow}>Live AI Snapshot</div>
      <h3 style={h3}>{ai.label} execution probability</h3>

      <div style={grid}>
        <div style={panel}><div style={eyebrow}>Execution Score</div><p style={sub}>{ai.score}/100</p></div>
        <div style={panel}><div style={eyebrow}>Urgency</div><p style={sub}>{ai.urgency}/10</p></div>
        <div style={panel}><div style={eyebrow}>Risk</div><p style={sub}>{ai.riskLabel}</p></div>
        <div style={panel}><div style={eyebrow}>Capital Need</div><p style={sub}>{ai.capitalNeed}/10</p></div>
      </div>

      <div style={{ ...grid, marginTop: 12 }}>
        <div style={panel}><div style={eyebrow}>Likely Bottleneck</div><p style={muted}>{ai.bottleneck}</p></div>
        <div style={panel}><div style={eyebrow}>Best Fit</div><p style={muted}>{ai.bestFit}</p></div>
        <div style={panel}><div style={eyebrow}>Market Signal</div><p style={muted}>{ai.market}</p></div>
        <div style={panel}><div style={eyebrow}>Difficulty</div><p style={muted}>{ai.difficulty}/10</p></div>
      </div>

      {kind === "Deal" && ai.spread ? (
        <div style={{ ...panel, marginTop: 12 }}>
          <div style={eyebrow}>Deal Spread Read</div>
          <p style={muted}>Estimated spread after repairs: ${Math.round(ai.spread).toLocaleString()} ({ai.spreadPct}% of ARV).</p>
        </div>
      ) : null}

      <div style={{ ...panel, marginTop: 12, borderColor: "rgba(48,255,135,.35)" }}>
        <div style={eyebrow}>AI Recommended Next Move</div>
        <p style={sub}>{ai.nextMove}</p>
      </div>
    </div>
  );
}

function VaultForgeAICommandBrief({ deals, pains, requests }: { deals: any[]; pains: any[]; requests: any[] }) {
  const strongDeals = deals.filter((item) => vaultForgeAI("Deal", item).score >= 78).length;
  const urgentPain = pains.filter((item) => vaultForgeAI("Pain", item).urgency >= 8).length;
  const openRequests = requests.filter((item) => !String(item?.status || item?.folder || "").toLowerCase().includes("archived") && !String(item?.status || item?.folder || "").toLowerCase().includes("deleted")).length;

  return (
    <section style={goldPanel}>
      <div style={eyebrow}>Live AI Command Brief</div>
      <h2 style={h2}>Investor Room intelligence is active.</h2>
      <div style={grid}>
        <div style={panel}><div style={eyebrow}>Live Signals</div><p style={sub}>{deals.length + pains.length}</p></div>
        <div style={panel}><div style={eyebrow}>Strong Deals</div><p style={sub}>{strongDeals}</p></div>
        <div style={panel}><div style={eyebrow}>Urgent Pain</div><p style={sub}>{urgentPain}</p></div>
        <div style={panel}><div style={eyebrow}>Open Requests</div><p style={sub}>{openRequests}</p></div>
      </div>
      <div style={{ ...panel, marginTop: 12, borderColor: "rgba(48,255,135,.35)" }}>
        <div style={eyebrow}>AI Next Move</div>
        <p style={sub}>
          {urgentPain
            ? "Prioritize urgent Pain signals. Route capital, contractor, or operator help before pressure turns into loss."
            : strongDeals
              ? "Review the strongest Deal signals and request missing owner/member details."
              : openRequests
                ? "Work open requests and push replies toward execution."
                : "Open a Deal or Pain signal and let VaultForge classify the best execution lane."}
        </p>
      </div>
    </section>
  );
}

function RoomCard({
  kind,
  item,
  isOpen,
  onOpen,
  onClose,
  onMove,
  onRestore,
  onDeleteForever,
}: {
  kind: Kind;
  item: any;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onMove: (folder: Folder) => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) {
  const folder = getFolder(item, kind);
  const wrapper =
    folder === "deleted" ? redPanel : folder === "saved" ? goldPanel : panel;
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [simpleAction, setSimpleAction] = useState("");
  const header = `${kind} Request • ${itemTitle(item, kind)} • ${itemState(item) || "Unknown State"}`;

  return (
    <div style={isOpen ? goldPanel : wrapper}>
      <SimpleRequestModal open={Boolean(simpleAction)} kind={kind} item={item} action={simpleAction} onClose={() => setSimpleAction("")} />
      <div style={eyebrow}>
        {kind} • {itemState(item) || "NA"}{" "}
        {folder !== "active" ? `• ${folder}` : ""}
      </div>
      <h2 style={h2}>{itemTitle(item, kind)}</h2>
      <MiniValues item={item} />
      <p style={{ ...muted, marginTop: 14 }}>
        Member information, seller information, private notes, routing notes,
        and contact details are hidden until deeper access is approved.
      </p>

      <div style={{ ...row, marginTop: 14 }}>
        <button
          type="button"
          style={goldBtn}
          onClick={isOpen ? onClose : onOpen}
        >
          {isOpen ? "Collapse / Done" : "Open Details"}
        </button>

        {kind === "Deal" ? (
          <>
            <button type="button" style={goldBtn} onClick={() => setSimpleAction("Message Owner")}>Message Owner</button>
            <button type="button" style={btn} onClick={() => setSimpleAction("Interested")}>Interested</button>
            <button type="button" style={btn} onClick={() => setSimpleAction("Ask About Funding")}>Ask About Funding</button>
            <button type="button" style={btn} onClick={() => setSimpleAction("Partner / JV")}>Partner / JV</button>
          </>
        ) : (
          <>
            <button type="button" style={goldBtn} onClick={() => setSimpleAction("Message Owner")}>Message Owner</button>
            <button type="button" style={btn} onClick={() => setSimpleAction("Request Details")}>Request Details</button>
            <button type="button" style={btn} onClick={() => setSimpleAction("Funding Available")}>Funding Available</button>
            <button type="button" style={btn} onClick={() => setSimpleAction("Operator Available")}>Operator Available</button>
          </>
        )}

        <button type="button" style={btn} onClick={() => setSimpleAction("General Owner Message")}>General Owner Message</button>

        <button type="button" style={btn} onClick={() => onMove("saved")}>
          Save
        </button>
        <button type="button" style={btn} onClick={() => onMove("archived")}>
          Archive
        </button>
        <button type="button" style={redBtn} onClick={() => onMove("deleted")}>
          Delete
        </button>
        {folder !== "active" ? (
          <button type="button" style={btn} onClick={onRestore}>
            Restore
          </button>
        ) : null}
        {folder === "deleted" ? (
          <button type="button" style={redBtn} onClick={onDeleteForever}>
            Delete Forever
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div style={{ ...panel, marginTop: 16 }}>
          <div style={eyebrow}>Room Detail Open</div>
          <p style={sub}>{header}</p>
          <p style={muted}>
            This detail is expanded inside the same card. Collapse / Done closes
            it without moving the card list.
          </p>

          <div style={{ ...panel, marginTop: 14 }}>
            <div style={eyebrow}>Private Data Hidden</div>
            <p style={muted}>
              This investor lane does not expose member name, member phone,
              member email, seller info, exact private notes, docs, routing
              notes, or full room intelligence.
            </p>
          </div>

          <BloombergMessageForm
            sender={readInvestor()?.email || "Investor"}
            recipient="Designated Member Lane"
            header={header}
            defaultSubject={`${kind} Request - ${itemTitle(item, kind)}`}
            defaultType="Message Owner"
            submitLabel="Send Request Through VaultForge"
            onSend={(payload) => {
              setMessage(payload.summary);
              sendRequest(kind, item, payload.summary);
              setSent(true);
            }}
          />

          <div style={{ ...row, marginTop: 12 }}>
            <button type="button" style={btn} onClick={() => onMove("saved")}>
              Save
            </button>
            <button
              type="button"
              style={btn}
              onClick={() => onMove("archived")}
            >
              Archive
            </button>
            <button
              type="button"
              style={redBtn}
              onClick={() => onMove("deleted")}
            >
              Delete
            </button>
            <button type="button" style={btn} onClick={onClose}>
              Collapse / Done
            </button>
          </div>

          {sent ? (
            <p style={muted}>
              Request sent to VaultForge owner/member workflow.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MessageOwnerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(0,0,0,.78)",
        padding: 18,
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 820, margin: "40px auto", ...goldPanel }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div>
            <div style={eyebrow}>Investor Message Owner</div>
            <h2 style={h2}>Contact VaultForge Owner</h2>
          </div>
          <button type="button" style={btn} onClick={onClose}>
            Close
          </button>
        </div>

        <p style={sub}>
          Your investor profile is attached so admin can see who is asking.
        </p>

        <BloombergMessageForm
          sender={readInvestor()?.email || "Investor"}
          recipient="VaultForge Owner"
          header="Investor Message Owner"
          defaultSubject={subject || "Investor message to admin"}
          defaultType="Owner Note"
          submitLabel="Send Message Owner"
          onCancel={onClose}
          onSend={(payload) => {
            saveInvestorOwnerMessage(payload.subject, payload.summary || payload.body || "Investor requested admin support.");
            setSent(true);
            setSubject("");
            setBody("");
          }}
        />

        {sent ? (
          <p style={{ ...sub, marginTop: 14 }}>
            Message sent to VaultForge admin.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ExecutionRequestModal({
  lane,
  activeRoom,
  onClose,
}: {
  lane: any;
  activeRoom: ActiveRoom;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const [sendNotice, setSendNotice] = useState("");
  const [sendError, setSendError] = useState("");

  if (!lane) return null;

  const kind: Kind = activeRoom?.kind || "Deal";
  const item = activeRoom?.item || {
    title: "General Investor Execution Request",
    state: "NA",
  };
  const header = activeRoom
    ? `${lane.title} - ${kind} - ${itemTitle(item, kind)} - ${itemState(item) || "Unknown State"}`
    : `${lane.title} - General Investor Execution Request`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,.78)",
        padding: 18,
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 880, margin: "40px auto", ...goldPanel }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div>
            <div style={eyebrow}>Execution Request</div>
            <h2 style={h2}>{lane.title}</h2>
          </div>
          <button type="button" style={btn} onClick={onClose}>
            Close
          </button>
        </div>

        <p style={sub}>{header}</p>
        <p style={muted}>{lane.note}</p>

        <div style={{ ...panel, marginTop: 16 }}>
          <div style={eyebrow}>Controlled Routing</div>
          <p style={muted}>
            This does not expose the member directory. VaultForge sends your request directly to the designated member lane with your investor profile attached.
          </p>
        </div>

        <BloombergMessageForm
          sender={readInvestor()?.email || "Investor"}
          recipient="Designated Member Lane"
          header={header}
          defaultSubject={lane.title}
          defaultType="Message Owner"
          submitLabel="Send Execution Request"
          onCancel={onClose}
          onSend={(payload) => {
            setSendNotice("");
            setSendError("");
            setNotes(payload.summary);
            const result = saveExecutionRequest(kind, item, lane, payload.summary);
            if (result.ok) {
              setSent(true);
              setSendNotice(result.message);
              window.alert(result.message);
            } else {
              setSent(false);
              setSendError(result.message);
              window.alert(result.message);
            }
          }}
        />

        {sendNotice ? (
          <p style={{ ...sub, marginTop: 14, color: "#9effb2" }}>
            {sendNotice}
          </p>
        ) : null}
        {sendError ? (
          <p style={{ ...sub, marginTop: 14, color: "#ffaaaa" }}>{sendError}</p>
        ) : null}
        {sent && !sendNotice ? (
          <p style={{ ...sub, marginTop: 14 }}>
            Execution request sent to VaultForge routing.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ExecutionLaneCards({
  activeRoom,
  onSelect,
}: {
  activeRoom: ActiveRoom;
  onSelect: (lane: any) => void;
}) {
  return (
    <section style={{ ...hero, marginTop: 18 }}>
      <div style={eyebrow}>One-Stop-Shop Execution Requests</div>
      <h2 style={h2}>Need help completing this opportunity?</h2>
      <p style={sub}>
        Request funding, title, contractor, operator, insurance, property
        management, JV, or boots-on-ground support without exposing private
        member data. Open a Deal/Pain card first to attach the request to that
        room, or send a general execution request.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        {EXECUTION_LANES.map((lane) => (
          <button
            key={lane.key}
            type="button"
            style={panel}
            onClick={() => onSelect(lane)}
          >
            <div style={eyebrow}>{lane.title}</div>
            <p style={muted}>{lane.note}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function requestStatus(row: any) {
  return (
    String(row?.status || "new")
      .trim()
      .toLowerCase() || "new"
  );
}

function statusCount(rows: any[], status: string) {
  const wanted = String(status || "").toLowerCase();
  return rows.filter((row) => requestStatus(row) === wanted).length;
}

function activeRequestCount(rows: any[]) {
  return rows.filter(
    (row) =>
      !["saved", "archived", "deleted", "closed"].includes(requestStatus(row)),
  ).length;
}

function savedRequestCount(rows: any[]) {
  return statusCount(rows, "saved");
}

function archivedRequestCount(rows: any[]) {
  return statusCount(rows, "archived");
}

function deletedRequestCount(rows: any[]) {
  return statusCount(rows, "deleted");
}

function closedRequestCount(rows: any[]) {
  return statusCount(rows, "closed");
}

function readAllInvestorRequests() {
  const dealPainRequests = readJson<any[]>(INVESTOR_REQUESTS_KEY, []);
  const executionRequests = readJson<any[]>(
    INVESTOR_EXECUTION_REQUESTS_KEY,
    [],
  );
  const adminMessages = readJson<any[]>(INVESTOR_ADMIN_MESSAGES_KEY, []);
  return [...dealPainRequests, ...executionRequests, ...adminMessages];
}

type InvestorRequestGroup = "dealPain" | "execution" | "adminMessage";
type InvestorRequestSelection = {
  row: any;
  label: string;
  group: InvestorRequestGroup;
} | null;

function requestStorageKey(group: InvestorRequestGroup) {
  if (group === "execution") return INVESTOR_EXECUTION_REQUESTS_KEY;
  if (group === "adminMessage") return INVESTOR_ADMIN_MESSAGES_KEY;
  return INVESTOR_REQUESTS_KEY;
}

function requestTitle(row: any, label = "Investor Request") {
  return clean(
    row?.requestTitle || row?.title || row?.topic || row?.subject,
    label,
  );
}

function requestMessage(row: any) {
  return clean(
    row?.roomHeader || row?.message || row?.body || row?.notes,
    "Request saved.",
  );
}

function readRequestRows(group: InvestorRequestGroup) {
  const rows = readJson<any[]>(requestStorageKey(group), []);
  return Array.isArray(rows) ? rows : [];
}

function writeRequestRows(group: InvestorRequestGroup, rows: any[]) {
  writeJson(requestStorageKey(group), rows);
  window.dispatchEvent(new Event("vaultforge-investor-request-change"));
  window.dispatchEvent(new Event("vaultforge-investor-room-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-request-change"));
}

function patchInvestorRequestRow(
  group: InvestorRequestGroup,
  id: string,
  patch: any,
) {
  const rows = readRequestRows(group);
  writeRequestRows(
    group,
    rows.map((row) =>
      String(row?.id || "") === String(id)
        ? { ...row, ...patch, updatedAt: new Date().toISOString() }
        : row,
    ),
  );
}

function deleteInvestorRequestForever(group: InvestorRequestGroup, id: string) {
  const rows = readRequestRows(group);
  writeRequestRows(
    group,
    rows.filter((row) => String(row?.id || "") !== String(id)),
  );
}

function RequestMiniCard({
  row,
  label,
  onOpen,
}: {
  row: any;
  label: string;
  onOpen: () => void;
}) {
  const status = String(row?.status || "new").toLowerCase();
  const isDeleted = status === "deleted";
  const isArchived = status === "archived";

  return (
    <button
      type="button"
      style={{
        ...(isDeleted ? redPanel : isArchived ? goldPanel : panel),
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
      }}
      onClick={onOpen}
    >
      <div style={eyebrow}>
        {label} • {row?.status || "new"}
      </div>
      <h3 style={h3}>{requestTitle(row, label)}</h3>
      <p style={muted}>{requestMessage(row)}</p>
      <p style={muted}>Created: {row?.createdAt || "not listed"}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>
        Tap to open request controls.
      </p>
    </button>
  );
}

function InvestorRequestDetailModal({
  selected,
  onClose,
  onStatus,
  onDeleteForever,
}: {
  selected: InvestorRequestSelection;
  onClose: () => void;
  onStatus: (status: string) => void;
  onDeleteForever: () => void;
}) {
  if (!selected) return null;

  const { row: requestRow, label } = selected;
  const profile = requestRow?.investorProfile || {};
  const status = String(requestRow?.status || "new").toLowerCase();
  const title = requestTitle(requestRow, label);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(0,0,0,.82)",
        padding: 18,
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 920, margin: "36px auto", ...goldPanel }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div>
            <div style={eyebrow}>Request Detail</div>
            <h2 style={h2}>{title}</h2>
          </div>
          <button type="button" style={btn} onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ ...grid, marginTop: 16 }}>
          <div style={panel}>
            <div style={eyebrow}>Request Type</div>
            <p style={sub}>{label}</p>
            <p style={muted}>Status: {requestRow?.status || "new"}</p>
            <p style={muted}>State: {requestRow?.state || "Not listed"}</p>
            <p style={muted}>
              Room ID:{" "}
              {requestRow?.itemId ||
                requestRow?.roomId ||
                requestRow?.sourceRequestId ||
                "Not listed"}
            </p>
            <p style={muted}>
              Created: {requestRow?.createdAt || "not listed"}
            </p>
          </div>

          <div style={panel}>
            <div style={eyebrow}>Investor Attached</div>
            <p style={sub}>
              {requestRow?.investorCompany ||
                profile?.company ||
                "Investor company hidden/not listed"}
            </p>
            <p style={muted}>
              {requestRow?.investorName ||
                profile?.contactName ||
                "Investor name hidden/not listed"}
            </p>
            <p style={muted}>
              {requestRow?.investorEmail ||
                profile?.email ||
                "Investor email hidden/not listed"}
            </p>
            <p style={muted}>
              {profile?.phone || "Investor phone hidden/not listed"}
            </p>
          </div>
        </div>

        <div style={{ ...panel, marginTop: 16 }}>
          <div style={eyebrow}>Request Message</div>
          <p style={sub}>{requestMessage(requestRow)}</p>
        </div>

        <div style={{ ...panel, marginTop: 16 }}>
          <div style={eyebrow}>Controls</div>
          <p style={muted}>
            These controls update your investor request tracker. Deleted
            requests stay in the deleted folder until Delete Forever removes
            them.
          </p>
          <div style={{ ...row, marginTop: 14 }}>
            <button
              type="button"
              style={goldBtn}
              onClick={() => onStatus("saved")}
            >
              Save
            </button>
            <button
              type="button"
              style={btn}
              onClick={() => onStatus("archived")}
            >
              Archive
            </button>
            <button type="button" style={btn} onClick={() => onStatus("new")}>
              Restore / Active
            </button>
            <button
              type="button"
              style={btn}
              onClick={() => onStatus("closed")}
            >
              Close
            </button>
            <button
              type="button"
              style={redBtn}
              onClick={() => onStatus("deleted")}
            >
              Delete
            </button>
            {status === "deleted" ? (
              <button type="button" style={redBtn} onClick={onDeleteForever}>
                Delete Forever
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvestorRequestCenter() {
  const [selected, setSelected] = useState<InvestorRequestSelection>(null);
  const [refresh, setRefresh] = useState(0);

  const dealPainRequests = readJson<any[]>(INVESTOR_REQUESTS_KEY, []);
  const executionRequests = readJson<any[]>(
    INVESTOR_EXECUTION_REQUESTS_KEY,
    [],
  );
  const adminMessages = readJson<any[]>(INVESTOR_ADMIN_MESSAGES_KEY, []);
  const all = [...dealPainRequests, ...executionRequests, ...adminMessages];

  function refreshTracker(nextSelected?: InvestorRequestSelection) {
    setRefresh((value) => value + 1);
    if (nextSelected !== undefined) setSelected(nextSelected);
  }

  function updateSelectedStatus(status: string) {
    if (!selected?.row?.id) return;
    patchInvestorRequestRow(selected.group, selected.row.id, { status });
    refreshTracker({
      ...selected,
      row: { ...selected.row, status, updatedAt: new Date().toISOString() },
    });
  }

  function deleteSelectedForever() {
    if (!selected?.row?.id) return;
    deleteInvestorRequestForever(selected.group, selected.row.id);
    refreshTracker(null);
  }

  return (
    <section style={{ ...hero, marginTop: 20 }} data-refresh={refresh}>
      <InvestorRequestDetailModal
        selected={selected}
        onClose={() => setSelected(null)}
        onStatus={updateSelectedStatus}
        onDeleteForever={deleteSelectedForever}
      />

      <div style={eyebrow}>My Investor Requests</div>
      <h2 style={h2}>Request tracking desk.</h2>
      <p style={sub}>
        Track deal/pain requests, execution requests, and admin messages. Tap a
        request card to open the detail window with Save, Archive, Delete, and
        Delete Forever controls.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        <Metric
          title="All Requests"
          count={all.length}
          note="total investor requests, including saved/archived/deleted"
        />
        <Metric
          title="Active / New"
          count={activeRequestCount(all)}
          note="open requests still needing action"
        />
        <Metric
          title="Saved"
          count={savedRequestCount(all)}
          note="saved investor requests"
        />
        <Metric
          title="Archived"
          count={archivedRequestCount(all)}
          note="archived investor requests"
        />
        <Metric
          title="Deleted"
          count={deletedRequestCount(all)}
          note="deleted requests waiting for delete forever"
        />
        <Metric
          title="Closed"
          count={closedRequestCount(all)}
          note="completed/closed"
        />
      </div>

      <div style={{ ...wideGrid, marginTop: 18 }}>
        <div style={goldPanel}>
          <div style={eyebrow}>Deal / Pain Requests</div>
          {dealPainRequests.length ? (
            dealPainRequests.map((row) => (
              <RequestMiniCard
                key={row.id}
                row={row}
                label="Deal/Pain"
                onOpen={() =>
                  setSelected({ row, label: "Deal/Pain", group: "dealPain" })
                }
              />
            ))
          ) : (
            <p style={muted}>No Deal/Pain requests yet.</p>
          )}
        </div>

        <div style={panel}>
          <div style={eyebrow}>Execution Requests</div>
          {executionRequests.length ? (
            executionRequests.map((row) => (
              <RequestMiniCard
                key={row.id}
                row={row}
                label="Execution"
                onOpen={() =>
                  setSelected({ row, label: "Execution", group: "execution" })
                }
              />
            ))
          ) : (
            <p style={muted}>No execution requests yet.</p>
          )}
        </div>

        <div style={panel}>
          <div style={eyebrow}>Owner Messages</div>
          {adminMessages.length ? (
            adminMessages.map((row) => (
              <RequestMiniCard
                key={row.id}
                row={row}
                label="Owner Message"
                onOpen={() =>
                  setSelected({
                    row,
                    label: "Owner Message",
                    group: "adminMessage",
                  })
                }
              />
            ))
          ) : (
            <p style={muted}>No admin messages yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}


function writeControlledThreads(rows: any[]) {
  writeJson(CONTROLLED_THREADS_KEY, rows);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("vaultforge-controlled-thread-change"));
    window.dispatchEvent(new Event("vaultforge-investor-thread-change"));
    window.dispatchEvent(new Event("vaultforge-member-thread-change"));
  }
}

function readControlledThreads() {
  const rows = readJson<any[]>(CONTROLLED_THREADS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function investorEmailForThreads() {
  const investor = readJson<any>(INVESTOR_APP_KEY, {});
  const session = readJson<any>("vaultforge_investor_session_v1", {});
  return String(
    session?.email ||
      investor?.email ||
      browserValue("vaultforge_investor_email") ||
      "",
  ).toLowerCase();
}


function appendInvestorReplyToThread(threadId: string, body: string) {
  const text = clean(body);
  if (!text) return false;

  const rows = readControlledThreads();
  const now = new Date().toISOString();
  const investor = readInvestor();
  const profile = compactInvestorProfile(investorProfileSnapshot(investor));
  let changed = false;

  const next = rows.map((thread: any) => {
    if (thread?.id !== threadId) return thread;
    changed = true;
    return {
      ...thread,
      investorEmail: thread?.investorEmail || profile.email || '',
      investorCompany: thread?.investorCompany || profile.company || '',
      investorName: thread?.investorName || profile.contactName || '',
      investorProfile: thread?.investorProfile || profile,
      status: thread?.status === 'deleted' ? 'active' : thread?.status || 'investor_replied',
      stage: thread?.stage === 'deleted' ? 'investor_replied' : thread?.stage || 'investor_replied',
      messages: [
        ...(Array.isArray(thread?.messages) ? thread.messages : []),
        {
          id: `investor-thread-message-${Date.now()}`,
          from: profile.contactName || 'Investor',
          role: 'investor',
          body: text,
          createdAt: now,
        },
      ],
      updatedAt: now,
    };
  });

  if (!changed) return false;
  writeJson(CONTROLLED_THREADS_KEY, next.slice(0, 80));
  window.dispatchEvent(new Event('vaultforge-controlled-thread-change'));
  window.dispatchEvent(new Event('vaultforge-investor-thread-change'));
  return true;
}

function threadMessagesByRole(thread: any, role: 'admin' | 'member') {
  const rows = Array.isArray(thread?.messages) ? thread.messages : [];
  return rows.filter((message: any) => {
    const who = `${message?.role || ''} ${message?.from || ''}`.toLowerCase();
    if (role === 'admin') return who.includes('admin') || who.includes('vaultforge');
    return who.includes('member') || who.includes('lender') || who.includes('contractor') || who.includes('attorney') || who.includes('title') || who.includes('operator');
  });
}


function patchInvestorRequestThread(threadId: string, patch: Record<string, any>) {
  const id = clean(threadId);
  if (!id) return false;

  const rows = readControlledThreads();
  const now = new Date().toISOString();
  let changed = false;

  const next = rows.map((thread: any) => {
    if (thread?.id !== id && thread?.threadId !== id) return thread;
    changed = true;
    return {
      ...thread,
      ...patch,
      id: thread?.id || id,
      threadId: thread?.threadId || id,
      updatedAt: now,
    };
  });

  if (!changed) return false;
  writeJson(CONTROLLED_THREADS_KEY, next.slice(0, 80));
  window.dispatchEvent(new Event('vaultforge-controlled-thread-change'));
  window.dispatchEvent(new Event('vaultforge-investor-thread-change'));
  return true;
}

function deleteInvestorRequestThreadForever(threadId: string) {
  const id = clean(threadId);
  if (!id) return false;

  const rows = readControlledThreads();
  const next = rows.filter((thread: any) => thread?.id !== id && thread?.threadId !== id);
  writeJson(CONTROLLED_THREADS_KEY, next.slice(0, 80));
  window.dispatchEvent(new Event('vaultforge-controlled-thread-change'));
  window.dispatchEvent(new Event('vaultforge-investor-thread-change'));
  return true;
}

function InvestorThreadMessageCard({ thread, onCollapse, onChanged }: { thread: any; onCollapse?: () => void; onChanged?: () => void }) {
  const [reply, setReply] = useState('');
  const [notice, setNotice] = useState('');
  const profile = thread?.investorProfile || safeInvestorSnapshot();
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  const adminMessages = threadMessagesByRole(thread, 'admin');
  const memberMessages = threadMessagesByRole(thread, 'member');
  const hasFreshReply = messages.some((message: any) => {
    const who = `${message?.role || ''} ${message?.from || ''}`.toLowerCase();
    return who.includes('admin') || who.includes('member') || who.includes('lender') || who.includes('contractor') || who.includes('attorney') || who.includes('title') || who.includes('operator');
  });

  function sendReply() {
    const ok = appendInvestorReplyToThread(thread.id, reply);
    if (ok) {
      setReply('');
      setNotice('Reply sent into this request thread.');
      if (onChanged) onChanged();
    } else {
      setNotice('Reply failed. Close and reopen, then try again.');
    }
  }

  function applyThreadAction(label: string, patch: Record<string, any>) {
    const ok = patchInvestorRequestThread(thread.id || thread.threadId, patch);
    setNotice(ok ? `${label} saved.` : `${label} failed. Try refreshing and sending again.`);
    if (ok && onChanged) onChanged();
  }

  function removeThreadForever() {
    const ok = deleteInvestorRequestThreadForever(thread.id || thread.threadId);
    setNotice(ok ? 'Thread deleted forever.' : 'Delete forever failed. Try refreshing.');
    if (ok && onChanged) onChanged();
  }

  return (
    <div className={hasFreshReply ? 'vf-pulse' : ''} style={hasFreshReply ? activePanel : goldPanel}>
      <div style={eyebrow}>Request Message Thread • {thread?.status || 'open'}</div>
      <h3 style={h3}>{thread?.title || 'Investor Request Thread'}</h3>
      <p style={sub}>{thread?.roomHeader || 'Controlled investor/member/admin conversation.'}</p>
      <p style={muted}>Contact Released: {thread?.contactReleased ? 'Yes' : 'No'}</p>

      <div style={{ ...grid, marginTop: 14 }}>
        <div style={panel}>
          <div style={eyebrow}>Owner Replies</div>
          {adminMessages.length ? adminMessages.slice(-4).map((message: any) => (
            <div key={message.id || `${message.createdAt}-${message.body}`} style={{ ...panel, marginTop: 8 }}>
              <p style={muted}>{message.from || 'VaultForge Owner'} • {message.createdAt || ''}</p>
              <p style={sub}>{message.body || message.message || ''}</p>
            </div>
          )) : <p style={muted}>No admin replies yet.</p>}
        </div>

        <div style={panel}>
          <div style={eyebrow}>Member Replies</div>
          {memberMessages.length ? memberMessages.slice(-4).map((message: any) => (
            <div key={message.id || `${message.createdAt}-${message.body}`} style={{ ...panel, marginTop: 8 }}>
              <p style={muted}>{message.from || 'Member'} • {message.createdAt || ''}</p>
              <p style={sub}>{message.body || message.message || ''}</p>
            </div>
          )) : <p style={muted}>No member replies yet.</p>}
        </div>
      </div>

      <div style={{ ...panel, marginTop: 14 }}>
        <div style={eyebrow}>Request Cleanup</div>
        <div style={row}>
          <button type='button' style={goldBtn} onClick={() => applyThreadAction('Saved', { saved: true, status: 'saved', stage: 'investor_saved' })}>Save</button>
          <button type='button' style={btn} onClick={() => applyThreadAction('Archived', { status: 'archived', stage: 'investor_archived' })}>Archive</button>
          <button type='button' style={redBtn} onClick={() => applyThreadAction('Deleted', { status: 'deleted', stage: 'investor_deleted' })}>Delete</button>
          <button type='button' style={redBtn} onClick={removeThreadForever}>Delete Forever</button>
          <button type='button' style={btn} onClick={onCollapse}>Collapse / Done</button>
        </div>
        <p style={muted}>Save keeps this card for follow-up. Archive hides it from active work. Delete moves it out of open request messages. Delete Forever removes the thread from local testing storage.</p>
      </div>

      <BloombergMessageForm
        sender={investorEmailForThreads() || "Investor"}
        recipient="VaultForge Designated Member"
        header={thread?.roomHeader || thread?.subject || thread?.title || "Request Thread"}
        defaultSubject={thread?.subject || thread?.title || "Investor Request Reply"}
        defaultType="Investor Reply"
        submitLabel="Send Request Reply"
        onSend={(payload) => {
          setReply(payload.summary);
          const message = {
            id: `investor-reply-${Date.now()}`,
            from: "Investor",
            role: "investor",
            body: payload.summary,
            messageType: payload.messageType,
            urgency: payload.urgency,
            subject: payload.subject,
            sender: payload.sender,
            recipient: payload.recipient,
            header: payload.header,
            investorProfile: thread?.investorProfile || safeInvestorSnapshot(),
            createdAt: new Date().toISOString(),
            read: false,
          };
          const rows = readControlledThreads();
          const id = String(thread?.id || thread?.threadId || "");
          writeControlledThreads(rows.map((item: any) =>
            String(item?.id || item?.threadId || "") === id
              ? { ...item, messages: [...(item.messages || []), message], investorReply: payload.summary, updatedAt: new Date().toISOString(), adminUnread: true, memberUnread: true }
              : item
          ));
          setNotice("Reply sent.");
        }}
      />
      {notice ? <p style={muted}>{notice}</p> : null}
    </div>
  );
}

function InvestorThreadCenter() {
  const [refresh, setRefresh] = useState(0);
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<string[]>([]);
  const investorEmail = investorEmailForThreads();
  const threads = readControlledThreads().filter(
    (thread) =>
      String(thread.investorEmail || '').toLowerCase() === investorEmail ||
      !investorEmail,
  );
  const activeThreads = threads.filter((thread) => {
    const status = String(thread?.status || '').toLowerCase();
    const id = String(thread?.id || thread?.threadId || '');
    return status !== 'deleted' && status !== 'archived' && !collapsedThreadIds.includes(id);
  });
  const adminReplyCount = activeThreads.reduce((total, thread) => total + threadMessagesByRole(thread, 'admin').length, 0);
  const memberReplyCount = activeThreads.reduce((total, thread) => total + threadMessagesByRole(thread, 'member').length, 0);

  useEffect(() => {
    const refreshThreads = () => setRefresh((value) => value + 1);
    window.addEventListener('storage', refreshThreads);
    window.addEventListener('vaultforge-controlled-thread-change', refreshThreads);
    window.addEventListener('vaultforge-investor-thread-change', refreshThreads);
    return () => {
      window.removeEventListener('storage', refreshThreads);
      window.removeEventListener('vaultforge-controlled-thread-change', refreshThreads);
      window.removeEventListener('vaultforge-investor-thread-change', refreshThreads);
    };
  }, []);

  return (
    <section style={{ ...hero, marginTop: 20 }} data-refresh={refresh}>
      <div style={eyebrow}>Request Messages</div>
      <h2 style={h2}>Owner and member replies.</h2>
      <p style={sub}>
        Every approved Deal, Pain, or execution request becomes a message card here.
        Owner replies and member replies stay tied to the original request.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        <Metric title='Owner Reply Cards' count={adminReplyCount} note='admin replies tied to requests' pulse={adminReplyCount > 0} />
        <Metric title='Member Reply Cards' count={memberReplyCount} note='member/operator replies tied to requests' pulse={memberReplyCount > 0} />
        <Metric title='Open Request Threads' count={activeThreads.length} note='controlled request conversations' pulse={activeThreads.length > 0} />
      </div>

      <div style={{ ...grid, marginTop: 18 }}>
        {activeThreads.length ? (
          activeThreads.map((thread) => <InvestorThreadMessageCard key={thread.id || thread.threadId} thread={thread} onCollapse={() => setCollapsedThreadIds((ids) => [...ids, String(thread.id || thread.threadId || '')])} onChanged={() => setRefresh((value) => value + 1)} />)
        ) : (
          <div style={panel}>
            <h3 style={h3}>No request message cards yet.</h3>
            <p style={muted}>
              Send a Deal/Pain or execution request. Once admin replies or routes it to a member, the message card appears here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function profileComplete(investor: any) {
  return Boolean(
    investor?.email &&
    investor?.contactName &&
    investor?.company &&
    investor?.phone &&
    ((Array.isArray(investor?.investorTypes) &&
      investor.investorTypes.length > 0) ||
      (Array.isArray(investor?.assetTypes) && investor.assetTypes.length > 0) ||
      investor?.assetTypes ||
      investor?.investorTypes) &&
    ((Array.isArray(investor?.statesInterested) &&
      investor.statesInterested.length > 0) ||
      investor?.statesInterested),
  );
}


type InvestorHelpTopic =
  | "overview"
  | "deal"
  | "pain"
  | "requests"
  | "execution"
  | "admin"
  | "messages"
  | "cleanup"
  | "contact";

const INVESTOR_HELP_TOPICS: { key: InvestorHelpTopic; title: string; short: string; bullets: string[] }[] = [
  {
    key: "overview",
    title: "How Investor Room Works",
    short: "This is your controlled investor access room.",
    bullets: [
      "You see teaser Deal and Pain cards, not the private member directory.",
      "Every request you send attaches your investor profile so owner/members know who is asking.",
      "VaultForge routes requests internally so member contact info stays protected until approved.",
      "Use Deal/Pain cards for a specific opportunity. Use Execution Requests when you need help like funding, title, contractor, operator, or boots on ground.",
    ],
  },
  {
    key: "deal",
    title: "Deal Signals",
    short: "Deal cards are opportunity teasers.",
    bullets: [
      "Deal cards show limited market and opportunity information.",
      "Open a Deal card to review the teaser and request more information.",
      "Private address, seller/member contact, full notes, and deeper intelligence stay hidden until routed/approved.",
      "Use Save, Archive, or Delete to keep your room clean.",
    ],
  },
  {
    key: "pain",
    title: "Pain Signals",
    short: "Pain cards are problem-solving opportunities.",
    bullets: [
      "Pain cards represent a problem that may need capital, contractors, title help, legal help, operators, or execution support.",
      "Open a Pain card when you can help solve the issue or want deeper information.",
      "Pain is not just a listing. It is a routed problem that can turn into a deal, introduction, or execution room.",
      "Requests stay controlled through VaultForge until the right member/admin approval happens.",
    ],
  },
  {
    key: "requests",
    title: "Investor Requests",
    short: "Track what you asked VaultForge to review.",
    bullets: [
      "Active Requests are open requests still waiting or being worked.",
      "Saved Requests are items you want to keep for later.",
      "Archived Requests are inactive or handled requests you do not want in the active view.",
      "Deleted Requests are a cleanup folder. Delete Forever permanently removes the request from this browser storage.",
    ],
  },
  {
    key: "execution",
    title: "Execution Requests",
    short: "Ask the member network for help completing a deal or problem.",
    bullets: [
      "Use Request Lender, Hard Money, JV, Contractor, Title/Closing, Insurance, Operator, Disposition, Boots on Ground, or Equity Partner.",
      "If a Deal/Pain card is open, the execution request attaches to that room.",
      "If no card is open, it sends a general execution request.",
      "Owner receives it and can route it to matching members based on what they do.",
    ],
  },
  {
    key: "admin",
    title: "Message Owner",
    short: "Contact VaultForge admin directly.",
    bullets: [
      "Use Message Owner for account, routing, payment, access, or deal-room questions.",
      "Your investor profile is attached so admin can see who is contacting them.",
      "This is separate from a Deal/Pain request unless you reference the deal or pain in your message.",
      "Owner replies should appear in your request/message thread cards.",
    ],
  },
  {
    key: "messages",
    title: "Request Message Threads",
    short: "Replies stay tied to the original request.",
    bullets: [
      "Owner replies, member replies, and your replies are kept inside the request thread.",
      "Use the request message cards to reply back without creating scattered messages.",
      "A member can reply, ask for more info, accept, or release contact when approved.",
      "Keep threads clean with Save, Archive, Delete, Delete Forever, and Collapse/Done.",
    ],
  },
  {
    key: "cleanup",
    title: "Save / Archive / Delete",
    short: "These buttons organize your investor room.",
    bullets: [
      "Save means keep this request or card for later.",
      "Archive means hide it from active view but keep history.",
      "Delete means move it to a deleted folder.",
      "Delete Forever removes it from the browser-based testing storage.",
    ],
  },
  {
    key: "contact",
    title: "Contact Rules",
    short: "Private contact is controlled.",
    bullets: [
      "Investors do not get direct member directory access.",
      "Members do not automatically expose email or phone.",
      "Contact release should happen only after owner/member approval.",
      "This protects the network and keeps introductions controlled.",
    ],
  },
];

function InvestorHelpCenter() {
  const [openTopic, setOpenTopic] = useState<InvestorHelpTopic | null>(null);
  const topic = INVESTOR_HELP_TOPICS.find((item) => item.key === openTopic);

  return (
    <section style={{ ...goldPanel, marginTop: 20, marginBottom: 20 }}>
      <div style={eyebrow}>Investor Room Guide</div>
      <h2 style={h2}>Tap a card to learn what each area does.</h2>
      <p style={sub}>
        Quick instructions for contacting admin, opening Deal/Pain cards, sending requests, execution help, and cleanup controls.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        {INVESTOR_HELP_TOPICS.map((item) => (
          <button
            key={item.key}
            type="button"
            style={openTopic === item.key ? activePanel : panel}
            onClick={() => setOpenTopic(openTopic === item.key ? null : item.key)}
          >
            <div style={eyebrow}>{item.title}</div>
            <p style={muted}>{item.short}</p>
            <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>
              {openTopic === item.key ? "Collapse / Done" : "Open Instructions"}
            </p>
          </button>
        ))}
      </div>

      {topic ? (
        <div style={{ ...panel, marginTop: 18 }}>
          <div style={eyebrow}>{topic.title}</div>
          <h3 style={h3}>{topic.short}</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {topic.bullets.map((bullet, index) => (
              <div key={`${topic.key}-${index}`} style={panel}>
                <p style={muted}>{index + 1}. {bullet}</p>
              </div>
            ))}
          </div>
          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={goldBtn} onClick={() => setOpenTopic(null)}>
              Collapse / Done
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}



function InvestorSequenceStep({
  step,
  title,
  note,
  active,
  onClick,
}: {
  step: string;
  title: string;
  note: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" style={{ ...(active ? goldPanel : panel), textAlign: "left", width: "100%", cursor: "pointer" }} onClick={onClick}>
      <div style={eyebrow}>{step}</div>
      <h3 style={h3}>{title}</h3>
      <p style={muted}>{note}</p>
    </button>
  );
}

function InvestorAreaHeader({
  eyebrowText,
  title,
  note,
}: {
  eyebrowText: string;
  title: string;
  note: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={eyebrow}>{eyebrowText}</div>
      <h2 style={h2}>{title}</h2>
      <p style={sub}>{note}</p>
    </div>
  );
}


function refreshInvestorRequests() {
  window.dispatchEvent(new Event("vaultforge-request-change"));
  window.dispatchEvent(new Event("vaultforge-owner-message-change"));
}

export default function InvestorRoomPage() {
  const [investor, setInvestor] = useState<any>({});
  const [state, setState] = useState("GA");
  const [kind, setKind] = useState<Kind>("Deal");
  const [folder, setFolder] = useState<Folder>("active");
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>(null);
  const [selectedExecutionLane, setSelectedExecutionLane] = useState<any>(null);
  const [messageOwnerOpen, setMessageOwnerOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  function refresh() {
    setTick((value) => value + 1);
  }

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setInvestor(readJson<any>(INVESTOR_APP_KEY, {}));
      refresh();
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("vaultforge-investor-change", update);
    window.addEventListener("vaultforge-investor-room-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("vaultforge-investor-change", update);
      window.removeEventListener("vaultforge-investor-room-change", update);
    };
  }, []);

  const complete = profileComplete(investor);
  const mockInvestorPayment = paymentStatusFor(String(investor?.email || browserValue("vaultforge_investor_email") || ""), "investor");
  // OPEN INVESTOR ROOM:
  // Investor Room is intentionally open. No payment gate, no mock payment gate,
  // no local approval requirement, and no locked preview.
  const access = true;

  const rawDeals = useMemo(() => {
    const rows = readRows([
      "vaultforge_clean_deal_rooms",
      "vaultforge_deal_rooms",
      "vaultforge_rooms_deals",
      "vf_deal_rooms",
    ]);
    return dedupe(rows, "Deal").filter(
      (item) => itemState(item) === state && !isHidden(item, "Deal"),
    );
  }, [state, tick]);

  const rawPains = useMemo(() => {
    const rows = readRows([
      "vaultforge_clean_pain_rooms",
      "vaultforge_clean_pain_rooms_v1",
      "vaultforge_clean_pain_rooms_v2",
      "vaultforge_pain_rooms",
      "vaultforge_rooms_pain",
      "vf_pain_rooms",
    ]);
    return dedupe(rows, "Pain").filter(
      (item) => itemState(item) === state && !isHidden(item, "Pain"),
    );
  }, [state, tick]);

  const activeDeals = rawDeals.filter(
    (item) => getFolder(item, "Deal") === "active",
  );
  const savedDeals = rawDeals.filter(
    (item) => getFolder(item, "Deal") === "saved",
  );
  const archivedDeals = rawDeals.filter(
    (item) => getFolder(item, "Deal") === "archived",
  );
  const deletedDeals = rawDeals.filter(
    (item) => getFolder(item, "Deal") === "deleted",
  );

  const activePains = rawPains.filter(
    (item) => getFolder(item, "Pain") === "active",
  );
  const savedPains = rawPains.filter(
    (item) => getFolder(item, "Pain") === "saved",
  );
  const archivedPains = rawPains.filter(
    (item) => getFolder(item, "Pain") === "archived",
  );
  const deletedPains = rawPains.filter(
    (item) => getFolder(item, "Pain") === "deleted",
  );

  const currentItems =
    kind === "Deal"
      ? folder === "saved"
        ? savedDeals
        : folder === "archived"
          ? archivedDeals
          : folder === "deleted"
            ? deletedDeals
            : activeDeals
      : folder === "saved"
        ? savedPains
        : folder === "archived"
          ? archivedPains
          : folder === "deleted"
            ? deletedPains
            : activePains;

  function openKind(nextKind: Kind) {
    setKind(nextKind);
    setFolder("active");
    setActiveRoom(null);
  }

  function openFolder(nextKind: Kind, nextFolder: Folder) {
    setKind(nextKind);
    setFolder(nextFolder);
    setActiveRoom(null);
  }

  if (!mounted) {
    return (
      <main style={page}>
        <div style={wrap}>
          <section style={hero}>
            <div style={eyebrow}>VaultForge Investor Room</div>
            <h1 style={h1}>Preparing investor room.</h1>
            <p style={sub}>Loading browser workspace safely.</p>
          </section>
        </div>
      </main>
    );
  }
  return (
    <main style={page}>
      <div style={wrap}>
        <VaultForgeAlertCenter audience="investor" title="Investor Alerts" />

        <VaultForgeAICommandBrief deals={deals || []} pains={pains || []} requests={requests || []} />

        <TopNav
          onMessageOwner={() => setMessageOwnerOpen(true)}
          isOwner={String(investor?.email || browserValue("vf_email") || browserValue("vaultforge_investor_email") || "").toLowerCase() === OWNER_EMAIL.toLowerCase()}
        />
        <TickerRibbon />

        <MessageOwnerModal
          open={messageOwnerOpen}
          onClose={() => setMessageOwnerOpen(false)}
        />

        <section style={hero}>
          <LogoBlock />
          <div style={eyebrow}>VaultForge Investor Command Room</div>
          <h1 style={h1}>Signals → Requests → Threads → Execution.</h1>
          <p style={sub}>
            Start with Deal/Pain signals, request controlled information, track replies, then request execution help from the private member network.
          </p>
          <div style={{ ...row, marginTop: 22 }}>
            <button type="button" style={kind === "Deal" && folder === "active" ? goldBtn : btn} onClick={() => openKind("Deal")}>
              Open Deal Signals
            </button>
            <button type="button" style={kind === "Pain" && folder === "active" ? goldBtn : btn} onClick={() => openKind("Pain")}>
              Open Pain Signals
            </button>
            <button type="button" style={goldBtn} onClick={() => setMessageOwnerOpen(true)}>
              Message Owner
            </button>
            <button type="button" style={btn} onClick={() => { setFolder("active"); setActiveRoom(null); }}>
              Collapse / Done
            </button>
          </div>
        </section>

        <section style={{ ...goldPanel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="Operating Sequence"
            title="Use the room in this order."
            note="The cards below are organized by the actual investor flow so nothing is scattered."
          />
          <div style={grid}>
            <InvestorSequenceStep
              step="01 Identity"
              title="Profile + Access"
              note="Your investor profile is attached to every request and message."
              active
            />
            <InvestorSequenceStep
              step="02 Signals"
              title="Deal / Pain Signals"
              note="Open opportunity or problem cards by state."
              active={folder === "active"}
            />
            <InvestorSequenceStep
              step="03 Requests"
              title="Message Owner"
              note="Ask for controlled Deal/Pain information without exposing private member data."
              active={activeRequestCount(readAllInvestorRequests()) > 0}
            />
            <InvestorSequenceStep
              step="04 Replies"
              title="Message Threads"
              note="Owner/member replies stay tied to the original request."
            />
            <InvestorSequenceStep
              step="05 Execution"
              title="Ask For Help"
              note="Request lender, title, contractor, operator, JV, insurance, or boots-on-ground support."
            />
            <InvestorSequenceStep
              step="06 Cleanup"
              title="Save / Archive / Delete"
              note="Keep your investor room clean without losing controlled workflow."
            />
          </div>
        </section>

        <InvestorIdentityCard
          investor={investor}
          onMessageOwner={() => setMessageOwnerOpen(true)}
        />

        <section style={{ marginBottom: 18 }}>
          <IntelligencePanel investor={investor} />
        </section>

        <InvestorHelpCenter />

        <section style={{ ...goldPanel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="01 State + Signal Desk"
            title="Choose market and signal type."
            note="Deal Signals are opportunity cards. Pain Signals are problem-solving cards. Use folders only after cards are saved, archived, or deleted."
          />

          <div style={row}>
            {STATES.map((stateCode) => (
              <button
                key={stateCode}
                type="button"
                style={stateCode === state ? goldBtn : btn}
                onClick={() => {
                  setState(stateCode);
                  setFolder("active");
                  setActiveRoom(null);
                }}
              >
                {stateCode}
              </button>
            ))}
          </div>

          <div style={{ ...grid, marginTop: 18 }}>
            <Metric
              title="Deal Signals"
              count={activeDeals.length}
              note={`active opportunity cards in ${state}`}
              active={kind === "Deal" && folder === "active"}
              onClick={() => openKind("Deal")}
            />
            <Metric
              title="Pain Signals"
              count={activePains.length}
              note={`active pressure/problem cards in ${state}`}
              active={kind === "Pain" && folder === "active"}
              onClick={() => openKind("Pain")}
            />
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="02 Request Tracking"
            title="Track every request you sent."
            note="These are your outgoing requests to VaultForge/owner/member routing. Use this before digging through folders."
          />
          <div style={grid}>
            <Metric
              title="Active Requests"
              count={activeRequestCount(readAllInvestorRequests())}
              note="open investor requests"
            />
            <Metric
              title="Saved Requests"
              count={savedRequestCount(readAllInvestorRequests())}
              note="saved investor requests"
            />
            <Metric
              title="Archived Requests"
              count={archivedRequestCount(readAllInvestorRequests())}
              note="archived investor requests"
            />
            <Metric
              title="Deleted Requests"
              count={deletedRequestCount(readAllInvestorRequests())}
              note="deleted investor requests"
            />
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="03 Signal Folders"
            title="Deal and Pain cleanup folders."
            note="These control the visible Deal/Pain teaser cards only. Request folders are handled in the Request Tracking Desk."
          />
          <div style={grid}>
            <Metric
              title="Saved Deals"
              count={savedDeals.length}
              note="saved deal cards"
              active={kind === "Deal" && folder === "saved"}
              onClick={() => openFolder("Deal", "saved")}
            />
            <Metric
              title="Archived Deals"
              count={archivedDeals.length}
              note="archived deal cards"
              active={kind === "Deal" && folder === "archived"}
              onClick={() => openFolder("Deal", "archived")}
            />
            <Metric
              title="Deleted Deals"
              count={deletedDeals.length}
              note="deleted deal cards"
              active={kind === "Deal" && folder === "deleted"}
              onClick={() => openFolder("Deal", "deleted")}
            />
            <Metric
              title="Saved Pain"
              count={savedPains.length}
              note="saved pain cards"
              active={kind === "Pain" && folder === "saved"}
              onClick={() => openFolder("Pain", "saved")}
            />
            <Metric
              title="Archived Pain"
              count={archivedPains.length}
              note="archived pain cards"
              active={kind === "Pain" && folder === "archived"}
              onClick={() => openFolder("Pain", "archived")}
            />
            <Metric
              title="Deleted Pain"
              count={deletedPains.length}
              note="deleted pain cards"
              active={kind === "Pain" && folder === "deleted"}
              onClick={() => openFolder("Pain", "deleted")}
            />
          </div>
        </section>

        <section style={{ ...goldPanel, marginBottom: 18 }}>
          <div style={{ ...row, justifyContent: "space-between", marginBottom: 12 }}>
            <InvestorAreaHeader
              eyebrowText="04 Current Signal Cards"
              title={folder === "active" ? `${kind} Cards • ${state}` : `${kind} ${folder} Folder • ${state}`}
              note="Open a card to request info. The request will carry this card header and your investor profile."
            />
            {folder !== "active" ? (
              <button
                type="button"
                style={btn}
                onClick={() => {
                  setFolder("active");
                  setActiveRoom(null);
                }}
              >
                Collapse Folder / Done
              </button>
            ) : null}
          </div>

          <div style={wideGrid}>
            {currentItems.length ? (
              currentItems.map((item, index) => (
                <RoomCard
                  key={`${kind}-${folder}-${itemKey(item, kind, index)}`}
                  kind={kind}
                  item={item}
                  isOpen={
                    activeRoom?.kind === kind &&
                    cleanupKey(activeRoom.item, kind) === cleanupKey(item, kind)
                  }
                  onOpen={() => setActiveRoom({ kind, item })}
                  onClose={() => setActiveRoom(null)}
                  onMove={(nextFolder) => {
                    setFolderForItem(item, kind, nextFolder);
                    setActiveRoom(null);
                    refresh();
                  }}
                  onRestore={() => {
                    setFolderForItem(item, kind, "active");
                    setActiveRoom(null);
                    refresh();
                  }}
                  onDeleteForever={() => {
                    hideForever(item, kind);
                    setActiveRoom(null);
                    refresh();
                  }}
                />
              ))
            ) : (
              <div style={panel}>
                <h2 style={h2}>
                  No {folder} {kind.toLowerCase()} cards.
                </h2>
                <p style={sub}>
                  Use State Desk or folder cards above to switch areas.
                </p>
              </div>
            )}
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="05 Message Threads"
            title="Owner/member replies tied to requests."
            note="Replies are no longer generic. Each one carries sender, recipient, request header, type, urgency, timeline, amount, conditions, and next move."
          />
          <InvestorThreadCenter />
        </section>

        <section style={{ ...goldPanel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="06 Execution Requests"
            title="Ask the private network to help complete the deal."
            note="Use this after opening a Deal/Pain card, or send a general execution request if no card is open."
          />
          <ExecutionLaneCards
            activeRoom={activeRoom}
            onSelect={setSelectedExecutionLane}
          />
          <ExecutionRequestModal
            lane={selectedExecutionLane}
            activeRoom={activeRoom}
            onClose={() => setSelectedExecutionLane(null)}
          />
        </section>

        <section style={{ ...panel, marginBottom: 18 }}>
          <InvestorAreaHeader
            eyebrowText="07 Request Desk"
            title="Full request tracking and cleanup."
            note="Open saved, archived, deleted, active, and closed request cards here."
          />
          <InvestorRequestCenter />
        </section>

        <section style={{ marginTop: 18 }}>
          <RequestPipeline />
        </section>

        <section style={{ ...hero, marginTop: 24 }}>
          <div style={eyebrow}>Network Capabilities Through Members</div>
          <h2 style={h2}>One-stop execution support.</h2>
          <p style={sub}>
            Funding, title/closing, contractors, operators, insurance, and
            execution partners are available through the private member network
            after member/admin approval.
          </p>
          <div style={{ ...grid, marginTop: 18 }}>
            <div style={panel}>
              <div style={eyebrow}>Funding</div>
              <p style={muted}>
                Private lenders, hard money, bridge, equity, and capital
                introductions through members.
              </p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Title / Closing</div>
              <p style={muted}>
                Closing support and transaction coordination through approved
                network relationships.
              </p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Contractors</div>
              <p style={muted}>
                Rehab, construction, repairs, inspections, and field execution
                routed through members.
              </p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Operators</div>
              <p style={muted}>
                Asset operators, acquisition/disposition support, management,
                and execution partners.
              </p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Insurance</div>
              <p style={muted}>
                Coverage support and property-risk routing through approved
                member resources.
              </p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Owner Control</div>
              <p style={muted}>
                No direct contact is exposed until the member/admin workflow
                approves deeper access.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}