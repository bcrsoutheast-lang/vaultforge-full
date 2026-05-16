
"use client";

export default function OpportunityRoomsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", padding: 20 }}>
      <h1 style={{ fontSize: 54, marginBottom: 10 }}>Opportunity Rooms</h1>

      <p style={{ color: "rgba(255,255,255,.7)", marginBottom: 30 }}>
        Full deal cards now live inside folders instead of the dashboard.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        {["Active","Hot","Underwrite","Needs Buyer","Needs Capital","Needs Operator","Saved","Archived"].map((folder)=>(
          <button
            key={folder}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(56,189,248,.4)",
              background: "rgba(56,189,248,.08)",
              color: "#7dd3fc",
              padding: "12px 18px",
              fontWeight: 800,
            }}
          >
            {folder}
          </button>
        ))}
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 22,
          padding: 24,
          background: "rgba(15,23,42,.75)",
        }}
      >
        Room cards load here only after entering a folder lane.
      </div>
    </main>
  );
}
