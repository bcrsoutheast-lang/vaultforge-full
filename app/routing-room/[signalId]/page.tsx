import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RoutingRoomPage({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params;
  const room = await hydrateRoom("routing", signalId);
  return <VaultForgeRoomPage room={room} kind="routing" id={signalId} />;
}
