"use client";

import { useEffect } from "react";

export default function MemberDashboardRedirect() {
  useEffect(() => {
    window.location.replace("/profile-dashboard");
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#020303", color: "white", padding: 30, fontFamily: "Arial, sans-serif" }}>
      Opening Profile Dashboard...
    </main>
  );
}
