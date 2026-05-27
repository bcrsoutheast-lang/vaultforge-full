"use client";

import { useEffect, useState } from "react";

export default function MyWork() {
  const [name, setName] = useState("");
  const [alertCount, setAlertCount] = useState(0);
  const [dealCounts, setDealCounts] = useState({drafts: 0, saved: 0, contract: 0, sold: 0});
  const [jobCounts, setJobCounts] = useState({assigned: 0, completed: 0});

  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    setName(localStorage.getItem("vaultforge_current_name") || "Investor");
    
    // Load alert count
    const alerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    setAlertCount(alerts.filter((a:any) => a.for === currentEmail &&!a.read).length);
    
    // Load deal counts
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    setDealCounts({
      drafts: deals.filter((d:any) => d.postedBy === currentEmail && d.status === "draft").length,
      saved: deals.filter((d:any) => d.savedBy?.includes(currentEmail)).length,
      contract: deals.filter((d:any) => d.underContractBy === currentEmail && d.status === "under-contract").length,
      sold: deals.filter((d:any) => d.underContractBy === currentEmail && d.status === "sold").length
    });

    // Load job counts 
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    setJobCounts({
      assigned: pains.filter((p:any) => p.assignedTo === currentEmail && p.status === "assigned").length,
      completed: pains.filter((p:any) => p.assignedTo === currentEmail && p.status === "completed").length
    });
  }, [currentEmail]);

  const cardStyle = {
    border: "1px solid #FFD700",
    borderRadius: 12,
    padding: 20,
    background: "#0a0f1a",
    cursor: "pointer",
    transition: "all 0.2s"
  };

  const countStyle = {
    fontSize: 32,
    fontWeight: 900,
    color: "#FFD700",
    marginBottom: 8
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:32,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:80,margin:"0 auto 16px",filter:"drop-shadow(0 0 20px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:28,letterSpacing:2}}>MY WORK</h1>
          <div style={{fontSize:14,opacity:0.7,marginTop:8}}>Welcome back, {name}</div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16,marginBottom:32}}>
          <button onClick={()=>window.location.href="/my-work/deal-room"} style={{...cardStyle,background:"#FFD70020"}}>
            <div style={{fontSize:36,marginBottom:12}}>💰</div>
            <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>POST DEAL</div>
            <div style={{fontSize:11,opacity:0.7}}>Submit new property to AI routing</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/pain-intake"} style={{...cardStyle,background:"#00ccff20",border:"1px solid #00ccff"}}>
            <div style={{fontSize:36,marginBottom:12}}>🔨</div>
            <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>POST PAIN</div>
            <div style={{fontSize:11,opacity:0.7}}>Request contractor help with AI matching</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/alerts"} style={{...cardStyle,position:"relative"}}>
            {alertCount > 0 && (
              <div style={{position:"absolute",top:12,right:12,background:"#ff0000",color:"#fff",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900}}>
                {alertCount}
              </div>
            )}
            <div style={{fontSize:36,marginBottom:12}}>🔔</div>
            <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>ALERTS</div>
            <div style={{fontSize:11,opacity:0.7}}>{alertCount} unread AI matches</div>
          </button>

          <button onClick={()=>window.location.href="/deal-opportunities"} style={{...cardStyle}}>
            <div style={{fontSize:36,marginBottom:12}}>🎯</div>
            <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>OPPORTUNITIES</div>
            <div style={{fontSize:11,opacity:0.7}}>Browse AI-matched deals</div>
          </button>

          <button onClick={()=>window.location.href="/pain-room"} style={{...cardStyle}}>
            <div style={{fontSize:36,marginBottom:12}}>⚡</div>
            <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>PAIN ROOM</div>
            <div style={{fontSize:11,opacity:0.7}}>Browse AI-matched jobs</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/members"} style={{...cardStyle}}>
            <div style={{fontSize:36,marginBottom:12}}>👥</div>
            <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>MEMBERS</div>
            <div style={{fontSize:11,opacity:0.7}}>Find investors & contractors</div>
          </button>
        </div>

        {/* DEALS PIPELINE */}
        <div style={{marginBottom:32}}>
          <div style={{fontSize:14,fontWeight:900,color:"#FFD700",marginBottom:16,letterSpacing:1}}>DEALS PIPELINE</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
            <button onClick={()=>window.location.href="/my-work/deals/drafts"} style={cardStyle}>
              <div style={countStyle}>{dealCounts.drafts}</div>
              <div style={{fontSize:12,fontWeight:900}}>DRAFTS</div>
              <div style={{fontSize:10,opacity:0.6,marginTop:4}}>Unpublished</div>
            </button>
            <button onClick={()=>window.location.href="/my-work/deals/saved"} style={cardStyle}>
              <div style={countStyle}>{dealCounts.saved}</div>
              <div style={{fontSize:12,fontWeight:900}}>SAVED</div>
              <div style={{fontSize:10,opacity:0.6,marginTop:4}}>From opportunities</div>
            </button>
            <button onClick={()=>window.location.href="/my-work/deals/under-contract"} style={{...cardStyle,border:"1px solid #00ff00"}}>
              <div style={{...countStyle,color:"#00ff00"}}>{dealCounts.contract}</div>
              <div style={{fontSize:12,fontWeight:900}}>UNDER CONTRACT</div>
              <div style={{fontSize:10,opacity:0.6,marginTop:4}}>Closing soon</div>
            </button>
            <button onClick={()=>window.location.href="/my-work/deals/sold"} style={cardStyle}>
              <div style={countStyle}>{dealCounts.sold}</div>
              <div style={{fontSize:12,fontWeight:900}}>SOLD</div>
              <div style={{fontSize:10,opacity:0.6,marginTop:4}}>Closed deals</div>
            </button>
          </div>
        </div>

        {/* JOBS PIPELINE */}
        <div style={{marginBottom:32}}>
          <div style={{fontSize:14,fontWeight:900,color:"#00ccff",marginBottom:16,letterSpacing:1}}>JOBS PIPELINE</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
            <button onClick={()=>window.location.href="/my-work/jobs/assigned"} style={{...cardStyle,border:"1px solid #00ccff"}}>
              <div style={{...countStyle,color:"#00ccff"}}>{jobCounts.assigned}</div>
              <div style={{fontSize:12,fontWeight:900}}>ASSIGNED</div>
              <div style={{fontSize:10,opacity:0.6,marginTop:4}}>Active jobs</div>
            </button>
            <button onClick={()=>window.location.href="/my-work/jobs/completed"} style={{...cardStyle,border:"1px solid #00ff00"}}>
              <div style={{...countStyle,color:"#00ff00"}}>{jobCounts.completed}</div>
              <div style={{fontSize:12,fontWeight:900}}>COMPLETED</div>
              <div style={{fontSize:10,opacity:0.6,marginTop:4}}>Finished work</div>
            </button>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
          <button onClick={()=>window.location.href="/my-work/profile"} style={{padding:16,borderRadius:8,border:"1px solid #333",background:"none",color:"#fff",fontSize:12}}>
            ⚙️ PROFILE SETTINGS
          </button>
          <button onClick={()=>window.location.href="/my-work/messages"} style={{padding:16,borderRadius:8,border:"1px solid #333",background:"none",color:"#fff",fontSize:12}}>
            💬 MESSAGES
          </button>
        </div>
      </div>
    </main>
  );
}
