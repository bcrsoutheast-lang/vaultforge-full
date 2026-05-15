"use client";

import VaultForgeRoomDesk from "../../components/VaultForgeRoomDesk";

export default function FolderPage() {
  return (
    <VaultForgeRoomDesk
      lane="pressure"
      title="Pressure Rooms · Solved"
      subtitle="Pressure rooms marked solved, resolved, closed, or stabilized."
      defaultFolder="solved"
    />
  );
}
