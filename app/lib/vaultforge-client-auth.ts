"use client";

export function getVaultForgeEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

export function setVaultForgeEmail(email: string) {
  if (typeof window === "undefined") return;
  const clean = email.trim().toLowerCase();
  window.localStorage.setItem("vf_email", clean);
  window.sessionStorage.setItem("vf_email", clean);
}

export function clearVaultForgeEmail() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("vf_email");
  window.sessionStorage.removeItem("vf_email");
}

export function vaultForgeHeaders() {
  const email = getVaultForgeEmail();
  return {
    "Content-Type": "application/json",
    "x-vf-email": email,
  };
}

export function requireVaultForgeEmail() {
  const email = getVaultForgeEmail();
  if (!email || !email.includes("@")) {
    return "";
  }
  return email;
}
