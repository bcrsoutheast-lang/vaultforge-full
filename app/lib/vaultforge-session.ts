export function getSessionEmailFromRequest(req: Request) {
  const headerEmail =
    req.headers.get("x-vf-email") ||
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  if (headerEmail && headerEmail.includes("@")) {
    return headerEmail.trim().toLowerCase();
  }

  // Final fallback for older browser sessions only.
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const name of ["vf_user", "vf_email"]) {
    const found = parts.find((part) => part.startsWith(`${name}=`));
    if (found) {
      const value = decodeURIComponent(found.slice(name.length + 1));
      if (value && value.includes("@")) return value.trim().toLowerCase();
    }
  }

  return "";
}
