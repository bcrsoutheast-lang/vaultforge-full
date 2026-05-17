import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

export default async function PainRoomPage({ params }: { params: Params }) {
  const { id } = await params;
  const room = await hydrateRoom("pressure", id);
  return <VaultForgeRoomPage room={room} kind="pressure" id={id} />;
}