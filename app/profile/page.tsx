import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeProfileClient from "../components/VaultForgeProfileClient";
import VaultForgeRoomControls from "../components/VaultForgeRoomControls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProfilePage() {
  return (
    <VaultForgeCleanShell
      active="profile"
      eyebrow="MEMBER PROFILE"
      title="AI routing profile."
      subtitle="Collect the data VaultForge needs to route deals, pain rooms, alerts, intros, and member contact opportunities by actual fit and room information."
    >
      <VaultForgeProfileClient />

      <section className="vf-card">
        <div className="vf-eyebrow">5S PROFILE CONTROL</div>
        <h2 className="vf-h2">Profile cleanup</h2>
        <p className="vf-copy">
          Profile can be saved, archived, or deleted from local cleanup folders while the Supabase profile route is reconnected later.
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