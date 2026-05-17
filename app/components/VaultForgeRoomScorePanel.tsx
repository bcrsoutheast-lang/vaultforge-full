type Score = {
  label: string;
  value: number | string;
  note?: string;
  tone?: "gold" | "green" | "red" | "blue" | "purple";
};

function scoreColor(tone?: Score["tone"]) {
  if (tone === "green") return "#22c55e";
  if (tone === "red") return "#ef4444";
  if (tone === "blue") return "#38bdf8";
  if (tone === "purple") return "#a855f7";
  return "#f5c55b";
}

export default function VaultForgeRoomScorePanel({
  title = "Room Intelligence Scores",
  scores = [],
}: {
  title?: string;
  scores?: Score[];
}) {
  const safeScores = scores.length
    ? scores
    : [
        { label: "AI Conviction", value: 84, note: "High confidence", tone: "gold" },
        { label: "Execution Score", value: 77, note: "Actionable", tone: "green" },
        { label: "Risk Score", value: 41, note: "Manageable", tone: "red" },
      ];

  return (
    <section className="vf-score-panel">
      <style>{`
        .vf-score-panel {
          border: 1px solid rgba(245, 197, 91, 0.2);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.97));
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .vf-score-title {
          color: #f5c55b;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .vf-score-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
          gap: 10px;
        }

        .vf-score-card {
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.58);
          border-radius: 15px;
          padding: 13px;
        }

        .vf-score-label {
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
          min-height: 28px;
        }

        .vf-score-value {
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
          margin: 8px 0 6px;
        }

        .vf-score-note {
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.35;
        }
      `}</style>

      <div className="vf-score-title">{title}</div>
      <div className="vf-score-grid">
        {safeScores.map((score) => (
          <div className="vf-score-card" key={score.label}>
            <div className="vf-score-label">{score.label}</div>
            <div className="vf-score-value" style={{ color: scoreColor(score.tone) }}>
              {score.value}
            </div>
            <div className="vf-score-note">{score.note || "VaultForge signal score"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}