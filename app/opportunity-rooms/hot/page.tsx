"use client";

import VaultForgeRoomDesk from "../../components/VaultForgeRoomDesk";

export default function FolderPage() {
  return (
    <VaultForgeRoomDesk
      lane="opportunity"
      title="Opportunity Rooms · Hot"
      subtitle="High-priority upside rooms with stronger spread, urgency, or routing value."
      defaultFolder="hot"
    />
  );
}
