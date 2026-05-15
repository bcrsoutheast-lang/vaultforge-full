"use client";

import { useEffect } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

export default function OpportunityRoomRedirect() {
  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(clean(parts[parts.length - 1]));
    const query = new URLSearchParams(window.location.search);
    const finalId = clean(query.get("id")) || id;

    if (finalId) {
      window.location.replace(`/deal/detail?id=${encodeURIComponent(finalId)}`);
      return;
    }

    window.location.replace("/opportunity-rooms");
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#020303", color: "white", padding: 30, fontFamily: "Arial, sans-serif" }}>
      Opening Opportunity Room...
    </main>
  );
}
