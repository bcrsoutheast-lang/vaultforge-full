export default function VaultForgeExecutionFeed() {
  const rows = [
    "Buyer intro requested",
    "Funding gap detected",
    "Operator assigned",
    "Pain room escalated"
  ];

  return (
    <div style={{
      background:"#0a0d12",
      border:"1px solid #2b2416",
      borderRadius:16,
      padding:20,
      color:"white"
    }}>
      <h2 style={{color:"#f3c969"}}>EXECUTION FEED</h2>

      {rows.map((row) => (
        <div key={row} style={{
          padding:"10px 0",
          borderBottom:"1px solid #1d1d1d"
        }}>
          {row}
        </div>
      ))}
    </div>
  );
}