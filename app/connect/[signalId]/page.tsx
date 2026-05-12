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

function safePart(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function buildThreadUrl(
  signalIdValue: string,
  params: Record<string, string | string[] | undefined>
) {
  const source = firstParam(params, ["source", "type", "context"]) || "message";

  const signalId =
    clean(signalIdValue) ||
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "general-message";

  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const email = firstParam(params, ["email", "from", "from_email", "member_email"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const subject = firstParam(params, ["subject", "title"]);
  const message = firstParam(params, ["message", "body", "note"]);

  const threadId = safePart(`${source}-${signalId || itemId || "general-message"}`) || "general-message";

  const next = new URLSearchParams();
  next.set("source", source);
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
