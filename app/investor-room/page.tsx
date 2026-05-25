"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "deals" | "pain" | "saved" | "archived" | "deleted";
type Status = "active" | "saved" | "archived" | "deleted";
type Kind = "deal" | "pain";

type Card = {
  id: string;
  title: string;
  kind: Kind;
  status: Status;
  city: string;
  county: string;
  state: string;
  summary: string;
  source: string;
};

const STORAGE = "vf_investor_status_v2";

function parse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function text(v: any, fallback = "") {
  const s = String(v || "").trim();
  return s || fallback;
}

function getStatus(item: any): Status {
  const s = String(
    item?.investorStatus ||
      item?.workspaceStatus ||
      item?.roomStatus ||
      item?.folder ||
      item?.status ||
      "active"
  ).toLowerCase();

  if (s.includes("delete")) return "deleted";
  if (s.includes("archive")) return "archived";
  if (s.includes("save")) return "saved";
  return "active";
}

function loadCards(): Card[] {
  if (typeof window === "undefined") return [];

  const overrides = parse(window.localStorage.getItem(STORAGE)) || {};

  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i) || "";
    const lower = key.toLowerCase();

    if (
      lower.includes("deal") ||
      lower.includes("pain") ||
      lower.includes("room") ||
      lower.includes("project")
    ) {
      if (
        !lower.includes("activity") &&
        !lower.includes("history") &&
        !lower.includes("log")
      ) {
        keys.push(key);
      }
    }
  }

  const map = new Map<string, Card>();

  keys.forEach((key) => {
    const data = parse(window.localStorage.getItem(key));

    const rows = Array.isArray(data)
      ? data
      : data && typeof data === "object"
      ? Object.values(data).flat()
      : [];

    rows.forEach((item: any, idx: number) => {
      if (!item || typeof item !== "object") return;

      const blob = JSON.stringify(item).toLowerCase();

      const kind: Kind =
        blob.includes("pain") ||
        blob.includes("problem") ||
        blob.includes("distress")
          ? "pain"
          : "deal";

      const title =
        text(
          item.title ||
            item.projectName ||
            item.propertyName ||
            item.dealTitle ||
            item.name
        ) || (kind === "pain" ? "Pain Signal" : "Deal Signal");

      const id =
        text(item.id || item.roomId || item.slug) ||
        `${kind}-${title}-${idx}`;

      const card: Card = {
        id,
        title,
        kind,
        status: overrides[id] || getStatus(item),
        city: text(item.city),
        county: text(item.county),
        state: text(item.state || item.market || item.propertyState, "NA"),
        summary:
          text(
            item.summary ||
              item.notes ||
              item.description ||
              item.message
          ) ||
          (kind === "pain"
            ? "Pain/problem submitted for review."
            : "Deal opportunity submitted for review."),
        source: key,
      };

      map.set(id, card);
    });
  });

  return Array.from(map.values());
}

