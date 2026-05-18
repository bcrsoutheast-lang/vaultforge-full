import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeProfileBloomberg from "../components/VaultForgeProfileBloomberg";
import VaultForgeRoomControls from "../components/VaultForgeRoomControls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProfilePage() {
  return (
    <VaultForgeCleanShell
      active="profile"
      eyebrow="MEMBER PROFILE"
      title="AI routing profile."
      subtitle="Chip-based profile setup for routing, alerts, states, markets, asset fit, member contact, and execution matching."
    >
      <VaultForgeProfileBloomberg />

      <section className="vf-card">
        <div className="vf-eyebrow">5S PROFILE CONTROL</div>
        <h2 className="vf-h2">Profile cleanup.</h2>
        <p className="vf-copy">
          Save, archive, or delete this profile marker from the clean 5S folders while database persistence is wired later.
        </p>

        <VaultForgeRoomControls
          roomId="profile:member-routing"
          roomTitle="Member AI Routing Profile"
          roomType="general"
        />
      </section>
    </VaultForgeCleanShell>
  );
}