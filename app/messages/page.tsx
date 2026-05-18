import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MessagesPage() {
  return (
    <VaultForgeCleanShell
      active="messages"
      eyebrow="MESSAGES"
      title="One communication layer."
      subtitle="Messages connect to Deal Rooms and Pain Rooms only. No duplicate inboxes."
    >
      <section className="vf-card">
        <div className="vf-eyebrow">ROOM THREADS</div>
        <h2 className="vf-h2">Clean message command placeholder.</h2>
        <p className="vf-copy">
          Next build reconnects this to existing message persistence without bringing old routes back.
        </p>
      </section>
    </VaultForgeCleanShell>
  );
}