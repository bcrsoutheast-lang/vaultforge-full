"use client";

import { useEffect, useState } from "react";

const TYPES = ["Residential", "Commercial", "Land"];

export default function StateDeals({ params }: { params: { state: string } }) {
  const state = params.state.toUpperCase();
  const [deals, setDeals] = useState<any[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [activeType, setActiveType] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const stateDeals = allDeals.filter((d:any) => d.state === state);
    setDeals(stateDeals);

    // Count by type
    const counts: Record<string, number> = {};
    TYPES.forEach(t => counts[t] = 0);
    stateDeals.forEach((d:any) => {
      if (counts[d.type]!== undefined) counts[d.type]++;
    });
    setTypeCounts(counts);
  }, [state]);

  const filteredDeals = activeType? deals.filter(d => d.type === activeType) : deals;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>{state} DEAL ROOMS</h1>
          <a href="/deal-rooms" style={{color:"#FFD700"}}>Back to States</a>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:24}}>
          {TYPES.map(type => (
            <button
              key={type}
              onClick={()=>setActiveType(activeType === type? null : type)}
              style={{
                border:"1px solid #222",
                borderRadius:12,
                padding:16,
                background: activeType === type? "#FFD700" : "#0a0f1a",
                color: activeType === type? "#000" : "#fff",
                textAlign:"left"
              }}
            >
              <div style={{fontSize:18,fontWeight:900}}>{type}</div>
              <div style={{fontSize:32,fontWeight:900,margin:"8px 0"}}>{typeCounts[type] || 0}</div>
              <div style={{opacity:0.7,fontSize:12}}>active deals</div>
            </button>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontWeight:900}}>
            {activeType? `${activeType} Deals in ${state}` : `All ${state} Deals`}
          </h2>
          <button
            onClick={()=>window.location.href="/deal-rooms/create"}
            style={{padding:"10px 16px",borderRadius:8,background:"#FFD700",color:"#000",fontWeight:900}}
          >
            + New Deal
          </button>
        </div>

        {filteredDeals.length === 0? (
          <div style={{opacity:0.7}}>No {activeType || ""} deals in {state} yet.</div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredDeals.map((d:any, i:number) => (
              <div key={i} style={{border:"1px solid #222",borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontWeight:900}}>{d.title}</div>
                  <div style={{fontSize:12,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{d.type}</div>
                </div>
                <div style={{opacity:0.7,fontSize:12}}>Posted by: {d.postedBy}</div>
                <div style={{opacity:0.7,fontSize:12,marginTop:8}}>{d.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
