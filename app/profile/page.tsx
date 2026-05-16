"use client";

import { useEffect } from "react";

export default function ProfileRedirectPage() {
  useEffect(() => {
    window.location.replace("/profile-dashboard");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020303",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      Opening Member Profile...
    </main>
  );
}
