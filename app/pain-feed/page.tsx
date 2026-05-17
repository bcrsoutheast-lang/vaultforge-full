import { listRooms } from "../lib/vaultforgeRoomHydration";
import { VaultForgeRoomListPage } from "../lib/vaultforgeRoomUI";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PainFeedPage() {
  const rooms = await listRooms("pressure");

  return (
    <VaultForgeRoomListPage
      title="Pain Rooms"
      subtitle="Pain Feed is consolidated into Pain Rooms. This route stays alive for old links but renders the same canonical pressure/problem execution lane."
      kind="pressure"
      rooms={rooms}
    />
  );
}