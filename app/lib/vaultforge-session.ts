export function getSessionEmailFromRequest(req: Request) {
  const clean = (value: unknown) =>
    String(value || "").trim().toLowerCase();

  const valid = (value: string) =>
    value.includes("@") && value !== "test@test.com";

  // Preferred live headers.
  const headerCandidates = [
    req.headers.get("x-vf-email"),
    req.headers.get("x-vf-user-email"),
    req.headers.get("x-vaultforge-email"),
  ];

  for (const value of headerCandidates) {
    const email = clean(value);

    if (valid(email)) {
      return email;
    }
  }

  // Canonical live cookies only.
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());

  const cookieNames = [
    "vf_email",
    "vf_member_email",
    "vf_login_email",
    "vf_admin_email",
  ];

  for (const name of cookieNames) {
    const found = parts.find((part) =>
      part.startsWith(`${name}=`)
    );

    if (!found) continue;

    const value = clean(
      decodeURIComponent(found.slice(name.length + 1))
    );

    if (valid(value)) {
      return value;
    }
  }

  return "";
}
