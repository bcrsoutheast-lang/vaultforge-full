import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunityRoomsPage() {
  const rooms = await listRooms("opportunity");

  return (
    <VaultForgeRoomListPage
      title="Opportunity Rooms"
      subtitle="Active opportunity rooms pulled from the real deal/project/property tables. Front cards stay clean; deep numbers, AI analysis, profiles, alerts, and routing belong inside each room."
      kind="opportunity"
      rooms={rooms}
    />
  );
}