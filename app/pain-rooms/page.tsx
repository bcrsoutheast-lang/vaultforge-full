"use client";

import { useEffect, useState } from "react";

export default function PainRooms() {
  const [pains, setPains] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [viewed, setViewed] = useState<number[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const active = allPains.filter((p:any) => p.status === "active");
    setPains(active);
    
    const viewedStored = localStorage.getItem("vaultforge_pains_viewed");
    setViewed(viewedStored? JSON.parse(viewedStored) : []);
  }, []);

  const filtered = filter === "all"? pains : pains.filter(p => p.state === filter);

  function handleView(id: number) {
    const newViewed = [...viewed, id];
    setViewed(newViewed);
    localStorage.setItem("vaultforge_pains_viewed", JSON.stringify(newViewed));
    window.location.href = `/pain-rooms/view/${id}`;
  }

  function handleSave(id: number, e: any) {
    e.stopPropagation();
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const updated = allPains.map((p:any) => {
      if (p.id === id) {
        const saved = p.savedBy || [];
        if (!saved.includes(currentEmail)) {
          saved.push(currentEmail);
          alert("Saved to My Work → Saved Pains");
        }
        return {...p, savedBy: saved};
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    window.location.reload();
  }

  const isNew = (id: number) =>!viewed.includes(id);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        {/* TICKER BANNER */}
        <div style={{background:"#FFD700",color:"#000",padding:"8px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900,overflow:"hidden",whiteSpace:"nowrap"}}>
          <div style={{animation:"scroll 20s linear infinite"}}>
            🔥 VAULTFORGE ALERT: 3 New Critical Pains in GA • 12 Deals Under Contract • $2.1M Total ARV This Week 🔥
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>PAIN ROOMS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Lean Six Sigma Problem Solving</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href="/my-work" style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",fontSize:12}}>My Work</a>
            <a href="/pain-rooms/create" style={{padding:"8px 16px",background:"#FFD700",color:"#000",borderRadius:8,fontWeight:900,fontSize:12}}>+ New Pain</a>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>setFilter("all")} style={{padding:"6px 12px",borderRadius:6,background:filter==="all"?"#FFD700":"#222",color:filter==="all"?"#000":"#fff",fontSize:12}}>All</button>
          {["GA","FL","TN","AL","NC","SC","TX"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{padding:"6px 12px",borderRadius:6,background:filter===s?"#FFD700":"#222",color:filter===s?"#000":"#fff",fontSize:12}}>{s}</button>
          ))}
        </div>

        {filtered.length === 0? <div style={{opacity:0.7}}>No pain points yet. Post one.</div> : (
          <div style={{display:"grid",gap:12}}>
            {filtered.map((p:any) => (
              <div 
                key={p.id} 
                onClick={()=>handleView(p.id)} 
                style={{
                  border:`1px solid ${isNew(p.id)?"#FFD700":"#222"}`,
                  borderRadius:12,
                  padding:16,
                  cursor:"pointer",
                  position:"relative",
                  animation: isNew(p.id)?"pulse 2s infinite":"none",
                  boxShadow: isNew(p.id)?"0 0 20px rgba(255,215,0,0.3)":"none"
                }}
              >
                {isNew(p.id) && (
                  <div style={{position:"absolute",top:8,right:8,background:"#FFD700",color:"#000",fontSize:10,fontWeight:900,padding:"2px 8px",borderRadius:999}}>NEW</div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:900,fontSize:18}}>{p.title}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:p.urgency?.includes("Critical")?"#ff4444":"#222",color:p.urgency?.includes("Critical")?"#fff":"#FFD700"}}>{p.urgency}</div>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{p.state} - {p.propertyType}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#0a0f1a",border:"1px solid #333"}}>{p.painType}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#0a0f1a",border:"1px solid #333"}}>Impact: {p.impact}</div>
                </div>
                <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>Posted by: {p.posterProfile?.email || p.postedBy}</div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{p.description?.slice(0,120)}...</div>
                {p.aiAnalysis && (
                  <div style={{border:"1px solid #FFD700",borderRadius:8,padding:8,marginBottom:12,background:"#0a0f1a",fontSize:11}}>
                    <strong style={{color:"#FFD700"}}>AI ROOT CAUSE:</strong> {p.aiAnalysis.rootCause}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={(e)=>handleSave(p.id,e)} style={{padding:"6px 12px",borderRadius:6,background:"#222",color:"#FFD700",fontSize:12,border:"1px solid #FFD700"}}>Save</button>
                  <button onClick={(e)=>{e.stopPropagation();window.location.href=`/messages/${encodeURIComponent(p.postedBy)}`}} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>Message Owner</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 0 30px rgba(255,215,0,0.6); }
        }
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}
