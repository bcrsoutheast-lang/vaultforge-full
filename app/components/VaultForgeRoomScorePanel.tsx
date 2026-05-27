"use client";

type Tone = "blue" | "gold" | "green" | "purple" | "red";

type Score = {
  label: string;
  value: number | string;
  tone?: Tone;
  note?: string;
};

type Props = {
  title?: string;
  scores: Score[];
};

function scoreColor(tone?: Tone): string {
  switch (tone) {
    case "gold": return "#FFD700";
    case "green": return "#00ff00";
    case "red": return "#ff0000";
    case "blue": return "#00ccff";
    case "purple": return "#aa00ff";
    default: return "#FFD700";
  }
}

export default function VaultForgeRoomScorePanel({ title = "VAULTFORGE SIGNAL", scores }: Props) {
  return (
    <div style={{
      border:"1px solid #FFD700",
      borderRadius:12,
      padding:20,
      background:"#0a0f1a",
      marginBottom:16
    }}>
      <div style={{
        fontSize:11,
        fontWeight:900,
        color:"#FFD700",
        marginBottom:16,
        letterSpacing:1
      }}>
        {title}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
        {scores.map((score) => (
          <div className="vf-score-card" key={score.label}>
            <div className="vf-score-label" style={{fontSize:10,opacity:0.7,marginBottom:4}}>
              {score.label}
            </div>
            <div 
              className="vf-score-value" 
              style={{
                color: scoreColor(score.tone),
                fontSize:24,
                fontWeight:900
              }}
            >
              {score.value}
            </div>
            <div className="vf-score-note" style={{fontSize:10,opacity:0.6,marginTop:4}}>
              {score.note || "VaultForge signal score"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
