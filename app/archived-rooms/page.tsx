import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeRoomFolderClient from "../components/VaultForgeRoomFolderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ArchivedRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="archived"
      eyebrow="5S FOLDER"
      title="Archived Rooms"
      subtitle="Archived rooms are completed, reviewed, or parked. Delete from Archive if they should leave this folder."
    >
      <VaultForgeRoomFolderClient folder="archived" />
    </VaultForgeCleanShell>
  );
}