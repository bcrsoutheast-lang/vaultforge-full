import { cookies } from "next/headers";

export function getSessionEmailFromRequest(req: Request) {
  const headerEmail =
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  if (headerEmail && headerEmail.includes("@")) {
    return headerEmail.trim().toLowerCase();
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const cookieParts = cookieHeader.split(";").map((part) => part.trim());

  for (const name of ["vf_user", "vf_email"]) {
    const found = cookieParts.find((part) => part.startsWith(`${name}=`));
    if (found) {
      const value = decodeURIComponent(found.slice(name.length + 1));
      if (value && value.includes("@")) return value.trim().toLowerCase();
    }
  }

  return "";
}

export function getSessionEmailFromServerCookies() {
  const store = cookies();
  const value =
    store.get("vf_user")?.value ||
    store.get("vf_email")?.value ||
    "";

  if (value && value.includes("@")) return value.trim().toLowerCase();

  return "";
}
