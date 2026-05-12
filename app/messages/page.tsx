import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function first(params: Record<string, string | string[] | undefined>, names: string[]) {
  for (const name of names) {
    const raw = params[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

export default function NewMessageRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = searchParams || {};
  const signalId =
    first(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    first(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "general-message";

  const next = new URLSearchParams();

  const passthrough: Record<string, string[]> = {
    email: ["email", "from", "from_email", "member_email"],
    to: ["to", "recipient", "recipient_email", "target_email", "owner_email"],
    item_id: ["item_id", "itemId", "pain_id", "project_id", "deal_id"],
    subject: ["subject", "title"],
    message: ["message", "body", "note"],
    source: ["source", "type", "context"],
  };

  for (const [key, names] of Object.entries(passthrough)) {
    const value = first(params, names);
    if (value) next.set(key, value);
  }

  if (!next.get("source")) next.set("source", "message");

  redirect(`/connect/${encodeURIComponent(signalId)}?${next.toString()}`);
}
