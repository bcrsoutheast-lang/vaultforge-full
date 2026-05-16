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

function readCookieValue(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function storageValue(storage: Storage | null, key: string) {
  if (!storage) return "";
  try {
    return cleanEmail(storage.getItem(key));
  } catch {
    return "";
  }
}

export function getBrowserEmail() {
  if (typeof window === "undefined") return "";

  /*
    IMPORTANT:
    Member identity must win over old owner/admin leftovers.

    The bug was:
    vf_email could still contain bcrsoutheast@gmail.com from a prior owner login
    while the active member was dm... in memberEmail/vf_member_email.

    So current member keys are checked first.
  */
  const priorityKeys = [
    "memberEmail",
    "vf_member_email",
    "current_member_email",
    "currentEmail",
    "userEmail",
    "email",
    "vf_email",
    "vf_admin_email",
  ];

  for (const key of priorityKeys) {
    const localValue = storageValue(window.localStorage, key);
    if (localValue.includes("@")) return localValue;

    const sessionValue = storageValue(window.sessionStorage, key);
    if (sessionValue.includes("@")) return sessionValue;
  }

  const cookieKeys = [
    "vf_member_email",
    "memberEmail",
    "current_member_email",
    "email",
    "vf_email",
    "vf_admin_email",
  ];

  for (const key of cookieKeys) {
    const cookieValue = cleanEmail(readCookieValue(key));
    if (cookieValue.includes("@")) return cookieValue;
  }

  return "";
}

export function getAllBrowserEmails() {
  if (typeof window === "undefined") return [];

  const keys = [
    "memberEmail",
    "vf_member_email",
    "current_member_email",
    "currentEmail",
    "userEmail",
    "email",
    "vf_email",
    "vf_admin_email",
  ];

  const found: string[] = [];

  for (const key of keys) {
    const localValue = storageValue(window.localStorage, key);
    if (localValue.includes("@")) found.push(localValue);

    const sessionValue = storageValue(window.sessionStorage, key);
    if (sessionValue.includes("@")) found.push(sessionValue);

    const cookieValue = cleanEmail(readCookieValue(key));
    if (cookieValue.includes("@")) found.push(cookieValue);
  }

  return Array.from(new Set(found));
}

export function isOwnerBrowser() {
  const activeEmail = getBrowserEmail();

  /*
    Owner mode is based on the active/current email only.
    Old owner values elsewhere no longer unlock owner controls.
  */
  return isOwnerEmail(activeEmail);
}
