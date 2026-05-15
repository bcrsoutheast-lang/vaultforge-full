"use client";

import { useEffect } from "react";

export default function ProjectsRedirectPage() {
  useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`/workstations${query}`);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#020303", color: "white", padding: 30, fontFamily: "Arial, sans-serif" }}>
      Opening Workstations...
    </main>
  );
}
