"use client";

import { useEffect, useState } from "react";

export default function CompletedJobs() {
  const [completedPains, setCompletedPains] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, totalEarned: 0 });
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadCompletedPains();
  }, [currentEmail]);

  function loadCompletedPains() {
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const completed = pains.filter((p:any) => 
      p.status === "completed" && 
      p.assignedTo === currentEmail
    ).sort((a:any,b:any) => b.completedDate - a.completedDate);
    
    setCompletedPains(completed);
    calculateStats(completed);
  }

  function calculateStats(pains: any[]) {
    const total = pains.length;
    let totalEarned = 0;
    
    pains.forEach((p:any) => {
      if (p.budget) {
        totalEarned += parseFloat(p.budget);
      }
    });
    
    setStats({ total, totalEarned });
  }

  function handleReopen(painId: number) {
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = pains.map((p:any) => {
      if (p.id === painId) {
        return {
  ...p,
          status: "assigned",
          completedDate: null
        };
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    alert("Job reopened to Assigned Jobs");
    loadCompletedPains();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        {/* LOGO LOCKED AT TOP */}
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ff00"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #00ff00)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#00ff00",fontWeight:900,fontSize:24,letterSpacing:1}}>COMPLETED JOBS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Your work history. {stats.total} jobs completed</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {/* Stats Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:24}}>
          <div style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>JOBS COMPLETED</div>
            <div style={{fontSize:28,fontWeight:900,color:"#00ff00"}}>{stats.total}</div>
          </div>
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>TOTAL EARNED</div>
            <div style={{fontSize:28,fontWeight:900,color:"#FFD700"}}>${stats.totalEarned.toLocaleString()}</div>
          </div>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ff00",color:"#00ff00",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          ✅ WORK ARCHIVE: Your completed jobs. Use for credibility with new clients.
        </div>

        {completedPains.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontSize:16,fontWeight:900}}>No completed jobs yet</div>
            <div style={{fontSize:12,marginTop:8}}>Complete jobs from Assigned Jobs to see them here</div>
            <button onClick={()=>window.location.href="/my-work/pains/assigned"} style={{marginTop:16,padding:"10px 20px",background:"#00ccff",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
              View Assigned Jobs →
            </button>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {completedPains.map((pain:any) => (
              <div 
                key={pain.id} 
                style={{
                  border:"1px solid #00ff00",
                  borderRadius:12,
                  padding:16,
                  background:"#0a0f1a"
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{fontWeight:900,fontSize:16,color:"#00ff00"}}>{pain.title}</div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#00ff00",color:"#000",fontWeight:900}}>
                        COMPLETED
                      </div>
                    </div>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                      {pain.state} • {pain.painType} • Completed {new Date(pain.completedDate).toLocaleDateString()}
                    </div>
                    {pain.budget && (
                      <div style={{fontSize:13}}>
                        <span style={{opacity:0.7}}>Earned:</span> <span style={{fontWeight:900,color:"#FFD700"}}>${parseFloat(pain.budget).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {pain.jobNotes && pain.jobNotes.length > 0 && (
                  <div style={{marginBottom:12,padding:12,background:"#05070d",borderRadius:6,border:"1px solid #1a1f2a"}}>
                    <div style={{fontSize:10,opacity:0.7,marginBottom:6,fontWeight:900}}>JOB NOTES</div>
                    {pain.jobNotes.map((note:any,idx:number) => (
                      <div key={idx} style={{fontSize:12,marginBottom:4,opacity:0.8}}>
                        {note.text}
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={()=>handleReopen(pain.id)} 
                  style={{padding:"8px 16px",borderRadius:8,background:"#222",color:"#00ccff",border:"1px solid #00ccff",fontSize:12,fontWeight:900}}
                >
                  Reopen to Assigned Jobs
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
