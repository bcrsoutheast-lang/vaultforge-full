"use client";

import VaultForgeRoomDesk from "../components/VaultForgeRoomDesk";

export default function PressureRoomsPage() {
  return (
    <VaultForgeRoomDesk
      lane="pressure"
      title="Pressure Rooms"
      subtitle="Fix lane: distressed situations, funding gaps, contractor failures, title/legal pressure, urgency, execution failure, and resolution routing. Every pressure item has a folder."
      defaultFolder="active"
    />
  );
}
