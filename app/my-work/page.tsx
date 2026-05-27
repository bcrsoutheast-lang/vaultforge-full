"use client";

import { useEffect, useState } from "react";

export default function MyWork() {
  const [stats, setStats] = useState({
    savedDeals: 0,
    underContract: 0,
    soldDeals: 0,
    totalProfit: 0,
    assignedJobs: 0,
    completedJobs: 0,
    unreadMessages: 0,
    unreadAlerts: 0,
    availableDeals: 0,
    availablePains: 0
  });
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";
  const currentName = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_name") || "Member" : "Member";

  useEffect(() => {
    loadStats();
  }, [currentEmail]);

  function loadStats() {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const messages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const alerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");

    const savedDeals = deals.filter((d:any) => d.savedBy?.includes(currentEmail) && d.status === "active").length;
    const underContract = deals.filter((d:any) => d.status === "under-contract" && (d.assignedTo === currentEmail || d.postedBy === currentEmail)).length;
    const soldDeals = deals.filter((d:any) => d.status === "sold" && (d.assignedTo === currentEmail || d.postedBy === currentEmail));
    
    let totalProfit = 0;
    soldDeals.forEach((d:any) => {
      if (d.vaultForgeAnalysis?.profit) totalProfit += d.vaultForgeAnalysis.profit;
    });

    const assignedJobs = pains.filter((p:any) => p.assignedTo === currentEmail && p.status!== "completed").length;
    const completedJobs = pains.filter((p:any) => p.assignedTo === currentEmail && p.status === "completed").length;
    
    const unreadMessages = messages.filter((m:any) => m.to === currentEmail &&!m.read).length;
    const unreadAlerts = alerts.filter((a:any) => a.for === currentEmail &&!a.read).length;

    // NEW: Count available deals/pains pushed to you
    const availableDeals = deals.filter((d:any) => d.status === "active" && d.postedBy!== currentEmail).length;
    const availablePains = pains.filter((p:any) => p.status === "active" && p.postedBy!== currentEmail).length;

    setStats({
      savedDeals,
      underContract,
      soldDeals: soldDeals.length,
      totalProfit,
      assignedJobs,
      completedJobs,
      unreadMessages,
      unreadAlerts,
      availableDeals,
      availablePains
    });
  }

  const workspaces = [
    {
      section: "DEAL FLOW",
      color: "#FFD700",
      items: [
        { name: "Deal Opportunities", desc: `${stats.availableDeals} deals available`, path: "/deal-opportunities", icon: "🏠", highlight: true },
        { name: "Deal Room", desc: "Create private deals", path: "/my-work/deal-room", icon: "🏗️" },
        { name: "Saved Deals", desc: `${stats.savedDeals} deals saved`, path: "/my-work/deals/saved", icon: "⭐" },
        { name: "Under Contract", desc: `${stats.underContract} in pipeline`, path: "/my-work/deals/under-contract", icon: "📝" },
        { name: "Sold Deals", desc: `${stats.soldDeals} closed | $${stats.totalProfit.toLocaleString()}`, path: "/my-work/deals/sold", icon: "💰" }
      ]
    },
    {
      section: "PAIN FLOW",
      color: "#00ccff",
      items: [
        { name: "Pain Room", desc: `${stats.availablePains} pains available`, path: "/pain-room", icon: "🔧", highlight: true },
        { name: "Pain Intake", desc: "Create private pains", path: "/my-work/pain-intake", icon: "📋" },
        { name: "Assigned Jobs", desc: `${stats.assignedJobs} active jobs`, path: "/my-work/pains/assigned", icon: "🔨" },
        { name: "Completed Jobs", desc: `${stats.completedJobs} completed`, path: "/my-work/pains/completed", icon: "✅" }
      ]
    },
    {
      section: "COMMUNICATION",
      color: "#FF00FF",
      items: [
        { name: "Messages", desc: `${stats.unreadMessages} unread`, path: "/my-work/messages", icon: "💬", badge: stats.unreadMessages },
        { name: "Alerts", desc: `${stats.unreadAlerts} new matches`, path: "/my-work/alerts", icon: "🔔", badge: stats.unreadAlerts }
      ]
    },
    {
      section: "ACCOUNT",
      color: "#999",
      items: [
        { name: "Profile", desc: "Buy box, settings, pic", path: "/my-work/profile", icon: "👤" },
        { name: "Drafts", desc: "Unpublished work", path: "/my-work/drafts", icon: "📄" }
      ]
    }
  ];

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1400,margin:"0 auto"}}>
        {/* LOGO FRONT AND CENTER */}
        <div style={{textAlign:"center",marginBottom:32,padding:"24px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:80,margin:"0 auto 16px",filter:"drop-shadow(0 0 20px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:32,letterSpacing:2,marginBottom:8}}>COMMAND CENTER</h1>
          <div style={{fontSize:14,opacity:0.8}}>Welcome back, <span style={{color:"#FFD700",fontWeight:900}}>{currentName}</span></div>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Your private workspace. Build deals. Solve pains. Close wins.</div>
        </div>

        {/* QUICK STATS BAR */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:32}}>
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>PIPELINE</div>
            <div style={{fontSize:24,fontWeight:900,color:"#FFD700"}}>{stats.underContract}</div>
          </div>
          <div style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>LIFETIME PROFIT</div>
            <div style={{fontSize:24,fontWeight:900,color:"#00ff00"}}>${stats.totalProfit.toLocaleString()}</div>
          </div>
          <div style={{border:"1px solid #00ccff",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>ACTIVE JOBS</div>
            <div style={{fontSize:24,fontWeight:900,color:"#00ccff"}}>{stats.assignedJobs}</div>
          </div>
          <div style={{border:"1px solid #FF00FF",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>UNREAD</div>
            <div style={{fontSize:24,fontWeight:900,color:"#FF00FF"}}>{stats.unreadMessages + stats.unreadAlerts}</div>
          </div>
        </div>

        {/* WORKSPACES GRID */}
        {workspaces.map((section:any) => (
          <div key={section.section} style={{marginBottom:32}}>
            <div style={{fontSize:12,fontWeight:900,color:section.color,marginBottom:12,letterSpacing:1}}>
              {section.section}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
              {section.items.map((item:any) => (
                <button
                  key={item.path}
                  onClick={()=>window.location.href=item.path}
                  style={{
                    border:`1px solid ${section.color}`,
                    borderRadius:12,
                    padding:20,
                    background: item.highlight? "#1a1f2a" : "#0a0f1a",
                    color:"#fff",
                    textAlign:"left",
                    cursor:"pointer",
                    transition:"all 0.2s",
                    position:"relative",
                    boxShadow: item.highlight? `0 0 12px ${section.color}40` : "none"
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.background="#1a1f2a";
                    e.currentTarget.style.transform="translateY(-2px)";
                    e.currentTarget.style.boxShadow=`0 4px 12px ${section.color}60`;
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.background= item.highlight? "#1a1f2a" : "#0a0f1a";
                    e.currentTarget.style.transform="translateY(0)";
                    e.currentTarget.style.boxShadow= item.highlight? `0 0 12px ${section.color}40` : "none";
                  }}
                >
                  {item.badge > 0 && (
                    <div style={{position:"absolute",top:12,right:12,background:"#ff4444",color:"#fff",borderRadius:999,padding:"2px 8px",fontSize:10,fontWeight:900}}>
                      {item.badge}
                    </div>
                  )}
                  <div style={{fontSize:32,marginBottom:8}}>{item.icon}</div>
                  <div style={{fontWeight:900,fontSize:16,marginBottom:4,color:section.color}}>{item.name}</div>
                  <div style={{fontSize:12,opacity:0.7}}>{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
