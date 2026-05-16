"use client";

import { useEffect } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

function label(value: string) {
  return clean(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PressureFolderRedirectPage({
  params,
}: {
  params: { folder: string };
}) {
  useEffect(() => {
    const folder = clean(params?.folder || "active");
    window.location.replace(`/pressure-rooms?folder=${encodeURIComponent(folder)}`);
  }, [params?.folder]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020303",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      Opening Pressure Folder: {label(params?.folder || "active")}...
    </main>
  );
}
