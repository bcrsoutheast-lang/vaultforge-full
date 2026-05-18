import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgePainRoomsClient from "../components/VaultForgePainRoomsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PainRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="pain-rooms"
      eyebrow="PAIN ROOMS"
      title="Execution pressure lives here."
      subtitle="Saved Pain Intake submissions appear here as clean Pain Room cards."
    >
      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>CREATE</div>
        <h2 className="vf-h2">Submit a pressure signal.</h2>
        <p className="vf-copy">
          Save a pain intake and it becomes an execution room here.
        </p>

        <div className="vf-btns">
          <Link className="vf-btn" href="/pain-intake">Submit Pain</Link>
          <Link className="vf-btn dark" href="/messages">Messages</Link>
          <Link className="vf-btn dark" href="/command">Back to Command</Link>
        </div>
      </section>

      <VaultForgePainRoomsClient />
    </VaultForgeCleanShell>
  );
}