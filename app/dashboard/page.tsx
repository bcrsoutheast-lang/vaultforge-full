export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background:"#030712",
      color:"#fff",
      padding:"32px",
      fontFamily:"Arial"
    }}>
      <div style={{color:"#f5c84c",fontWeight:900,fontSize:48}}>VAULTFORGE</div>

      <div style={{
        marginTop:24,
        border:"1px solid rgba(245,200,76,.25)",
        borderRadius:24,
        padding:24,
        background:"linear-gradient(180deg,#07111f,#030712)"
      }}>
        <div style={{fontSize:14,letterSpacing:4,color:"#f5c84c",marginBottom:8}}>
          COMMAND CENTER
        </div>

        <h1 style={{fontSize:56,lineHeight:1,margin:0}}>
          One room engine.
        </h1>

        <p style={{fontSize:22,color:"#cbd5e1",maxWidth:900}}>
          Deal Rooms and Pain Rooms are the only operational room systems.
          Alerts, routing, intelligence, profiles, AI analysis, scoring,
          and messages now belong inside rooms instead of separate pages.
        </p>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
          gap:18,
          marginTop:30
        }}>
          <a href="/deal-rooms" style={card}>
            <div style={eyebrow}>DEAL ROOMS</div>
            <div style={title}>Opportunities</div>
            <div style={copy}>
              Acquisitions, flips, buy holds, development and operator execution.
            </div>
          </a>

          <a href="/pain-rooms" style={card}>
            <div style={eyebrow}>PAIN ROOMS</div>
            <div style={title}>Pressure + Distress</div>
            <div style={copy}>
              Distressed sellers, funding gaps, stalled projects and urgent execution.
            </div>
          </a>

          <a href="/messages" style={card}>
            <div style={eyebrow}>MESSAGES</div>
            <div style={title}>Unified Communication</div>
            <div style={copy}>
              Routing, intros, AI and room communication in one lane.
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}

const card: React.CSSProperties = {
  border:"1px solid rgba(255,255,255,.1)",
  borderRadius:20,
  padding:20,
  textDecoration:"none",
  color:"#fff",
  background:"rgba(255,255,255,.03)"
};

const eyebrow: React.CSSProperties = {
  color:"#f5c84c",
  fontSize:12,
  letterSpacing:3,
  marginBottom:12,
  fontWeight:800
};

const title: React.CSSProperties = {
  fontSize:32,
  fontWeight:900,
  marginBottom:12
};

const copy: React.CSSProperties = {
  color:"#cbd5e1",
  lineHeight:1.5
};
