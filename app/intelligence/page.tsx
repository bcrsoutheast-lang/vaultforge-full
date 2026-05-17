import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IntelligencePage() {
  const signals = await listRooms("signal");
  const fallbackOpportunities = signals.length ? [] : await listRooms("opportunity");
  const fallbackPressure = signals.length || fallbackOpportunities.length ? [] : await listRooms("pressure");
  const rooms = [...signals, ...fallbackOpportunities, ...fallbackPressure].slice(0, 30);

  return (
    <VaultForgeRoomListPage
      title="Intelligence."
      subtitle="The intelligence lane now hydrates real signal/project/pressure payloads instead of only showing framework text."
      kind="signal"
      rooms={rooms}
    />
  );
}
