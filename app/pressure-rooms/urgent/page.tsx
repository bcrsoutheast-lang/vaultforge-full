"use client";

import VaultForgeRoomDesk from "../../components/VaultForgeRoomDesk";

export default function FolderPage() {
  return (
    <VaultForgeRoomDesk
      lane="pressure"
      title="Pressure Rooms · Urgent"
      subtitle="Critical pressure rooms with high urgency, deadline risk, collapse risk, or immediate action need."
      defaultFolder="urgent"
    />
  );
}
