import { hydrateRoom } from "../../lib/vaultforgeRoomHydration";
import { VaultForgeRoomPage } from "../../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignalRoomPage({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params;
  const room = await hydrateRoom("signal", signalId);
  return <VaultForgeRoomPage room={room} kind="signal" id={signalId} />;
}
