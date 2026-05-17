import VaultForgeRoomFolderPage from "../components/VaultForgeRoomFolderPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SavedRoomsPage() {
  return (
    <VaultForgeRoomFolderPage
      status="saved"
      title="Saved Rooms."
      subtitle="Rooms saved for follow-up. They stay out of Active until restored."
    />
  );
}
