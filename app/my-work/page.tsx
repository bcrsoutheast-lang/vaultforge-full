"use client";

import { useEffect, useState } from "react";

export default function MyWork() {
  const [stats, setStats] = useState({
    draftDeals: 0,
    savedDeals: 0,
    underContract: 0,
    sold: 0,
    draftPains: 0,
    savedPains: 0,
    assignedPains: 0,
    resolved: 0,
    alerts: 0
  });

  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";
  const currentName = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_name") || "Member" : "Member";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const alerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");

    const myDeals = deals.filter((d:any) => d.postedBy === currentEmail || d.savedBy?.includes(currentEmail) || d.assignedTo === currentEmail);
    const myPains = pains.filter((p:any) => p.postedBy === currentEmail || p.savedBy?.includes(currentEmail) || p.assignedTo === currentEmail);
    const myAlerts = alerts.filter((a:any) => a.for === currentEmail &&!a.read);

    setStats({
      draftDeals: myDeals.filter((d:any) => d.status === "draft" && d.postedBy === currentEmail).length,
      savedDeals: myDeals.filter((d:any) => d.status === "saved").length,
      underContract: myDeals.filter((d:any) => d.status === "under-contract").length,
      sold: myDeals.filter((d:any) => d.status === "sold").length,
      draftPains: myPains.filter((p:any) => p.status === "draft" && p.postedBy === currentEmail).length,
      savedPains: myPains.filter((p:any) => p.status === "saved").length,
      assignedPains: myPains.filter((p:any) => p.status === "assigned").length,
      resolved: myPains.filter((p:any) => p.status === "resolved").length,
      alerts: myAlerts.length
    });
  }, [currentEmail]);

  const dealCards = [
    { title: "DEAL ROOM", desc: "Create deal projects", href: "/my-work/deal-room", count: stats.draftDeals, color: "#FFD700", icon: "🏢" },
    { title: "Saved", desc: "Deals from Opportunities", href: "/my-work/deals/saved", count: stats.savedDeals, color: "#FFD700", icon: "⭐" },
    { title: "Under Contract", desc: "Your pipeline", href: "/my-work/deals/under-contract", count: stats.underContract, color: "#00ff00", icon: "📝" },
    { title: "Sold", desc: "Closed deals", href: "/my-work/deals/sold", count: stats.sold, color: "#00ff00", icon: "💰" },
  ];

  const painCards = [
    { title: "PAIN INTAKE", desc: "Create pain projects", href: "/my-work/pain-intake", count: stats.draftPains, color: "#00ccff", icon: "🔧" },
    { title: "Saved", desc: "Pains from Pain Room", href: "/my-work/pains/saved", count: stats.savedPains, color: "#00ccff", icon: "⭐" },
    { title: "Assigned", desc: "Jobs you're working", href: "/my-work/pains/assigned", count: stats.assignedPains, color: "#FFA500", icon: "🔨" },
    { title: "Resolved", desc: "Completed jobs", href: "/my-work/pains/resolved", count: stats.resolved, color: "#00ff00", icon: "✅" },
  ];

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:32,marginBottom:4}}>MY WORK</h1>
          <div style={{fontSize:14,opacity:0.7}}>Command Center for {currentName}</div>
        </div>

        {stats.alerts > 0 && (
          <div 
            onClick={()=>window.location.href="/my-work/alerts"} 
            style={{background:"#0a0f1a",border:"1px solid #ff4444",color:"#ff4444",padding:"12px 16px",borderRadius:8,marginBottom:24,fontSize:14,fontWeight:900,cursor:"pointer"}}
          >
            🔔 {stats.alerts} NEW ALERT{stats.alerts>1?"S":""} - AI found matches for you →
          </div>
        )}

        <div style={{marginBottom:32}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:12,color:"#FFD700"}}>DEALS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12}}>
            {dealCards.map(card => (
              <div 
                key={card.title}
                onClick={()=>window.location.href=card.href}
                style={{border:`1px solid ${card.color}`,borderRadius:12,padding:16,background:"#0a0f1a",cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
                  <div style={{fontSize:24}}>{card.icon}</div>
                  <div style={{fontSize:28,fontWeight:900,color:card.color}}>{card.count}</div>
                </div>
                <div style={{fontWeight:900,fontSize:16,color:card.color}}>{card.title}</div>
                <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:32}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:12,color:"#00ccff"}}>PAINS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12}}>
            {painCards.map(card => (
              <div 
                key={card.title}
                onClick={()=>window.location.href=card.href}
                style={{border:`1px solid ${card.color}`,borderRadius:12,padding:16,background:"#0a0f1a",cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
                  <div style={{fontSize:24}}>{card.icon}</div>
                  <div style={{fontSize:28,fontWeight:900,color:card.color}}>{card.count}</div>
                </div>
                <div style={{fontWeight:900,fontSize:16,color:card.color}}>{card.title}</div>
                <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12}}>
          <div 
            onClick={()=>window.location.href="/deal-opportunities"}
            style={{border:"1px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a",cursor:"pointer"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>📈</div>
            <div style={{fontWeight:900,fontSize:16,color:"#FFD700"}}>DEAL OPPORTUNITIES</div>
            <div style={{fontSize:11,opacity:0.7,marginTop:4}}>Browse member deals</div>
          </div>
          
          <div 
            onClick={()=>window.location.href="/pain-room"}
            style={{border:"1px solid #00ccff",borderRadius:12,padding:16,background:"#0a0f1a",cursor:"pointer"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>🏠</div>
            <div style={{fontWeight:900,fontSize:16,color:"#00ccff"}}>PAIN ROOM</div>
            <div style={{fontSize:11,opacity:0.7,marginTop:4}}>Browse member pains</div>
          </div>

          <div 
            onClick={()=>window.location.href="/my-work/messages"}
            style={{border:"1px solid #666",borderRadius:12,padding:16,background:"#0a0f1a",cursor:"pointer"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>💬</div>
            <div style={{fontWeight:900,fontSize:16}}>MESSAGES</div>
            <div style={{fontSize:11,opacity:0.7,marginTop:4}}>Member DMs</div>
          </div>

          <div 
            onClick={()=>window.location.href="/my-work/profile"}
            style={{border:"1px solid #666",borderRadius:12,padding:16,background:"#0a0f1a",cursor:"pointer"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>👤</div>
            <div style={{fontWeight:900,fontSize:16}}>PROFILE</div>
            <div style={{fontSize:11,opacity:0.7,marginTop:4}}>Feeds AI routing</div>
          </div>
        </div>
      </div>
    </main>
  );
}
