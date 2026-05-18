import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeRoomControls from "../components/VaultForgeRoomControls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DealRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="deals"
      eyebrow="DEAL ROOMS"
      title="One deal lane."
      subtitle="Deals, projects, properties, opportunities, flips, buy-holds, land, commercial, and development all live here."
    >
      <section className="vf-grid">
        <div className="vf-metric"><span>Active rooms</span><strong>0</strong></div>
        <div className="vf-metric"><span>Buyer fit</span><strong>0</strong></div>
        <div className="vf-metric"><span>Capital fit</span><strong>0</strong></div>
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">ROOM ENGINE</div>
        <h2 className="vf-h2">Deal room intelligence stack.</h2>
        <p className="vf-copy">
          Each Deal Room should carry submitted numbers, photos, AI good/bad/next steps,
          underwriting, buyer fit, capital fit, operator fit, alert context, routing context,
          score, timeline, cleanup state, and room messages.
        </p>

        <div className="vf-btns">
          <Link className="vf-btn" href="/deal-create">Create Deal Opportunity</Link>
          <Link className="vf-btn dark" href="/messages">Messages</Link>
          <Link className="vf-btn dark" href="/command">Back to Command</Link>
        </div>

        <VaultForgeRoomControls roomId="deal-room:main" roomTitle="Main Deal Rooms Lane" roomType="deal" />
      </section>
    </VaultForgeCleanShell>
  );
}