import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

export default async function OpportunityRoomPage({ params }: { params: Params }) {
  const { id } = await params;
  const room = await hydrateRoom("opportunity", id);
  return <VaultForgeRoomPage room={room} kind="opportunity" id={id} />;
}