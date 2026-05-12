import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function firstParam(params: Record<string, string | string[] | undefined>, names: string[]) {
  for (const name of names) {
    const raw = params[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function safePart(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function normalizeSource(value: string, params: Record<string, string | string[] | undefined>) {
  const raw = clean(value).toLowerCase();

  const joined = [
    raw,
    firstParam(params, ["source", "type", "context"]),
    firstParam(params, ["folder", "folder_key"]),
    firstParam(params, ["subject", "title"]),
    firstParam(params, ["message", "body", "note"]),
  ]
    .join(" ")
    .toLowerCase();

  if (
    joined.includes("alert") ||
    joined.includes("need-more") ||
    joined.includes("need_more") ||
    joined.includes("message-owner") ||
    joined.includes("request-info") ||
    joined.includes("urgent")
  ) {
    return "alert";
  }

  if (joined.includes("pain") || joined.includes("distress") || joined.includes("funding-gap")) return "pain";
  if (joined.includes("signal")) return "signal";
  if (joined.includes("activity") || joined.includes("event")) return "activity";
  if (joined.includes("routing") || joined.includes("route")) return "routing";
  if (joined.includes("intro")) return "introduction";
  if (joined.includes("project") || joined.includes("deal") || joined.includes("property")) return "project";
  if (joined.includes("member") || joined.includes("connect") || joined.includes("profile")) return "member";

  return raw || "message";
}

function folderForSource(source: string, params: Record<string, string | string[] | undefined>) {
  const explicit = firstParam(params, ["folder", "folder_key"]).toLowerCase();

  const allowed = [
    "alerts",
    "pain",
    "activity",
    "routing",
    "introductions",
    "projects",
    "members",
    "signals",
    "general",
  ];

  if (allowed.includes(explicit)) return explicit;

  if (source === "alert") return "alerts";
  if (source === "pain") return "pain";
  if (source === "activity") return "activity";
  if (source === "routing") return "routing";
  if (source === "introduction") return "introductions";
  if (source === "project") return "projects";
  if (source === "member") return "members";
  if (source === "signal") return "signals";

  return "general";
}

function buildThreadKey({
  source,
  signalId,
  itemId,
  to,
  email,
  params,
}: {
  source: string;
  signalId: string;
  itemId: string;
  to: string;
  email: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const explicit = firstParam(params, ["thread_key", "threadKey"]);
  if (explicit) return explicit;

  const identity =
    signalId ||
    itemId ||
    firstParam(params, ["alert_id", "routing_id", "id"]) ||
    "general-message";

  return `${source}:${identity}__${to || "bcrsoutheast@gmail.com"}__${email || "member@vaultforge.local"}`;
}

function buildThreadUrl(
  signalIdValue: string,
  params: Record<string, string | string[] | undefined>
) {
  const rawSource = firstParam(params, ["source", "type", "context"]) || "message";
  const source = normalizeSource(rawSource, params);
  const folder = folderForSource(source, params);

  const signalId =
    clean(signalIdValue) ||
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "general-message";

  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const email = cleanEmail(firstParam(params, ["email", "from", "from_email", "member_email"]));
  const to = cleanEmail(firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]));
  const subject = firstParam(params, ["subject", "title"]);
  const title = firstParam(params, ["title", "subject"]);
  const message = firstParam(params, ["message", "body", "note"]);

  const threadKey = buildThreadKey({
    source,
    signalId,
    itemId,
    to,
    email,
    params,
  });

  const identity = signalId || itemId || threadKey || "general-message";
  const participant = email ? safePart(email.split("@")[0] || email) : "member";
  const threadId = safePart(`${source}-${identity}-${participant}`) || "general-message";

  const next = new URLSearchParams();

  /*
    Critical:
    Preserve all message lane fields.
    Messages page counts by folder/source/thread_key.
    If connect strips these, Alert messages save outside the Alerts inbox.
  */
  next.set("source", source);
  next.set("type", source);
  next.set("context", source);
  next.set("origin", source);
  next.set("folder", folder);
  next.set("folder_key", folder);
  next.set("thread_key", threadKey);
  next.set("signal_id", signalId);
  next.set("draft", "1");

  if (itemId) {
    next.set("item_id", itemId);
    next.set("deal_id", itemId);
  }

  if (email) {
    next.set("email", email);
    next.set("from", email);
    next.set("from_email", email);
  }

  if (to) {
    next.set("to", to);
    next.set("recipient_email", to);
    next.set("owner_email", to);
  }

  if (subject) next.set("subject", subject);
  if (title) next.set("title", title);
  if (message) next.set("message", message);

  return `/messages/${encodeURIComponent(threadId)}?${next.toString()}`;
}

export default function ConnectPage({
  params,
  searchParams,
}: {
  params: { signalId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const signalId = decodeURIComponent(params.signalId || "");
  redirect(buildThreadUrl(signalId, searchParams || {}));
}
