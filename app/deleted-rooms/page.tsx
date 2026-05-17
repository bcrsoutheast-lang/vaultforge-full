import VaultForgeRoomFolderPage from "../components/VaultForgeRoomFolderPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DeletedRoomsPage() {
  return (
    <VaultForgeRoomFolderPage
      status="deleted"
      title="Deleted Rooms."
      subtitle="Hidden rooms removed from active workflow. Restore or permanently delete."
    />
  );
}
