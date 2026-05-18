import VaultForgeCleanShell from "../components/VaultForgeCleanShell";
import VaultForgeRoomFolderClient from "../components/VaultForgeRoomFolderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SavedRoomsPage() {
  return (
    <VaultForgeCleanShell
      active="saved"
      eyebrow="5S FOLDER"
      title="Saved Rooms"
      subtitle="Saved rooms are intentionally monitored. Use Archive or Delete when they no longer belong in saved workflow."
    >
      <VaultForgeRoomFolderClient folder="saved" />
    </VaultForgeCleanShell>
  );
}