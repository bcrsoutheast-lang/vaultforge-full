"use client";

import VaultForgeRoomDesk from "../../components/VaultForgeRoomDesk";

export default function FolderPage() {
  return (
    <VaultForgeRoomDesk
      lane="opportunity"
      title="Opportunity Rooms · Needs Capital"
      subtitle="Opportunity rooms that need lender, private capital, JV equity, or funding structure."
      defaultFolder="needs_capital"
    />
  );
}
