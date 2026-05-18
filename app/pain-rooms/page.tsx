import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeRoomControls from "../components/VaultForgeRoomControls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PainRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="pain-rooms"
      eyebrow="PAIN ROOMS"
      title="Execution pressure lives here."
      subtitle="Pain Rooms are VaultForge’s moat: distress, funding gaps, stalled jobs, seller pressure, operator issues, and urgent problem solving."
    >
      <section className="vf-grid">
        <div className="vf-metric"><span>Active rooms</span><strong>0</strong></div>
        <div className="vf-metric"><span>Capital gaps</span><strong>0</strong></div>
        <div className="vf-metric"><span>Operator needs</span><strong>0</strong></div>
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>EXECUTION ENGINE</div>
        <h2 className="vf-h2">Pain Rooms should outshine Deal Rooms.</h2>
        <p className="vf-copy">
          Each Pain Room needs urgency, blocker, risk, deadline, capital need,
          AI diagnosis, matched profiles, next steps, owner control, and room-context messages.
        </p>
        <div className="vf-btns">
          <Link className="vf-btn" href="/pain-intake">Submit Pain</Link>
          <Link className="vf-btn dark" href="/messages">Messages</Link>
        </div>

        <VaultForgeRoomControls roomId="pain-room:main" roomTitle="Main Pain Rooms Lane" roomType="pain" />
      </section>
    </VaultForgeCleanShell>
  );
}