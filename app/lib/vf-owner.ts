export const OWNER_EMAIL = "bcrsoutheast@gmail.com";

export function clean(value: unknown) {
  return String(value || "").trim();
}

export function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

export function isOwnerEmail(email?: string | null) {
  return cleanEmail(email) === OWNER_EMAIL;
}

export function getBrowserEmail() {
  if (typeof window === "undefined") return "";

  const keys = [
    "vf_email",
    "vf_member_email",
    "vf_admin_email",
    "email",
    "memberEmail",
  ];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  const cookieMatch = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("vf_email="));

  if (cookieMatch) {
    return cleanEmail(cookieMatch.split("=")[1]);
  }

  return "";
}
