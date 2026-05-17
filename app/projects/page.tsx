import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const rooms = await listRooms("opportunity");

  return (
    <VaultForgeRoomListPage
      title="Projects"
      subtitle="Projects and deals share the Opportunity lane. This page opens the same full execution rooms with deal numbers, AI analysis, routing context, profiles, and alerts inside."
      kind="opportunity"
      rooms={rooms}
    />
  );
}
