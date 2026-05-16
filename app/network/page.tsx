"use client";

import { useEffect } from "react";

export default function NetworkRedirectPage() {
  useEffect(() => {
    window.location.replace("/members");
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#020303", color: "white", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif" }}>
      Opening Network...
    </main>
  );
}
