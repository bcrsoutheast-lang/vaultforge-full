"use client";

import { useEffect } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

export default function PressureRoomRedirect() {
  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(clean(parts[parts.length - 1]));

    if (id) {
      window.location.replace(`/pain-room/${encodeURIComponent(id)}`);
      return;
    }

    window.location.replace("/pressure-rooms");
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#020303", color: "white", padding: 30, fontFamily: "Arial, sans-serif" }}>
      Opening Pressure Room...
    </main>
  );
}
