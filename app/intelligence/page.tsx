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
      subtitle="The intelligence lane hydrates real signal, project, and pressure payloads into clean AI briefs instead of raw JSON or framework text."
      kind="signal"
      rooms={rooms}
    />
  );
}
