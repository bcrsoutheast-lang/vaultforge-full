"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CardStatus =
  | "new"
  | "active"
  | "execution"
  | "saved"
  | "archived"
  | "passed"
  | "deleted";

type Lane = "deal" | "pain" | "request" | "execution" | "cleanup";

type DeskCard = {
  id: string;
  title: string;
  message: string;
  lane: Lane;
  status: CardStatus;
  sender: string;
  state: string;
  createdAt: number;
  image?: string;
  source: "member";
};

const STORAGE_KEY = "vaultforge_member_cards_v2";

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 84px",
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const nav: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginBottom: 22,
  flexWrap: "wrap",
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(20,20,30,.6)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
};

function load(): DeskCard[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(cards: DeskCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export default function MemberControlledThreadsPage() {
  const [cards, setCards] = useState<DeskCard[]>([]);
  const [lane, setLane] = useState<Lane>("deal");

  useEffect(() => {
    setCards(load());
  }, []);

  const grouped = useMemo(() => {
    return {
      deal: cards.filter((c) => c.lane === "deal" && c.status !== "deleted"),
      pain: cards.filter((c) => c.lane === "pain" && c.status !== "deleted"),
      request: cards.filter((c) => c.lane === "request" && c.status !== "deleted"),
      execution: cards.filter((c) => c.lane === "execution" && c.status !== "deleted"),

      cleanup: cards.filter(
        (c) =>
          c.status !== "deleted" &&
          ["saved", "archived", "passed"].includes(c.status)
      ),

      deleted: cards.filter((c) => c.status === "deleted"),
    };
  }, [cards]);

  function updateStatus(id: string, status: CardStatus) {
    const next = cards.map((c) =>
      c.id === id ? { ...c, status } : c
    );
    setCards(next);
    save(next);
  }

  function hardDelete(id: string) {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    save(next);
  }

  // ✅ FIX: no "deleted" lane usage anymore
  const visible =
    lane === "cleanup"
      ? grouped.cleanup
      : grouped[lane] || [];

  return (
    <main style={wrap}>
      <div style={shell}>
        <nav style={nav}>
          <Link style={btn} href="/command">Command</Link>
          <Link style={btn} href="/messages">Messages</Link>
          <Link style={btn} href="/my-rooms">My Rooms</Link>
        </nav>

        <div style={nav}>
          <button style={btn} onClick={() => setLane("deal")}>
            Deals ({grouped.deal.length})
          </button>
          <button style={btn} onClick={() => setLane("pain")}>
            Pains ({grouped.pain.length})
          </button>
          <button style={btn} onClick={() => setLane("request")}>
            Requests ({grouped.request.length})
          </button>
          <button style={btn} onClick={() => setLane("execution")}>
            Execution ({grouped.execution.length})
          </button>
          <button style={btn} onClick={() => setLane("cleanup")}>
            Cleanup
          </button>

          {/* FIXED: no invalid lane */}
          <button style={btn} onClick={() => setLane("cleanup")}>
            Deleted
          </button>
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 900 }}>
          Member Threads
        </h1>

        <div style={{ display: "grid", gap: 12 }}>
          {visible.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 14,
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 800 }}>{c.title}</div>
              <div style={{ opacity: 0.7 }}>{c.message}</div>

              {c.image && (
                <img
                  src={c.image}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    borderRadius: 10,
                  }}
                />
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={btn} onClick={() => updateStatus(c.id, "active")}>
                  Active
                </button>
                <button style={btn} onClick={() => updateStatus(c.id, "saved")}>
                  Save
                </button>
                <button style={btn} onClick={() => updateStatus(c.id, "archived")}>
                  Archive
                </button>
                <button style={btn} onClick={() => updateStatus(c.id, "deleted")}>
                  Delete
                </button>
                <button style={btn} onClick={() => hardDelete(c.id)}>
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
    );
}


