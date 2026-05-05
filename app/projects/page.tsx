\"use client\";

import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [deals, setDeals] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/projects/list");
    const data = await res.json();
    setDeals(data.deals || []);
  }

  async function archive(id: string) {
    await fetch("/api/deal/archive", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch("/api/deal/delete", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function setFolder(id: string, folder: string) {
    await fetch("/api/deal/folder", {
      method: "POST",
      body: JSON.stringify({ id, folder }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>Projects</h1>

      <div style={{ display: "grid", gap: 20 }}>
        {deals.map((d) => (
          <div
            key={d.id}
            style={{
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 20,
              padding: 20,
              background: "rgba(255,255,255,.05)",
            }}
          >
            <h2>{d.title || "Untitled Deal"}</h2>

            <img
              src={d.main_photo_url || "/no-photo.png"}
              style={{ width: "100%", borderRadius: 12 }}
            />

            <p>Price: ${d.asking_price || "N/A"}</p>
            <p>ARV: ${d.arv || "N/A"}</p>
            <p>{d.city}, {d.state}</p>

            <select
              value={d.folder || "Active"}
              onChange={(e) => setFolder(d.id, e.target.value)}
            >
              <option>Active</option>
              <option>Hot</option>
              <option>Follow Up</option>
              <option>Needs Funding</option>
              <option>Passed</option>
            </select>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => archive(d.id)}>Archive</button>
              <button onClick={() => remove(d.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
