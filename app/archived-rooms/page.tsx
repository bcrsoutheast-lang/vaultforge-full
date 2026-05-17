import VaultForgeRoomFolderPage from "../components/VaultForgeRoomFolderPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ArchivedRoomsPage() {
  return (
    <VaultForgeRoomFolderPage
      status="archived"
      title="Archived Rooms."
      subtitle="Completed or parked rooms. They stay out of Active until restored."
    />
  );
}
