export function getSessionEmailFromRequest(req: Request) {
  const email =
    req.headers.get("x-vf-email") ||
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  if (email && email.includes("@")) {
    return email.trim().toLowerCase();
  }

  return "";
}
