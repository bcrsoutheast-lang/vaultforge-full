import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeRoomFolderClient from "../components/VaultForgeRoomFolderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DeletedRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="deleted"
      eyebrow="5S FOLDER"
      title="Deleted Rooms"
      subtitle="Deleted rooms are hidden from active workflow. Restore them or delete from Deleted to remove the local cleanup marker."
    >
      <VaultForgeRoomFolderClient folder="deleted" />
    </VaultForgeCleanShell>
  );
}
