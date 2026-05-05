import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AlertsClient from "./AlertsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export default async function AlertsPage() {
  const cookieStore = await cookies();

  const email = cleanEmail(cookieStore.get("vf_email")?.value);
  const memberLogin = String(cookieStore.get("vf_member_login")?.value || "").trim();

  if (!email || memberLogin !== "1") {
    redirect("/login");
  }

  return <AlertsClient />;
}
