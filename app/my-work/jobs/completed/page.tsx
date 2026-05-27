"use client";

import { useEffect, useState } from "react";

export default function CompletedJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allPains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const completed = allPains.filter((p:any) => p.assignedTo === currentEmail && p.status === "completed");
    setJobs(completed.sort((a:any,b:any) => b.completedAt - a.completedAt));
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ff00"}}>
          <h1 style={{color:"#00ff00",fontWeight:900,fontSize:24}}>COMPLETED JOBS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Jobs you finished. {jobs.length} total completed.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-start",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ff00",color:"#00ff00",padding:"16px",borderRadius:12,marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:11,opacity:0.7}}>TOTAL JOBS COMPLETED</div>
          <div style={{fontSize:32,fontWeight:900}}>{jobs.length}</div>
        </div>

        {jobs.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontSize:16,fontWeight:900}}>No completed jobs yet</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {jobs.map((job:any) => (
              <div key={job.id} style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#00ff00"}}>{job.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{job.state} | {job.propertyType} | {job.painType}</div>
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:"#00ff0020",border:"1px solid #00ff00",color:"#00ff00",fontWeight:900}}>COMPLETED</div>
                </div>
                <div style={{fontSize:12,opacity:0.8,marginBottom:12}}>{job.description}</div>
                <div style={{fontSize:11,opacity:0.6}}>
                  Completed: {new Date(job.completedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
