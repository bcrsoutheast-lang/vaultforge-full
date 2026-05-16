"use client";

import { useEffect } from "react";

export default function ProfileRedirect() {
  useEffect(() => {
    window.location.replace("/dashboard");
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#020303",
      color: "white",
      padding: 30,
      fontFamily: "Arial, sans-serif"
    }}>
      Opening Dashboard...
    </main>
  );
}
