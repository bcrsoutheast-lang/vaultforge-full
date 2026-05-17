export default function VaultForgePressureBoard() {
  const items = [
    ["Georgia", "HIGH"],
    ["Florida", "ELEVATED"],
    ["Texas", "ACTIVE"],
    ["Tennessee", "SURGING"]
  ];

  return (
    <div style={{
      background:"#0a0d12",
      border:"1px solid #2b2416",
      padding:20,
      borderRadius:16,
      color:"white"
    }}>
      <h2 style={{color:"#f3c969"}}>PRESSURE BOARD</h2>

      {items.map(([state, level]) => (
        <div key={state} style={{
          display:"flex",
          justifyContent:"space-between",
          padding:"12px 0",
          borderBottom:"1px solid #1d1d1d"
        }}>
          <span>{state}</span>
          <span style={{color:"#ff5b5b"}}>{level}</span>
        </div>
      ))}
    </div>
  );
}