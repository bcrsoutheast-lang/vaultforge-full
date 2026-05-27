"use client";

import { useEffect, useState } from "react";

export default function PainRoom() {
  const [pains, setPains] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadPains();
  }, [currentEmail]);

  function loadPains() {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const activePains = allPains.filter((p:any) => 
      p.status === "active" && 
      p.postedBy!== currentEmail
    ).sort((a:any,b:any) => {
      // Sort by urgency: emergency > high > medium > low, then by date
      const urgencyOrder: any = { emergency: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
      if (urgencyDiff!== 0) return urgencyDiff;
      return b.postedAt - a.postedAt;
    });
    setPains(activePains);
  }

  function handleClaimPain(painId: number) {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = allPains.map((p:any) => {
      if (p.id === painId) {
        return {
   ...p,
          status: "assigned",
          assignedTo: currentEmail,
          assignedDate: Date.now()
        };
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    alert("Job assigned to you! Check My Work → Assigned Jobs");
    loadPains();
  }

  function handleMessagePoster(pain: any) {
    window.location.href = `/my-work/messages?to=${pain.postedBy}`;
  }

  function getUrgencyColor(urgency: string) {
    switch(urgency) {
      case "emergency": return "#ff0000";
      case "high": return "#ff4444";
      case "medium": return "#FFA500";
      case "low": return "#00ff00";
      default: return "#666";
    }
  }

  const filteredPains = pains.filter(p => {
    const matchesFilter = filter === "all" || p.painType.toLowerCase() === filter;
    const matchesSearch = searchTerm === "" || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.painType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: pains.length,
    hvac: pains.filter(p=>p.painType==="HVAC").length,
    plumbing: pains.filter(p=>p.painType==="Plumbing").length,
    electrical: pains.filter(p=>p.painType==="Electrical").length,
    roof: pains.filter(p=>p.painType==="Roof").length,
    foundation: pains.filter(p=>p.painType==="Foundation").length
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ccff",fontWeight:900}}>PAIN ROOM</h1>
            <div style={{fontSize:11,opacity:0.7}}>Internal feed. AI-matched jobs from VaultForge members. {pains.length} active</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ccff",color:"#00ccff",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔧 AI-MATCHED: These pains were pushed from private Pain Intake. VaultForge alerts contractors with matching DMAIC skills.
        </div>

        <div style={{marginBottom:16}}>
          <input 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            placeholder="Search by title, state, pain type, description..."
            style={{width:"100%",padding:"12px 16px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:14}}
          />
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["all","hvac","plumbing","electrical","roof","foundation"].map(f => (
            <button 
              key={f}
              onClick={()=>setFilter(f)} 
              style={{
                padding:"6px 12px",
                borderRadius:999,
                border:"1px solid #333",
                background:filter===f?"#00ccff":"#0a0f1a",
                color:filter===f?"#000":"#fff",
                fontSize:11,
                fontWeight:900
              }}
            >
              {f.toUpperCase()} ({counts[f as keyof typeof counts]})
            </button>
          ))}
        </div>

        {filteredPains.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔧</div>
            <div style={{fontSize:16,fontWeight:900}}>No pains available</div>
            <div style={{fontSize:12,marginTop:8}}>
              {searchTerm? "No pains match your search" : "VaultForge AI will alert you when pains match your DMAIC skills"}
            </div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredPains.map((pain:any) => (
              <div 
                key={pain.id} 
                style={{
                  border:`1px solid ${getUrgencyColor(pain.urgency)}`,
                  borderRadius:12,
                  padding:16,
                  background:"#0a0f1a"
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{fontWeight:900,fontSize:16,color:"#00ccff"}}>{pain.title}</div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:getUrgencyColor(pain.urgency),color:"#000",fontWeight:900}}>
                        {pain.urgency.toUpperCase()}
                      </div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#1a1f2a",border:"1px solid #00ccff",fontWeight:900}}>
                        {pain.painType.toUpperCase()}
                      </div>
                    </div>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                      {pain.state} • {pain.propertyType} • Posted by {pain.postedBy} • {new Date(pain.postedAt).toLocaleDateString()}
                    </div>
                    {pain.budget && (
                      <div style={{fontSize:13,marginBottom:8}}>
                        <span style={{opacity:0.7}}>Budget:</span> <span style={{fontWeight:900}}>${parseFloat(pain.budget).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{fontSize:12,opacity:0.8,marginBottom:12,padding:12,background:"#05070d",borderRadius:6,border:"1px solid #1a1f2a"}}>
                  {pain.description}
                </div>

                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button 
                    onClick={()=>handleClaimPain(pain.id)} 
                    style={{flex:1,minWidth:140,padding:"10px",borderRadius:8,background:"#00ccff",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                  >
                    Claim This Job
                  </button>
                  <button 
                    onClick={()=>handleMessagePoster(pain)} 
                    style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                  >
                    Message Poster
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
