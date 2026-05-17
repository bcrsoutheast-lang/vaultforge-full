import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function DealDetailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const id =
    first(params.id) ||
    first(params.deal_id) ||
    first(params.project_id) ||
    first(params.room_id) ||
    first(params.item_id);

  const room = await hydrateRoom("opportunity", id);
  return <VaultForgeRoomPage room={room} kind="opportunity" id={id || "missing-opportunity-id"} />;
}