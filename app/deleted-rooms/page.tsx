"use client";

import VaultForgeRoomDesk from "../components/VaultForgeRoomDesk";

export default function DeletedRoomsPage() {
  return (
    <VaultForgeRoomDesk
      lane="all"
      title="Deleted Rooms"
      subtitle="Deleted room control: recover what was removed or empty the deleted folder to keep the system clean."
      defaultFolder="deleted"
    />
  );
}
