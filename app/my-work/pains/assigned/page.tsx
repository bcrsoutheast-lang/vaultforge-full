"use client";

import { useEffect, useState } from "react";

export default function AssignedPains() {
  const [assignedPains, setAssignedPains] = useState<any[]>([]);
  const [filter, setFilter] = useState("active");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadAssignedPains();
  }, [currentEmail]);

  function loadAssignedPains() {
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const assigned = pains.filter((p:any) => 
      p.assignedTo === currentEmail && 
      p.status!== "draft"
    ).sort((a:any,b:any) => b.assignedDate - a.assignedDate);
    setAssignedPains(assigned);
  }

  function handleMarkComplete(painId: number) {
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = pains.map((p:any) => {
      if (p.id === painId) {
        return {
     ...p,
          status: "completed",
          completedDate: Date.now()
        };
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    alert("Job marked as COMPLETED ✅");
    loadAssignedPains();
  }

  function handleBackToOpen(painId: number) {
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = pains.map((p:any) => {
      if (p.id === painId) {
        return {
     ...p,
          status: "active",
          assignedTo: null,
          assignedDate: null
        };
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    alert("Returned to Pain Room");
    loadAssignedPains();
  }

  function handleMessagePoster(pain: any) {
    window.location.href = `/my-work/messages?to=${pain.postedBy}`;
  }

  function handleAddNote(painId: number) {
    const note = prompt("Add a job note:");
    if (!note) return;
    
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = pains.map((p:any) => {
      if (p.id === painId) {
        const notes = p.jobNotes || [];
        notes.push({
          text: note,
          timestamp: Date.now(),
          by: currentEmail
        });
        return {...p, jobNotes: notes};
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    loadAssignedPains();
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

  function getDaysAssigned(timestamp: number) {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days;
  }

  const filteredPains = assignedPains.filter(p => {
    if (filter === "active") return p.status === "assigned" || p.status === "active";
    if (filter === "completed") return p.status === "completed";
    return true;
  });

  const activeCount = assignedPains.filter(p => p.status === "assigned" || p.status === "active").length;
  const completedCount = assignedPains.filter(p => p.status === "completed").length;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ccff",fontWeight:900}}>ASSIGNED JOBS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Jobs assigned to you from Pain Room. {activeCount} active</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <button 
            onClick={()=>setFilter("active")} 
            style={{
              padding:"6px 12px",
              borderRadius:999,
              border:"1px solid #333",
              background:filter==="active"?"#00ccff":"#0a0f1a",
              color:filter==="active"?"#000":"#fff",
              fontSize:11,
              fontWeight:900
            }}
          >
            ACTIVE ({activeCount})
          </button>
          <button 
            onClick={()=>setFilter("completed")} 
            style={{
              padding:"6px 12px",
              borderRadius:999,
              border:"1px solid #333",
              background:filter==="completed"?"#00ff00":"#0a0f1a",
              color:filter==="completed"?"#000":"#fff",
              fontSize:11,
              fontWeight:900
            }}
          >
            COMPLETED ({completedCount})
          </button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ccff",color:"#00ccff",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔧 WORK QUEUE: Jobs from Pain Room assigned to you. Complete and get paid. Track your work.
        </div>

        {filteredPains.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔧</div>
            <div style={{fontSize:16,fontWeight:900}}>No {filter} jobs</div>
            <div style={{fontSize:12,marginTop:8}}>
              {filter==="active"? "Browse Pain Room and message posters to get assigned jobs" : "Complete jobs to see them here"}
            </div>
            {filter==="active" && (
              <button onClick={()=>window.location.href="/pain-room"} style={{marginTop:16,padding:"10px 20px",background:"#00ccff",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
                Browse Pain Room →
              </button>
            )}
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredPains.map((pain:any) => {
              const daysAssigned = pain.assignedDate? getDaysAssigned(pain.assignedDate) : 0;
              const isOverdue = daysAssigned > 14 && pain.status!== "completed";
              
              return (
                <div 
                  key={pain.id} 
                  style={{
                    border:`1px solid ${pain.status==="completed"?"#00ff00":isOverdue?"#ff4444":"#00ccff"}`,
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
                        {isOverdue && pain.status!== "completed" && (
                          <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#ff4444",color:"#fff",fontWeight:900}}>
                            {daysAssigned} DAYS
                          </div>
                        )}
                        {pain.status==="completed" && (
                          <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#00ff00",color:"#000",fontWeight:900}}>
                            COMPLETED
                          </div>
                        )}
                      </div>
                      <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                        {pain.state} • {pain.propertyType} • {pain.painType} • Assigned {new Date(pain.assignedDate).toLocaleDateString()}
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

                  {pain.jobNotes && pain.jobNotes.length > 0 && (
                    <div style={{marginBottom:12,padding:12,background:"#05070d",borderRadius:6,border:"1px solid #1a1f2a"}}>
                      <div style={{fontSize:10,opacity:0.7,marginBottom:6,fontWeight:900}}>JOB NOTES</div>
                      {pain.jobNotes.map((note:any,idx:number) => (
                        <div key={idx} style={{fontSize:12,marginBottom:4,paddingBottom:4,borderBottom:idx < pain.jobNotes.length-1?"1px solid #1a1f2a":"none"}}>
                          <div style={{opacity:0.8}}>{note.text}</div>
                          <div style={{fontSize:10,opacity:0.5,marginTop:2}}>{new Date(note.timestamp).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {pain.status!== "completed"? (
                      <>
                        <button 
                          onClick={()=>handleMarkComplete(pain.id)} 
                          style={{flex:1,minWidth:140,padding:"10px",borderRadius:8,background:"#00ff00",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                        >
                          Mark Complete ✅
                        </button>
                        <button 
                          onClick={()=>handleAddNote(pain.id)} 
                          style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#00ccff",border:"1px solid #00ccff",fontSize:12,fontWeight:900}}
                        >
                          Add Note
                        </button>
                        <button 
                          onClick={()=>handleMessagePoster(pain)} 
                          style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                        >
                          Message Client
                        </button>
                        <button 
                          onClick={()=>handleBackToOpen(pain.id)} 
                          style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#999",border:"1px solid #666",fontSize:12,fontWeight:900}}
                        >
                          Release Job
                        </button>
                      </>
                    ) : (
                      <div style={{fontSize:12,opacity:0.7}}>
                        Completed on {new Date(pain.completedDate).toLocaleDateString()}
                      </div>
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
