export default function VaultForgeMarketHeat() {
  return (
    <div style={{
      background:"#0a0d12",
      border:"1px solid #2b2416",
      borderRadius:16,
      padding:20,
      color:"white"
    }}>
      <h2 style={{color:"#f3c969"}}>MARKET HEAT</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        <div style={{background:"#11151d",padding:16,borderRadius:12}}>
          Fulton County
        </div>
        <div style={{background:"#11151d",padding:16,borderRadius:12}}>
          Miami-Dade
        </div>
        <div style={{background:"#11151d",padding:16,borderRadius:12}}>
          Dallas
        </div>
        <div style={{background:"#11151d",padding:16,borderRadius:12}}>
          Nashville
        </div>
      </div>
    </div>
  );
}