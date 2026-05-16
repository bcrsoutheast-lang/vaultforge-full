"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserEmail, isOwnerEmail } from "../lib/vf-owner";

const wrap: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.26)",
  borderRadius: 22,
  padding: 16,
  background: "linear-gradient(145deg,rgba(248,113,113,.08),rgba(255,255,255,.03))",
  marginBottom: 18,
};

const button: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 999,
  padding: "10px 14px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,.06)",
};

export default function VaultForgeHiddenOwnerBar() {
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    const email = getBrowserEmail();
    setOwner(isOwnerEmail(email));
  }, []);

  if (!owner) return null;

  return (
    <section style={wrap}>
      <div
        style={{
          color: "#fecaca",
          letterSpacing: ".16em",
          textTransform: "uppercase",
          fontWeight: 900,
          fontSize: 11,
          marginBottom: 12,
        }}
      >
        Hidden Owner Mode
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <Link href="/room-folders" style={button}>Room Control</Link>
        <Link href="/opportunity-rooms/hot" style={button}>Hot Rooms</Link>
        <Link href="/pressure-rooms/urgent" style={button}>Critical Pressure</Link>
        <Link href="/messages" style={button}>Review Messages</Link>
        <Link href="/members" style={button}>Network</Link>
      </div>

      <p
        style={{
          color: "#cbd5e1",
          lineHeight: 1.55,
          marginTop: 14,
          marginBottom: 0,
        }}
      >
        Members see the full VaultForge operating system. Owner tools stay hidden unless logged in as the owner email.
      </p>
    </section>
  );
}
