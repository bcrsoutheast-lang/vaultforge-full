export const dynamic = "force-dynamic";

export default function PainRoomsPage() {
  return (
    <main style={{
      minHeight:"100vh",
      background:"#030712",
      color:"#fff",
      padding:"32px",
      fontFamily:"Arial"
    }}>
      <div style={{color:"#ff6b6b",fontWeight:900,fontSize:44}}>
        PAIN ROOMS
      </div>

      <p style={{maxWidth:900,fontSize:20,color:"#cbd5e1"}}>
        Pain Rooms are the VaultForge execution moat. Distress, pressure, funding gaps,
        stalled projects and operational failures route here first.
      </p>

      <div style={box}>
        <div style={eyebrow}>PRESSURE ENGINE</div>

        <h2 style={{fontSize:42,margin:"0 0 16px"}}>
          Distress → routing → execution.
        </h2>

        <ul style={{color:"#cbd5e1",fontSize:20,lineHeight:1.8}}>
          <li>Seller distress analysis</li>
          <li>Capital gap detection</li>
          <li>Execution failure scoring</li>
          <li>Urgency classification</li>
          <li>State pressure tracking</li>
          <li>Operator matching</li>
          <li>Lender + JV routing</li>
          <li>AI next-step recommendations</li>
        </ul>
      </div>
    </main>
  );
}

const box: React.CSSProperties = {
  marginTop:28,
  border:"1px solid rgba(255,107,107,.25)",
  borderRadius:24,
  padding:28,
  background:"linear-gradient(180deg,#1a0d0d,#030712)"
};

const eyebrow: React.CSSProperties = {
  color:"#ff6b6b",
  fontSize:12,
  letterSpacing:4,
  marginBottom:12,
  fontWeight:800
};
