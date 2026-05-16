"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserEmail, isOwnerEmail } from "../lib/vf-owner";

const wrap: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.28)",
  borderRadius: 24,
  padding: 18,
  background: "linear-gradient(145deg,rgba(248,113,113,.09),rgba(255,255,255,.03))",
  marginBottom: 18,
};

const button: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 999,
  padding: "10px 14px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,.06)",
};

export default function VaultForgeOwnerControls() {
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    const email = getBrowserEmail();
    setOwner(isOwnerEmail(email));
  }, []);

  if (!owner) return null;

  return (
    <section style={wrap}>
      <div style={{
        color: "#fecaca",
        letterSpacing: ".16em",
        textTransform: "uppercase",
        fontWeight: 900,
        fontSize: 11,
        marginBottom: 12,
      }}>
        Owner Mode Active
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <Link href="/room-folders" style={button}>Room Control</Link>
        <Link href="/opportunity-rooms/hot" style={button}>Hot Rooms</Link>
        <Link href="/pressure-rooms/urgent" style={button}>Critical Pressure</Link>
        <Link href="/messages" style={button}>Review Messages</Link>
        <Link href="/members" style={button}>Member Network</Link>
      </div>

      <p style={{
        color: "#cbd5e1",
        marginTop: 14,
        lineHeight: 1.55,
      }}>
        When logged in as bcrsoutheast@gmail.com, VaultForge automatically exposes owner controls inside the normal member system instead of using a separate admin universe.
      </p>
    </section>
  );
}
