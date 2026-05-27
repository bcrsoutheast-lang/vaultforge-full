"use client";

import { useEffect, useState } from "react";

export default function AssignedJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const myJobs = allPains.filter((p:any) => p.assignedTo === currentEmail && p.status === "assigned");
    setJobs(myJobs.sort((a:any,b:any) => b.postedAt - a.postedAt));
  }, []);

  function handleMarkComplete(painId: number) {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = allPains.map((p:any) => p.id === painId? {...p, status: "completed", completedAt: Date.now()} : p);
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    setJobs(jobs.filter(j => j.id!== painId));
    alert("Job marked complete");
  }

  function handleUnassign(painId: number) {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const updated = allPains.map((p:any) => p.id === painId? {...p, status: "active", assignedTo: null} : p);
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    setJobs(jobs.filter(j => j.id!== painId));
  }

  const urgencyColors: any = {
    emergency: "#ff0000",
    high: "#ff8800", 
    medium: "#FFD700",
    low: "#00ff00"
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ccff"}}>
          <h1 style={{color:"#00ccff",fontWeight:900,fontSize:24}}>ASSIGNED JOBS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Jobs you claimed. Complete them to move to Completed.</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          <button onClick={()=>window.location.href="/pain-room"} style={{padding:"8px 16px",border:"1px solid #00ccff",borderRadius:8,color:"#00ccff",background:"none",fontSize:12}}>Browse More Jobs</button>
        </div>

        {jobs.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔨</div>
            <div style={{fontSize:16,fontWeight:900}}>No assigned jobs</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {jobs.map((job:any) => (
              <div key={job.id} style={{border:`1px solid ${urgencyColors[job.urgency]}`,borderRadius:12,padding:16,background:"#0a0f1a",boxShadow:`0 0 12px ${urgencyColors[job.urgency]}20`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#00ccff"}}>{job.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{job.state} | {job.propertyType} | {job.painType}</div>
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:`${urgencyColors[job.urgency]}20`,border:`1px solid ${urgencyColors[job.urgency]}`,color:urgencyColors[job.urgency],fontWeight:900}}>{job.urgency.toUpperCase()}</div>
                </div>
                <div style={{fontSize:12,opacity:0.8,marginBottom:12,lineHeight:1.5}}>{job.description}</div>
                {job.budget && <div style={{fontSize:12,marginBottom:12}}><span style={{opacity:0.6}}>BUDGET:</span> <span style={{fontWeight:900,color:"#00ff00"}}>{job.budget}</span></div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>handleMarkComplete(job.id)} style={{padding:"10px",borderRadius:8,background:"#00ff00",color:"#000",border:"none",fontSize:12,fontWeight:900}}>MARK COMPLETE</button>
                  <button onClick={()=>handleUnassign(job.id)} style={{padding:"10px",borderRadius:8,background:"none",color:"#ff0000",border:"1px solid #ff0000",fontSize:12,fontWeight:900}}>UNASSIGN</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
