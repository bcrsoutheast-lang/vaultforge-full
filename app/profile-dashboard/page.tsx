"use client";

import { useEffect } from "react";

export default function RedirectToDashboard() {
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
      Redirecting to Command Center...
    </main>
  );
}
