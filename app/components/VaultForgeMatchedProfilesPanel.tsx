type MatchProfile = {
  name: string;
  role: string;
  score: number;
  market: string;
  reason: string;
  capacity?: string;
};

const fallbackProfiles: MatchProfile[] = [
  {
    name: "Southeast Buyer Group",
    role: "Buyer Match",
    score: 91,
    market: "GA · FL · TN",
    reason: "Matches geography, distress appetite, and speed-to-close profile.",
    capacity: "Acquisition capital",
  },
  {
    name: "Bridge Capital Desk",
    role: "Capital Match",
    score: 87,
    market: "Sunbelt",
    reason: "Likely fit for rescue capital, bridge debt, or refinance pressure.",
    capacity: "Debt / JV",
  },
  {
    name: "Turnaround Operator Network",
    role: "Operator Match",
    score: 84,
    market: "Southeast",
    reason: "Best fit for stalled execution, construction, PM, or local boots-on-ground.",
    capacity: "Execution support",
  },
];

export default function VaultForgeMatchedProfilesPanel({
  title = "Matched Profiles",
  profiles = fallbackProfiles,
}: {
  title?: string;
  profiles?: MatchProfile[];
}) {
  const safeProfiles = profiles.length ? profiles : fallbackProfiles;

  return (
    <section className="vf-match-panel">
      <style>{`
        .vf-match-panel {
          border: 1px solid rgba(245, 197, 91, 0.2);
          background:
            radial-gradient(circle at top left, rgba(56,189,248,.08), transparent 26%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.98));
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .vf-match-title {
          color: #f5c55b;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .vf-match-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 10px;
        }

        .vf-match-card {
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.6);
          border-radius: 16px;
          padding: 14px;
        }

        .vf-match-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .vf-match-name {
          font-weight: 950;
          line-height: 1.2;
        }

        .vf-match-role {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 4px;
        }

        .vf-match-score {
          color: #22c55e;
          font-size: 25px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .vf-match-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 10px 0;
        }

        .vf-match-pill {
          color: #fef3c7;
          border: 1px solid rgba(245,197,91,.2);
          background: rgba(245,197,91,.06);
          border-radius: 999px;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 900;
        }

        .vf-match-reason {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.45;
        }
      `}</style>

      <div className="vf-match-title">{title} · Multi-profile routing enabled</div>

      <div className="vf-match-grid">
        {safeProfiles.map((profile) => (
          <article className="vf-match-card" key={`${profile.name}-${profile.role}`}>
            <div className="vf-match-top">
              <div>
                <div className="vf-match-name">{profile.name}</div>
                <div className="vf-match-role">{profile.role}</div>
              </div>
              <div className="vf-match-score">{profile.score}</div>
            </div>

            <div className="vf-match-meta">
              <span className="vf-match-pill">{profile.market}</span>
              {profile.capacity ? <span className="vf-match-pill">{profile.capacity}</span> : null}
            </div>

            <div className="vf-match-reason">{profile.reason}</div>
          </article>
        ))}
      </div>
    </section>
  );
}