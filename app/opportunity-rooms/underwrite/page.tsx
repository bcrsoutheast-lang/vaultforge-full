"use client";

import VaultForgeRoomDesk from "../../components/VaultForgeRoomDesk";

export default function FolderPage() {
  return (
    <VaultForgeRoomDesk
      lane="opportunity"
      title="Opportunity Rooms · Underwrite"
      subtitle="Rooms that need numbers, ARV, repairs, photos, contact details, or structure review before routing."
      defaultFolder="underwrite"
    />
  );
}
