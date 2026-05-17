import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PainRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await hydrateRoom("pressure", id);
  return <VaultForgeRoomPage room={room} kind="pressure" id={id} />;
}
