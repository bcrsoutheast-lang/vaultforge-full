import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const rooms = await listRooms("opportunity");

  return (
    <VaultForgeRoomListPage
      title="Opportunity Rooms"
      subtitle="Projects are consolidated into Opportunity Rooms. This route stays alive for old links but renders the same canonical deal room lane."
      kind="opportunity"
      rooms={rooms}
    />
  );
}