import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
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

function safeKey(value: string) {
  return clean(value)
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
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

function buildMessageCommandUrl(
  signalIdValue: string,
  params: Record<string, string | string[] | undefined>
) {
  const rawSource = firstParam(params, ["source", "type", "context"]) || "message";
  const source = normalizeSource(rawSource, params);

  const explicitThreadKey = firstParam(params, ["thread_key", "threadKey"]);

  const signalId =
    clean(signalIdValue) ||
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]);

  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const title = firstParam(params, ["title", "subject"]);

  const identity =
    signalId ||
    itemId ||
    explicitThreadKey ||
    "general";

  const threadKey = explicitThreadKey || `${source}:${safeKey(identity.replace(`${source}:`, "")) || "general"}`;

  const next = new URLSearchParams();
  if (title) next.set("title", title);

  const email = firstParam(params, ["email", "from", "from_email", "member_email"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const message = firstParam(params, ["message", "body", "note"]);

  if (email) next.set("email", email);
  if (to) next.set("to", to);
  if (message) next.set("message", message);

  return `/message-command/${encodeURIComponent(threadKey)}${next.toString() ? `?${next.toString()}` : ""}`;
}

export default function ConnectPage({
  params,
  searchParams,
}: {
  params: { signalId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const signalId = decodeURIComponent(params.signalId || "");
  redirect(buildMessageCommandUrl(signalId, searchParams || {}));
}
