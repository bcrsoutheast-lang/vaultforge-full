import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function firstParam(
  params: Record<string, string | string[] | undefined>,
  names: string[]
) {
  for (const name of names) {
    const raw = params[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function buildConnectUrl(params: Record<string, string | string[] | undefined>) {
  const signalId =
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "general-message";

  const next = new URLSearchParams();

  const email = firstParam(params, ["email", "from", "from_email", "member_email"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const subject = firstParam(params, ["subject", "title"]);
  const message = firstParam(params, ["message", "body", "note"]);
  const source = firstParam(params, ["source", "type", "context"]) || "message";

  if (email) next.set("email", email);
  if (to) next.set("to", to);
  if (itemId) next.set("item_id", itemId);
  if (subject) next.set("subject", subject);
  if (message) next.set("message", message);
  next.set("source", source);

  return `/connect/${encodeURIComponent(signalId)}?${next.toString()}`;
}

export default function NewMessageRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  redirect(buildConnectUrl(searchParams || {}));
}
