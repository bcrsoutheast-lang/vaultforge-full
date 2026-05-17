import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PressureRoomsPage() {
  const rooms = await listRooms("pressure");

  return (
    <VaultForgeRoomListPage
      title="Pain Rooms"
      subtitle="The single distress/problem/execution lane. Pain rooms carry pressure, blockers, risk, capital need, matched profiles, AI next steps, and room-context messages."
      kind="pressure"
      rooms={rooms}
    />
  );
}