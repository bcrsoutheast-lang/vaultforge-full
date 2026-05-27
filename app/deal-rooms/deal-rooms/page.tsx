"use client";

import { useEffect, useState } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];

export default function DealRooms() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals");
    const deals = stored? JSON.parse(stored) : [];

    // Count deals by state
    const newCounts: Record<string, number> = {};
    STATES.forEach(s => newCounts[s] = 0);
    deals.forEach((d:any) => {
      if (newCounts[d.state]!== undefined) {
        newCounts[d.state]++;
      }
    });
    setCounts(newCounts);
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>DEAL OPPORTUNITIES</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Back to Dashboard</a>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <p style={{opacity:0.7}}>Active deals by state. Click a state to view or create deals.</p>
          <button
            onClick={()=>window.location.href="/deal-rooms/create"}
            style={{padding:"10px 16px",borderRadius:8,background:"#FFD700",color:"#000",fontWeight:900}}
          >
            + New Deal
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:16}}>
          {STATES.map(state => (
            <button
              key={state}
              onClick={()=>window.location.href=`/deal-rooms/${state.toLowerCase()}`}
              style={{
                border:"1px solid #222",
                borderRadius:12,
                padding:16,
                background:"#0a0f1a",
                textAlign:"left"
              }}
            >
              <div style={{fontSize:24,fontWeight:900,color:"#FFD700"}}>{state}</div>
              <div style={{fontSize:32,fontWeight:900,margin:"8px 0"}}>{counts[state] || 0}</div>
              <div style={{opacity:0.7,fontSize:12}}>active deals</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
