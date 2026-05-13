"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PainFeedPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pain/feed", {
          cache: "no-store",
        });

        const data = await res.json();
        setItems(Array.isArray(data?.pains) ? data.pains : []);
      } catch (e) {
        console.error(e);
      }
    }

    load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "24px 16px 120px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            paddingBottom: 16,
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              background: "rgba(5,10,20,.82)",
              border: "1px solid rgba(232,196,107,.18)",
              borderRadius: 20,
              padding: 14,
            }}
          >
            <Link href="/dashboard" style={navBtn}>
              Dashboard
            </Link>

            <Link href="/projects" style={navBtn}>
              Projects
            </Link>

            <Link href="/pain" style={navBtn}>
              Submit Pain
            </Link>

            <Link href="/messages" style={navBtn}>
              Messages
            </Link>

            <Link href="/profile" style={navBtn}>
              Profile
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              color: "#e8c46b",
              fontWeight: 900,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            VaultForge Problem Solver Intelligence
          </div>

          <h1
            style={{
              fontSize: "clamp(50px,9vw,88px)",
              lineHeight: 0.92,
              margin: "10px 0 16px",
              letterSpacing: "-.06em",
            }}
          >
            Pain Feed
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              maxWidth: 1000,
              fontSize: 18,
              lineHeight: 1.5,
            }}
          >
            Operational problem rooms for distressed situations, funding gaps,
            contractor issues, stalled projects, exits, tenant issues, and
            execution bottlenecks.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
            gap: 18,
          }}
        >
          {items.map((item, index) => (
            <div
              key={`${item?.id || "pain"}-${index}`}
              style={{
                borderRadius: 28,
                overflow: "hidden",
                border: "1px solid rgba(232,196,107,.16)",
                background: "rgba(255,255,255,.04)",
              }}
            >
              {item?.main_photo_url ? (
                <img
                  src={item.main_photo_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: 240,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}

              <div style={{ padding: 22 }}>
                <h2 style={{ fontSize: 38, marginBottom: 12 }}>
                  {item?.title || item?.pain_title || "Pain Request"}
                </h2>

                <p
                  style={{
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                    marginBottom: 18,
                  }}
                >
                  {item?.summary ||
                    item?.description ||
                    item?.notes ||
                    "No summary yet."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/pain-room/${item?.id || ""}`}
                    style={mainBtn}
                  >
                    Open Room
                  </Link>

                  <Link
                    href={`/messages/new?pain=${item?.id || ""}`}
                    style={secondaryBtn}
                  >
                    Contact Owner
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const navBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 700,
};

const mainBtn: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 999,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#08120d",
  textDecoration: "none",
  fontWeight: 900,
};

const secondaryBtn: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};
