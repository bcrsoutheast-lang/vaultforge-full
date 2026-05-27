"use client";

import { useEffect, useState } from "react";

export default function PainRoom() {
  const [pains, setPains] = useState<any[]>([]);
  const [filterState, setFilterState] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadPains();
  }, []);

  function loadPains() {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    // Show active pains not posted by current user and not already assigned
    const publicPains = allPains.filter((p:any) => p.status === "active" && p.postedBy!== currentEmail &&!p.assignedTo);
    setPains(publicPains.sort((a:any,b:any) => {
      const urgencyOrder = {emergency:0,high:1,medium:2,low:3};
      return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder] || b.postedAt - a.postedAt;
    }));
  }

  function handleAssignPain(painId: number) {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = allPains.map((p:any) => {
      if (p.id === painId) {
        return {...p, assignedTo: currentEmail, status: "assigned"};
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    loadPains();
    alert("Job assigned! Check My Work > Assigned Jobs");
  }

  function handleMessagePoster(posterEmail: string) {
    window.location.href = `/my-work/messages?to=${posterEmail}`;
  }

  const filteredPains = pains.filter(p => {
    const stateMatch = filterState === "all" || p.state === filterState;
    const typeMatch = filterType === "all" || p.painType === filterType;
    const urgencyMatch = filterUrgency === "all" || p.urgency === filterUrgency;
    return stateMatch && typeMatch && urgencyMatch;
  });

  const states = ["all",...Array.from(new Set(pains.map(p=>p.state)))];
  const painTypes = ["all",...Array.from(new Set(pains.map(p=>p.painType)))];
  const urgencies = ["all","emergency","high","medium","low"];

  const urgencyColors: any = {
    emergency: "#ff0000",
    high: "#ff8800", 
    medium: "#FFD700",
    low: "#00ff00"
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ccff"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #00ccff)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#00ccff",fontWeight:900,fontSize:24,letterSpacing:1}}>PAIN ROOM</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>AI-matched jobs from VaultForge network. Assign or DM to claim.</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={filterState} onChange={e=>setFilterState(e.target.value)} style={{padding:"8px 12px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:12}}>
              {states.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"8px 12px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:12}}>
              {painTypes.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <select value={filterUrgency} onChange={e=>setFilterUrgency(e.target.value)} style={{padding:"8px 12px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:12}}>
              {urgencies.map(u=><option key={u} value={u}>{u.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ccff",color:"#00ccff",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔧 {filteredPains.length} AVAILABLE JOBS | AI routes pains to your DMAIC skills. Assign to move to My Work.
        </div>

        {filteredPains.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔧</div>
            <div style={{fontSize:16,fontWeight:900}}>No jobs match your filters</div>
            <div style={{fontSize:12,marginTop:8}}>Update your DMAIC skills in Profile or check back soon</div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(350px,1fr))",gap:16}}>
            {filteredPains.map((pain:any) => (
              <div 
                key={pain.id} 
                style={{
                  border:`1px solid ${urgencyColors[pain.urgency]}`,
                  borderRadius:12,
                  padding:20,
                  background:"#0a0f1a",
                  boxShadow:`0 0 12px ${urgencyColors[pain.urgency]}20`
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div style={{fontWeight:900,fontSize:18,color:"#00ccff",flex:1}}>{pain.title}</div>
                  <div style={{
                    fontSize:10,
                    padding:"4px 8px",
                    borderRadius:999,
                    background:"#1a1f2a",
                    border:`1px solid ${urgencyColors[pain.urgency]}`,
                    color: urgencyColors[pain.urgency],
                    fontWeight:900
                  }}>
                    {pain.urgency.toUpperCase()}
                  </div>
                </div>

                <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:6,background:"#1a1f2a",border:"1px solid #333"}}>
                    {pain.state}
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:6,background:"#1a1f2a",border:"1px solid #333"}}>
                    {pain.propertyType}
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:6,background:"#1a1f2a",border:"1px solid #333"}}>
                    {pain.painType}
                  </div>
                </div>

                {pain.budget && (
                  <div style={{border:"1px solid #00ff00",borderRadius:8,padding:10,background:"#05070d",marginBottom:12,textAlign:"center"}}>
                    <div style={{fontSize:10,opacity:0.7,marginBottom:2}}>BUDGET</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#00ff00"}}>{pain.budget}</div>
                  </div>
                )}

                <div style={{fontSize:12,opacity:0.8,marginBottom:12,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
                  {pain.description}
                </div>

                <div style={{fontSize:10,opacity:0.5,marginBottom:12}}>
                  Posted {new Date(pain.postedAt).toLocaleDateString()}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button 
                    onClick={()=>handleAssignPain(pain.id)} 
                    style={{
                      padding:"12px",
                      borderRadius:8,
                      background:"#00ccff",
                      color:"#000",
                      border:"none",
                      fontSize:12,
                      fontWeight:900
                    }}
                  >
                    🔨 ASSIGN TO ME
                  </button>
                  <button 
                    onClick={()=>handleMessagePoster(pain.postedBy)} 
                    style={{padding:"12px",borderRadius:8,background:"none",color:"#00ccff",border:"1px solid #00ccff",fontSize:12,fontWeight:900}}
                  >
                    💬 DM POSTER
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
