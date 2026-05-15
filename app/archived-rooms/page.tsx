"use client";

import VaultForgeRoomDesk from "../components/VaultForgeRoomDesk";

export default function ArchivedRoomsPage() {
  return (
    <VaultForgeRoomDesk
      lane="all"
      title="Archived Rooms"
      subtitle="Archived room control: completed, paused, or parked work that should not clutter active flow."
      defaultFolder="archived"
    />
  );
}
