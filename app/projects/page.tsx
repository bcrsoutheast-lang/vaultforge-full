import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const rooms = await listRooms("opportunity");

  return (
    <VaultForgeRoomListPage
      title="Projects"
      subtitle="Project and deal rooms share the Opportunity lane. This page shows active opportunity records with clean front cards and opens the full execution room for the details."
      kind="opportunity"
      rooms={rooms}
    />
  );
}
