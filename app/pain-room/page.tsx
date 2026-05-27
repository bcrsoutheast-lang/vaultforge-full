"use client";

import { useEffect, useState } from "react";

export default function PainRoom() {
  const [pains, setPains] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState("all");
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    // Only show pains with status: "active" = published to Pain Room
    const published = allPains.filter((p:any) => p.status === "active");
    setPains(published);
    
    // Get which pains YOU already saved to My Work
    const mySaved = allPains.filter((p:any) => p.savedBy?.includes(currentEmail));
    setSavedIds(mySaved.map((p:any) => p.id));
  }, [currentEmail]);

  function handleSavePain(painId: number) {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const pain = allPains.find((p:any) => p.id === painId);
    if (!pain) return;

    // Create YOUR copy in My Work → Pains → Saved
    const myCopy = {
    ...pain,
      id: Date.now(), // New ID for your copy
      originalPainId: pain.id, // Link back to original
      status: "saved",
      savedBy: [currentEmail],
      savedAt: Date.now(),
      // Your copy is isolated - your actions don't affect original
    };
    
    allPains.push(myCopy);
    localStorage.setItem("vaultforge_pains", JSON.stringify(allPains));
    setSavedIds(prev => [...prev, painId]);
    alert("Saved to My Work → Pains → Saved");
  }

  function handleMessagePoster(posterEmail: string) {
    window.location.href = `/my-work/messages?to=${posterEmail}`;
  }

  function handleClaimPain(painId: number) {
    if (!confirm("Claim this pain? This moves it to My Work → Assigned and notifies the poster.")) return;
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const pain = allPains.find((p:any) => p.id === painId);
    if (!pain) return;

    // Create YOUR copy in My Work → Pains → Assigned
    const myCopy = {
    ...pain,
      id: Date.now(),
      originalPainId: pain.id,
      status: "assigned",
      assignedTo: currentEmail,
      assignedAt: Date.now(),
    };
    
    allPains.push(myCopy);
    localStorage.setItem("vaultforge_pains", JSON.stringify(allPains));
    alert("Claimed! Check My Work → Pains → Assigned");
    window.location.href = "/my-work/pains/assigned";
  }

  const filteredPains = pains.filter(p => {
    if (filter === "all") return true;
    if (filter === "my-state") return p.state === "GA"; // TODO: Use member profile state
    if (filter === "emergency") return p.urgency === "emergency";
    if (filter === "hvac") return p.painType === "HVAC";
    if (filter === "plumbing") return p.painType === "Plumbing";
    return true;
  });

  function getUrgencyColor(urgency: string) {
    switch(urgency) {
      case "emergency": return "#ff0000";
      case "high": return "#ff4444";
      case "medium": return "#FFA500";
      case "low": return "#00ff00";
      default: return "#666";
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ccff",fontWeight:900}}>PAIN ROOM</h1>
            <div style={{fontSize:11,opacity:0.7}}>Internal contractor feed. {pains.length} pains from members. Save or claim to your workspace.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ccff",color:"#00ccff",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔒 MEMBERS ONLY: Pains here are posted by members for contractors. Save or Claim to add to your workspace. Your actions don't affect other members.
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["all","my-state","emergency","hvac","plumbing"].map(f => (
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
              {f === "all"? "All Pains" : f === "my-state"? "My State" : f.toUpperCase()}
            </button>
          ))}
        </div>

        {filteredPains.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔧</div>
            <div>No pains in Pain Room yet.</div>
            <div style={{fontSize:12,marginTop:8}}>Members push pains here from their Pain Intake. Check back soon or post your own.</div>
            <button onClick={()=>window.location.href="/my-work/pain-intake"} style={{marginTop:16,padding:"8px 16px",background:"#00ccff",color:"#000",borderRadius:6,fontSize:12,fontWeight:900,border:"none"}}>Go to Pain Intake</button>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredPains.map((p:any) => {
              const isSaved = savedIds.includes(p.id);
              const isMine = p.postedBy === currentEmail;
              const urgencyColor = getUrgencyColor(p.urgency);
              return (
                <div key={p.id} style={{border:`1px solid ${urgencyColor}`,borderRadius:12,padding:16,background:"#0a0f1a"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontWeight:900,fontSize:16}}>{p.title}</div>
                    <div style={{display:"flex",gap:8}}>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:urgencyColor,color:"#000",fontWeight:900}}>
                        {p.urgency.toUpperCase()}
                      </div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#222",color:"#00ccff"}}>
                        {isMine? "YOUR POST" : "MEMBER PAIN"}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#999"}}>{p.state} - {p.propertyType}</div>
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>{p.painType}</div>
                    {p.budget && <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>Budget: {p.budget}</div>}
                  </div>

                  <div style={{opacity:0.8,fontSize:12,marginBottom:12}}>{p.description?.slice(0,120)}...</div>
                  
                  <div style={{opacity:0.6,fontSize:11,marginBottom:12}}>
                    Posted by: {isMine? "You" : p.postedBy} • {p.postedAt? new Date(p.postedAt).toLocaleDateString() : "Recently"}
                  </div>

                  <div style={{display:"flex",gap:8}}>
                    {!isMine && (
                      <>
                        <button 
                          onClick={()=>handleSavePain(p.id)} 
                          disabled={isSaved}
                          style={{
                            padding:"8px 16px",
                            borderRadius:6,
                            background:isSaved?"#333":"#00ccff",
                            color:isSaved?"#666":"#000",
                            border:"none",
                            fontSize:12,
                            fontWeight:900,
                            cursor:isSaved?"not-allowed":"pointer"
                          }}
                        >
                          {isSaved?"✓ Saved" : "Save to My Work"}
                        </button>
                        <button 
                          onClick={()=>handleClaimPain(p.id)} 
                          style={{padding:"8px 16px",borderRadius:6,background:"#00ff00",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                        >
                          Claim Job
                        </button>
                        <button 
                          onClick={()=>handleMessagePoster(p.postedBy)} 
                          style={{padding:"8px 16px",borderRadius:6,background:"#222",color:"#fff",border:"1px solid #666",fontSize:12}}
                        >
                          Message Poster
                        </button>
                      </>
                    )}
                    {isMine && (
                      <button 
                        onClick={()=>window.location.href="/my-work/pain-intake"} 
                        style={{padding:"8px 16px",borderRadius:6,background:"#222",color:"#00ccff",border:"1px solid #00ccff",fontSize:12}}
                      >
                        Manage in Pain Intake
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
