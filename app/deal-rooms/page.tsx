export const dynamic = "force-dynamic";

export default function DealRoomsPage() {
  return (
    <main style={{
      minHeight:"100vh",
      background:"#030712",
      color:"#fff",
      padding:"32px",
      fontFamily:"Arial"
    }}>
      <div style={{color:"#f5c84c",fontWeight:900,fontSize:44}}>
        DEAL ROOMS
      </div>

      <p style={{maxWidth:900,fontSize:20,color:"#cbd5e1"}}>
        This replaces Opportunity, Projects, Deal Boards, Signals and other duplicated room systems.
      </p>

      <div style={box}>
        <div style={eyebrow}>LIVE EXECUTION</div>
        <h2 style={{fontSize:42,margin:"0 0 16px"}}>
          One operational deal lane.
        </h2>

        <ul style={{color:"#cbd5e1",fontSize:20,lineHeight:1.8}}>
          <li>AI best-fit analysis</li>
          <li>Operator fit</li>
          <li>Capital stack</li>
          <li>Lender routing</li>
          <li>Contractor routing</li>
          <li>Execution scoring</li>
          <li>Room messaging</li>
          <li>Archive / Save / Hide cleanup</li>
        </ul>
      </div>
    </main>
  );
}

const box: React.CSSProperties = {
  marginTop:28,
  border:"1px solid rgba(245,200,76,.25)",
  borderRadius:24,
  padding:28,
  background:"linear-gradient(180deg,#08101d,#030712)"
};

const eyebrow: React.CSSProperties = {
  color:"#f5c84c",
  fontSize:12,
  letterSpacing:4,
  marginBottom:12,
  fontWeight:800
};
