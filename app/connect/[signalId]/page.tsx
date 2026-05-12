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
    .slice(0, 90);
}

function normalizeSource(value: string, params: Record<string, string | string[] | undefined>) {
  const raw = clean(value).toLowerCase();
  const joined = [
    raw,
    firstParam(params, ["source", "type", "context"]),
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
  if (joined.includes("activity") || joined.includes("event")) return "activity";
  if (joined.includes("routing") || joined.includes("route")) return "routing";
  if (joined.includes("intro")) return "introduction";
  if (joined.includes("project") || joined.includes("deal") || joined.includes("property")) return "project";
  if (joined.includes("member") || joined.includes("connect") || joined.includes("profile")) return "member";
  if (joined.includes("signal")) return "signal";

  return raw || "message";
}

function buildThreadUrl(
  signalIdValue: string,
  params: Record<string, string | string[] | undefined>
) {
  const rawSource = firstParam(params, ["source", "type", "context"]) || "message";
  const source = normalizeSource(rawSource, params);

  const signalId =
    clean(signalIdValue) ||
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "general-message";

  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const email = cleanEmail(firstParam(params, ["email", "from", "from_email", "member_email"]));
  const to = cleanEmail(firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]));
  const subject = firstParam(params, ["subject", "title"]);
  const message = firstParam(params, ["message", "body", "note"]);

  const identity = signalId || itemId || "general-message";
  const participant = email ? safePart(email.split("@")[0] || email) : "member";
  const threadId = safePart(`${source}-${identity}-${participant}`) || "general-message";

  const next = new URLSearchParams();
  next.set("source", source);
  next.set("origin", source);
  next.set("folder", source === "message" ? "general" : source === "introduction" ? "introductions" : `${source}s`.replace("activitys", "activity"));
  next.set("signal_id", signalId);
  next.set("draft", "1");

  if (itemId) next.set("item_id", itemId);
  if (email) next.set("email", email);
  if (to) next.set("to", to);
  if (subject) next.set("subject", subject);
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
