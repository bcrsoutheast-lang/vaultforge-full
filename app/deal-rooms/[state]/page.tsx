"use client";

import { useEffect, useState } from "react";

const TYPES = ["Residential", "Commercial", "Land"];

export default function StateDeals({ params }: { params: { state: string } }) {
  const state = params.state.toUpperCase();
  const [deals, setDeals] = useState<any[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [activeType, setActiveType] = useState<string | null>(null);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const stateDeals = allDeals.filter((d:any) => d.state === state && d.status === "active");
    setDeals(stateDeals);

    const counts: Record<string, number> = {};
    TYPES.forEach(t => counts[t] = 0);
    stateDeals.forEach((d:any) => {
      if (counts[d.type]!== undefined) counts[d.type]++;
    });
    setTypeCounts(counts);
  }, [state]);

  const filteredDeals = activeType? deals.filter(d => d.type === activeType) : deals;

  function handleSave(id: number) {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const updated = allDeals.map((d:any) => {
      if (d.id === id) {
        const saved = d.savedBy || [];
        if (!saved.includes(currentEmail)) saved.push(currentEmail);
        return {...d, savedBy: saved};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert("Deal saved");
  }

  function handleArchive(id: number) {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const updated = allDeals.map((d:any) => {
      if (d.id === id) {
        const archived = d.archivedBy || [];
        if (!archived.includes(currentEmail)) archived.push(currentEmail);
        return {...d, archivedBy: archived};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert("Deal archived");
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this deal forever?")) return;
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const updated = allDeals.filter((d:any) => d.id!== id);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handleMessage(email: string) {
    alert(`Message ${email} - Chat coming next build`);
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>{state} DEAL ROOMS</h1>
          <a href="/deal-rooms" style={{color:"#FFD700"}}>Back to States</a>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
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
              <div style={{fontSize:16,fontWeight:900}}>{type}</div>
              <div style={{fontSize:28,fontWeight:900,margin:"8px 0"}}>{typeCounts[type] || 0}</div>
              <div style={{opacity:0.7,fontSize:11}}>active deals</div>
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
            {filteredDeals.map((d:any) => (
              <div key={d.id} style={{border:"1px solid #222",borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:900,fontSize:18}}>{d.title}</div>
                  <div style={{fontSize:12,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{d.type}</div>
                </div>
                <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>Posted by: {d.postedBy}</div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{d.description}</div>
                
                {d.photos && d.photos.length > 0 && (
                  <div style={{display:"flex",gap:8,marginBottom:12,overflowX:"auto"}}>
                    {d.photos.map((photo:string, i:number) => (
                      <img key={i} src={photo} style={{width:80,height:80,objectFit:"cover",borderRadius:8}} />
                    ))}
                  </div>
                )}

                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>window.location.href=`/deal-rooms/analyze/${d.id}`} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>
                    Analyze
                  </button>
                  <button onClick={()=>handleSave(d.id)} style={{padding:"6px 12px",borderRadius:6,background:"#0a0f1a",border:"1px solid #222",fontSize:12,color:"#fff"}}>
                    Save
                  </button>
                  <button onClick={()=>handleArchive(d.id)} style={{padding:"6px 12px",borderRadius:6,background:"#0a0f1a",border:"1px solid #222",fontSize:12,color:"#fff"}}>
                    Archive
                  </button>
                  <button onClick={()=>handleMessage(d.postedBy)} style={{padding:"6px 12px",borderRadius:6,background:"#0a0f1a",border:"1px solid #222",fontSize:12,color:"#fff"}}>
                    Message
                  </button>
                  {d.postedBy === currentEmail && (
                    <button onClick={()=>handleDelete(d.id)} style={{padding:"6px 12px",borderRadius:6,background:"#ff4444",color:"#fff",fontSize:12}}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
