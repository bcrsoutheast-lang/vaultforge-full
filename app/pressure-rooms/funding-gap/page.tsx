"use client";

import VaultForgeRoomDesk from "../../components/VaultForgeRoomDesk";

export default function FolderPage() {
  return (
    <VaultForgeRoomDesk
      lane="pressure"
      title="Pressure Rooms · Funding Gap"
      subtitle="Pressure rooms blocked by capital, funding gaps, lender issues, payoff pressure, or liquidity."
      defaultFolder="needs_capital"
    />
  );
}
