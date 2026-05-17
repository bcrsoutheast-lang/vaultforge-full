import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AlertsPage() {
  const alerts = await listRooms("alert");
  const fallbackSignals = alerts.length ? [] : await listRooms("signal");
  const fallbackOpportunities = alerts.length || fallbackSignals.length ? [] : await listRooms("opportunity");
  const rooms = [...alerts, ...fallbackSignals, ...fallbackOpportunities].slice(0, 30);

  return (
    <VaultForgeRoomListPage
      title="Alert Room."
      subtitle="Alerts now restore real project, pain, signal, or routing records before opening a room. If alert rows are empty, VaultForge falls back to signals/opportunities instead of showing a blank shell."
      kind="alert"
      rooms={rooms}
    />
  );
}
