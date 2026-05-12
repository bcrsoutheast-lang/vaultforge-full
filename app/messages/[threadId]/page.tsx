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

function sourceFromParams(params: Record<string, string | string[] | undefined>) {
  const raw = firstParam(params, ["source", "type", "context", "folder", "folder_key"]).toLowerCase();

  if (raw.includes("alert")) return "alert";
  if (raw.includes("pain")) return "pain";
  if (raw.includes("signal")) return "signal";
  if (raw.includes("routing") || raw.includes("route")) return "routing";
  if (raw.includes("intro")) return "introduction";
  if (raw.includes("project") || raw.includes("deal")) return "project";
  if (raw.includes("member")) return "member";
  if (raw.includes("activity")) return "activity";

  return "message";
}

function buildMessageCommandUrl(routeThreadId: string, params: Record<string, string | string[] | undefined>) {
  const explicitThreadKey = firstParam(params, ["thread_key", "threadKey"]);
  const source = sourceFromParams(params);

  const signalId = firstParam(params, ["signal_id", "signalId"]);
  const itemId = firstParam(params, ["item_id", "itemId", "deal_id", "project_id", "pain_id"]);
  const title = firstParam(params, ["title", "subject"]);

  const identity =
    signalId ||
    itemId ||
    explicitThreadKey ||
    routeThreadId ||
    "general";

  const threadKey = explicitThreadKey || `${source}:${safeKey(identity.replace(`${source}:`, "")) || "general"}`;

  const next = new URLSearchParams();
  if (title) next.set("title", title);

  return `/message-command/${encodeURIComponent(threadKey)}${next.toString() ? `?${next.toString()}` : ""}`;
}

export default function MessageThreadRedirectPage({
  params,
  searchParams,
}: {
  params: { threadId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const routeThreadId = decodeURIComponent(params.threadId || "");
  redirect(buildMessageCommandUrl(routeThreadId, searchParams || {}));
}
