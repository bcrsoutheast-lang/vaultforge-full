import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CommandPage() {
  return (
    <VaultForgeCleanShell
      active="command"
      eyebrow="COMMAND CENTER"
      title="Fresh command build."
      subtitle="This is the clean product path. No old Opportunity, Projects, Pain Feed, Pressure, or duplicate room engine routes."
    >
      <section className="vf-grid">
        <article className="vf-card">
          <div className="vf-eyebrow">DEAL ROOMS</div>
          <h2 className="vf-h2">Opportunities</h2>
          <p className="vf-copy">
            All deal-related work lives here: properties, projects, flips, buy-holds,
            development, wholesale, investor opportunities, and underwriting.
          </p>
          <div className="vf-btns">
            <Link className="vf-btn" href="/deal-rooms">Open Deal Rooms</Link>
          </div>
        </article>

        <article className="vf-card red">
          <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>PAIN ROOMS</div>
          <h2 className="vf-h2">Execution pressure</h2>
          <p className="vf-copy">
            Pain Rooms handle distress, funding gaps, stalled projects, operator failures,
            seller pressure, and urgent problem solving.
          </p>
          <div className="vf-btns">
            <Link className="vf-btn" href="/pain-intake">Submit Pain</Link>
            <Link className="vf-btn dark" href="/pain-rooms">Open Pain Rooms</Link>
          </div>
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
        </article>
      </section>
    </VaultForgeCleanShell>
  );
}