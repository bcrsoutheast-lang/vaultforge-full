"use client";

import VaultForgeRoomDesk from "../components/VaultForgeRoomDesk";

export default function OpportunityRoomsPage() {
  return (
    <VaultForgeRoomDesk
      lane="opportunity"
      title="Opportunity Rooms"
      subtitle="Upside lane: acquisition, underwriting, capital, buyer fit, operator route, exit strategy, and money movement. Every opportunity has a folder."
      defaultFolder="active"
    />
  );
}
