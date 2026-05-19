"use client";

import React, { useState } from "react";

type DealForm = {
  title: string;
  city: string;
  state: string;
  assetClass: string;
  propertyType: string;
  askPrice: string;
  arv: string;
  repairs: string;
  timeline: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
};

function stopSpaceBug(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
) {
  if (e.key === "Tab") {
    e.preventDefault();
  }
}

export default function DealCreatePage() {
  const [form, setForm] = useState<DealForm>({
    title: "",
    city: "",
    state: "GA",
    assetClass: "Residential",
    propertyType: "",
    askPrice: "",
    arv: "",
    repairs: "",
    timeline: "",
    contactName: "",
    phone: "",
    email: "",
    notes: "",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,215,0,.15)",
    background: "#0d1424",
    color: "#fff",
    fontSize: 16,
    outline: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070d",
        color: "#fff",
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <section
          style={{
            border: "1px solid rgba(255,215,0,.2)",
            borderRadius: 24,
            padding: 28,
            background:
              "linear-gradient(135deg, rgba(10,14,30,.96), rgba(5,7,13,.98))",
          }}
        >
          <div
            style={{
              color: "#f5d15f",
              letterSpacing: 6,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            DEAL OPPORTUNITY
          </div>

          <h1
            style={{
              fontSize: 56,
              lineHeight: 1,
              margin: 0,
              fontWeight: 900,
            }}
          >
            Create Deal Room
          </h1>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
          }}
        >
          <input
            style={inputStyle}
            placeholder="Deal Title"
            value={form.title}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="City"
            value={form.city}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
          />

          <select
            style={inputStyle}
            value={form.state}
            onChange={(e) =>
              setForm({ ...form, state: e.target.value })
            }
          >
            <option>GA</option>
            <option>TN</option>
            <option>AL</option>
            <option>FL</option>
            <option>NC</option>
            <option>SC</option>
            <option>TX</option>
          </select>

          <select
            style={inputStyle}
            value={form.assetClass}
            onChange={(e) =>
              setForm({ ...form, assetClass: e.target.value })
            }
          >
            <option>Residential</option>
            <option>Commercial</option>
            <option>Land</option>
          </select>

          <input
            style={inputStyle}
            placeholder="Property Type"
            value={form.propertyType}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, propertyType: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Ask Price"
            value={form.askPrice}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, askPrice: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="ARV / Value"
            value={form.arv}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, arv: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Repairs"
            value={form.repairs}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, repairs: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Timeline"
            value={form.timeline}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, timeline: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Contact Name"
            value={form.contactName}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, contactName: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Phone"
            value={form.phone}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Email"
            value={form.email}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <textarea
            style={{ ...inputStyle, minHeight: 160 }}
            placeholder="Notes / AI Context"
            value={form.notes}
            onKeyDown={stopSpaceBug}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
          />
        </section>
      </div>
    </main>
  );
}
