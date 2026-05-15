"use client";

import VaultForgeRoomDesk from "../components/VaultForgeRoomDesk";

export default function SavedRoomsPage() {
  return (
    <VaultForgeRoomDesk
      lane="all"
      title="Saved Rooms"
      subtitle="Saved room control: keep the items worth tracking, then route, archive, or delete when the work changes."
      defaultFolder="saved"
    />
  );
}
