import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeDealRoomsClient from "../components/VaultForgeDealRoomsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DealRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="deals"
      eyebrow="DEAL ROOMS"
      title="One deal lane."
      subtitle="Saved opportunities from the Bloomberg intake appear here as clean Deal Room cards."
    >
      <section className="vf-card">
        <div className="vf-eyebrow">CREATE</div>
        <h2 className="vf-h2">Add a Residential, Commercial, or Land opportunity.</h2>
        <p className="vf-copy">
          Save a deal from the intake and it becomes a clean room card here.
        </p>

        <div className="vf-btns">
          <Link className="vf-btn" href="/deal-create">Create Deal Opportunity</Link>
          <Link className="vf-btn dark" href="/messages">Messages</Link>
          <Link className="vf-btn dark" href="/command">Back to Command</Link>
        </div>
      </section>

      <VaultForgeDealRoomsClient />
    </VaultForgeCleanShell>
  );
}