import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function safePart(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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

function buildThreadUrl(
  signalId: string,
  params: Record<string, string | string[] | undefined>
) {
  const source = firstParam(params, ["source", "type", "context"]) || "message";
  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const email = firstParam(params, ["email", "from", "from_email", "member_email"]);
  const subject = firstParam(params, ["subject", "title"]);
  const message = firstParam(params, ["message", "body", "note"]);

  const threadBase = safePart(`${source}-${signalId || itemId || "general-message"}`) || "general-message";

  const next = new URLSearchParams();
  next.set("source", source);
  next.set("signal_id", signalId || "general-message");

  if (itemId) next.set("item_id", itemId);
  if (to) next.set("to", to);
  if (email) next.set("email", email);
  if (subject) next.set("subject", subject);
  if (message) next.set("message", message);

  return `/messages/${encodeURIComponent(threadBase)}?${next.toString()}`;
}

export default function ConnectRedirectPage({
  params,
  searchParams,
}: {
  params: { signalId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const signalId = decodeURIComponent(params.signalId || "general-message");
  redirect(buildThreadUrl(signalId, searchParams || {}));
}
