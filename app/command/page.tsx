import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeRoomControls from "../components/VaultForgeRoomControls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CommandPage() {
  return (
    <VaultForgeCleanShell
      active="command"
      eyebrow="COMMAND CENTER"
      title="Fresh command build."
      subtitle="Clean product path: Deal Rooms, Pain Intake, Pain Rooms, Messages, Profile, and 5S folders."
    >
      <section className="vf-grid">
        <article className="vf-card">
          <div className="vf-eyebrow">DEAL ROOMS</div>
          <h2 className="vf-h2">Opportunities</h2>
          <p className="vf-copy">
            Deals, properties, projects, flips, buy-holds, development, wholesale, underwriting, and execution.
          </p>
          <div className="vf-btns">
            <Link className="vf-btn" href="/deal-rooms">Open Deal Rooms</Link>
          </div>
          <VaultForgeRoomControls roomId="command:deal-lane" roomTitle="Deal Rooms Lane" roomType="deal" />
        </article>

        <article className="vf-card red">
          <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>PAIN ROOMS</div>
          <h2 className="vf-h2">Execution pressure</h2>
          <p className="vf-copy">
            Distress, funding gaps, stalled projects, operator failures, seller pressure, and urgent problem solving.
          </p>
          <div className="vf-btns">
            <Link className="vf-btn" href="/pain-intake">Submit Pain</Link>
            <Link className="vf-btn dark" href="/pain-rooms">Open Pain Rooms</Link>
          </div>
          <VaultForgeRoomControls roomId="command:pain-lane" roomTitle="Pain Rooms Lane" roomType="pain" />
        </article>

        <article className="vf-card">
          <div className="vf-eyebrow">PROFILE</div>
          <h2 className="vf-h2">AI matching data</h2>
          <p className="vf-copy">
            Member profile controls routing, alerts, contact priority, state/county fit, pain fit, deal fit, and matching quality.
          </p>
          <div className="vf-btns">
            <Link className="vf-btn" href="/profile">Complete Profile</Link>
          </div>
          <VaultForgeRoomControls roomId="command:profile" roomTitle="Profile Lane" roomType="general" />
        </article>

        <article className="vf-card">
          <div className="vf-eyebrow">MESSAGES</div>
          <h2 className="vf-h2">Room communication</h2>
          <p className="vf-copy">
            One communication layer for member, operator, lender, owner, and buyer conversations.
          </p>
          <div className="vf-btns">
            <Link className="vf-btn" href="/messages">Open Messages</Link>
          </div>
          <VaultForgeRoomControls roomId="command:messages" roomTitle="Messages Lane" roomType="general" />
        </article>
      </section>
    </VaultForgeCleanShell>
  );
}