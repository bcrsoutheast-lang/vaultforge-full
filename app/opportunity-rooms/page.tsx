import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunityRoomsPage() {
  const rooms = await listRooms("opportunity");

  return (
    <VaultForgeRoomListPage
      title="Opportunity Rooms"
      subtitle="The single deal/project/opportunity lane. Front cards stay clean; numbers, AI, routing, alerts, matched profiles, and execution context live inside each room."
      kind="opportunity"
      rooms={rooms}
    />
  );
}