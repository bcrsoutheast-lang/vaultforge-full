import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function firstParam(searchParams: Record<string, string | string[] | undefined>) {
  const keys = ["id", "deal_id", "project_id", "item_id", "room_id", "property_id"];

  for (const key of keys) {
    const value = searchParams[key];
    const text = Array.isArray(value) ? value[0] : value;
    if (text) return String(text);
  }

  return "";
}

export default async function DealDetailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const id = firstParam(params);
  const room = await hydrateRoom("opportunity", id);
  return <VaultForgeRoomPage room={room} kind="opportunity" id={id} />;
}
