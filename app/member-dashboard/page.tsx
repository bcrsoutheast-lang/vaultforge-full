"use client";

import { useEffect } from "react";

export default function MemberDashboardRedirect() {
  useEffect(() => {
    window.location.replace("/dashboard");
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
      Opening Command Center...
    </main>
  );
}