export default function InvestorRoomPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [lane, setLane] = useState<Lane>("deals");
  const [openCard, setOpenCard] = useState<Card | null>(null);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  const grouped = useMemo(() => {
    return {
      deals: cards.filter(
        (c) => c.kind === "deal" && c.status !== "deleted"
      ),
      pain: cards.filter(
        (c) => c.kind === "pain" && c.status !== "deleted"
      ),
      saved: cards.filter((c) => c.status === "saved"),
      archived: cards.filter((c) => c.status === "archived"),
      deleted: cards.filter((c) => c.status === "deleted"),
    };
  }, [cards]);

  const visible =
    lane === "deals"
      ? grouped.deals
      : lane === "pain"
      ? grouped.pain
      : lane === "saved"
      ? grouped.saved
      : lane === "archived"
      ? grouped.archived
      : grouped.deleted;

  function updateStatus(id: string, status: Status) {
    const overrides = parse(window.localStorage.getItem(STORAGE)) || {};
    overrides[id] = status;
    window.localStorage.setItem(STORAGE, JSON.stringify(overrides));

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );

    if (openCard?.id === id) {
      setOpenCard({ ...openCard, status });
    }
  }

  function deleteForever(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setOpenCard(null);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070b",
        color: "#fff",
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Link href="/" style={btn()}>
            Home
          </Link>
          <Link href="/investor-room" style={gold()}>
            Investor Room
          </Link>
          <Link href="/messages" style={btn()}>
            Messages
          </Link>
        </div>

        <section style={section()}>
          <div style={eyebrow()}>Investor Alerts</div>

          <div style={grid()}>
            <button style={tile()} onClick={() => setLane("deals")}>
              <div style={eyebrow()}>Deals</div>
              <div style={count()}>{grouped.deals.length}</div>
              <div>Deal opportunity cards</div>
            </button>

            <button style={tile()} onClick={() => setLane("pain")}>
              <div style={eyebrow()}>Pain</div>
              <div style={count()}>{grouped.pain.length}</div>
              <div>Pain/problem cards</div>
            </button>

            <button style={tile()} onClick={() => setLane("saved")}>
              <div style={eyebrow()}>Saved</div>
              <div style={count()}>{grouped.saved.length}</div>
              <div>Saved cards</div>
            </button>

            <button style={tile()} onClick={() => setLane("archived")}>
              <div style={eyebrow()}>Archived</div>
              <div style={count()}>{grouped.archived.length}</div>
              <div>Archived cards</div>
            </button>

            <button style={tile()} onClick={() => setLane("deleted")}>
              <div style={eyebrow()}>Deleted</div>
              <div style={count()}>{grouped.deleted.length}</div>
              <div>Delete forever support</div>
            </button>
          </div>
        </section>

        {openCard ? (
          <section style={section()}>
            <div style={eyebrow()}>
              {openCard.kind} • {openCard.status}
            </div>

            <h2 style={{ fontSize: 42, margin: "10px 0" }}>
              {openCard.title}
            </h2>

            <div style={{ opacity: 0.8, marginBottom: 12 }}>
              {[openCard.city, openCard.county, openCard.state]
                .filter(Boolean)
                .join(", ")}
            </div>

            <p style={{ lineHeight: 1.6 }}>{openCard.summary}</p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                style={gold()}
                onClick={() => updateStatus(openCard.id, "active")}
              >
                Active
              </button>

              <button
                style={btn()}
                onClick={() => updateStatus(openCard.id, "saved")}
              >
                Save
              </button>

              <button
                style={btn()}
                onClick={() => updateStatus(openCard.id, "archived")}
              >
                Archive
              </button>

              <button
                style={danger()}
                onClick={() => updateStatus(openCard.id, "deleted")}
              >
                Delete
              </button>

              {openCard.status === "deleted" ? (
                <button
                  style={danger()}
                  onClick={() => deleteForever(openCard.id)}
                >
                  Delete Forever
                </button>
              ) : null}

              <button style={btn()} onClick={() => setOpenCard(null)}>
                Close
              </button>
            </div>
          </section>
        ) : null}

        <section style={section()}>
          <div style={eyebrow()}>{lane}</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(280px,1fr))",
              gap: 14,
            }}
          >
            {visible.map((card) => (
              <button
                key={card.id}
                onClick={() => setOpenCard(card)}
                style={{
                  textAlign: "left",
                  border: "1px solid rgba(245,197,66,.35)",
                  background: "rgba(17,23,36,.78)",
                  borderRadius: 22,
                  padding: 20,
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <div style={eyebrow()}>
                  {card.kind} • {card.state}
                </div>

                <h3 style={{ fontSize: 28, color: "#1e90ff" }}>
                  {card.title}
                </h3>

                <div style={{ opacity: 0.8, marginBottom: 10 }}>
                  {[card.city, card.county, card.state]
                    .filter(Boolean)
                    .join(", ")}
                </div>

                <div style={{ lineHeight: 1.5 }}>
                  {card.summary}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    color: "#ffda5e",
                    fontWeight: 700,
                  }}
                >
                  Open Details
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function section(): React.CSSProperties {
  return {
    border: "1px solid rgba(207,216,230,.16)",
    borderRadius: 24,
    background: "rgba(15,21,34,.88)",
    padding: 24,
    marginBottom: 20,
  };
}

function grid(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 14,
    marginTop: 16,
  };
}

function tile(): React.CSSProperties {
  return {
    border: "1px solid rgba(245,197,66,.35)",
    borderRadius: 22,
    background: "rgba(17,23,36,.78)",
    padding: 20,
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
  };
}

function count(): React.CSSProperties {
  return {
    fontSize: 42,
    fontWeight: 900,
    color: "#1e90ff",
    margin: "8px 0",
  };
}

function eyebrow(): React.CSSProperties {
  return {
    color: "#ffda5e",
    textTransform: "uppercase",
    letterSpacing: ".34em",
    fontSize: 12,
    fontWeight: 900,
  };
}

function btn(): React.CSSProperties {
  return {
    border: "1px solid rgba(207,216,230,.18)",
    background: "rgba(18,24,38,.92)",
    color: "#fff",
    borderRadius: 999,
    padding: "12px 18px",
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
  };
}

function gold(): React.CSSProperties {
  return {
    ...btn(),
    background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
    color: "#080a10",
  };
}

function danger(): React.CSSProperties {
  return {
    ...btn(),
    background: "rgba(90,10,18,.72)",
    color: "#ffb2b2",
    border: "1px solid rgba(255,65,65,.65)",
  };
}
