"use client";

import { useEffect, useState } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];

export default function PainRooms() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_pains");
    const pains = stored? JSON.parse(stored) : [];

    const newCounts: Record<string, number> = {};
    STATES.forEach(s => newCounts[s] = 0);
    pains.forEach((p:any) => {
      if (newCounts[p.state]!== undefined) {
        newCounts[p.state]++;
      }
    });
    setCounts(newCounts);
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>PAIN ROOMS</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Back to Dashboard</a>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <p style={{opacity:0.7}}>Active problems by state. Click a state to view or post a pain point.</p>
          <button
            onClick={()=>window.location.href="/pain-rooms/create"}
            style={{padding:"10px 16px",borderRadius:8,background:"#FFD700",color:"#000",fontWeight:900}}
          >
            + New Pain Point
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:16}}>
          {STATES.map(state => (
            <button
              key={state}
              onClick={()=>window.location.href=`/pain-rooms/${state.toLowerCase()}`}
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
              <div style={{opacity:0.7,fontSize:12}}>active pains</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
