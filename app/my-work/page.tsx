"use client";

import { useEffect, useState } from "react";

export default function MyWorkCommand() {
  const [activeTab, setActiveTab] = useState<"deals"|"pains">("deals");
  const [dealStats, setDealStats] = useState({saved:0,archived:0,deleted:0,underContract:0,sold:0,drafts:0});
  const [painStats, setPainStats] = useState({saved:0,archived:0,deleted:0,assigned:0,resolved:0,monitoring:0});
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    
    // Deal stats - YOUR workspace only
    const myDeals = deals.filter((d:any) => d.postedBy === currentEmail);
    setDealStats({
      saved: deals.filter((d:any) => d.savedBy?.includes(currentEmail)).length,
      archived: myDeals.filter((d:any) => d.status === "archived").length,
      deleted: myDeals.filter((d:any) => d.status === "deleted").length,
      underContract: myDeals.filter((d:any) => d.status === "under_contract").length,
      sold: myDeals.filter((d:any) => d.status === "sold").length,
      drafts: myDeals.filter((d:any) => d.status === "draft").length
    });

    // Pain stats - YOUR workspace only
    const myPains = pains.filter((p:any) => p.postedBy === currentEmail);
    setPainStats({
      saved: pains.filter((p:any) => p.savedBy?.includes(currentEmail)).length,
      archived: myPains.filter((p:any) => p.status === "archived").length,
      deleted: myPains.filter((p:any) => p.status === "deleted").length,
      assigned: myPains.filter((p:any) => p.status === "assigned").length,
      resolved: myPains.filter((p:any) => p.status === "resolved").length,
      monitoring: myPains.filter((p:any) => p.status === "monitoring").length
    });
  }, [currentEmail]);

  const dealCards = [
    {label:"Saved Deals",val:dealStats.saved,color:"#FFD700",route:"/my-work/deals/saved",desc:"Deals you saved from marketplace"},
    {label:"Under Contract",val:dealStats.underContract,color:"#00ff00",route:"/my-work/deals/under-contract",desc:"Deals locked, closing soon"},
    {label:"Sold",val:dealStats.sold,color:"#00ff00",route:"/my-work/deals/sold",desc:"Closed deals, money made"},
    {label:"Archived",val:dealStats.archived,color:"#666",route:"/my-work/deals/archived",desc:"Old deals, keep for records"},
    {label:"Deleted",val:dealStats.deleted,color:"#ff4444",route:"/my-work/deals/deleted",desc:"Trash - auto-delete 30 days"},
    {label:"Drafts",val:dealStats.drafts,color:"#FFA500",route:"/my-work/deals/drafts",desc:"Unfinished deals"}
  ];

  const painCards = [
    {label:"Saved Pains",val:painStats.saved,color:"#FFD700",route:"/my-work/pains/saved",desc:"Pain points you saved to monitor"},
    {label:"Assigned",val:painStats.assigned,color:"#00ff00",route:"/my-work/pains/assigned",desc:"Contractor assigned, in progress"},
    {label:"Resolved",val:painStats.resolved,color:"#00ff00",route:"/my-work/pains/resolved",desc:"Fixed, problem closed"},
    {label:"Monitoring",val:painStats.monitoring,color:"#FFA500",route:"/my-work/pains/monitoring",desc:"Watching for recurrence"},
    {label:"Archived",val:painStats.archived,color:"#666",route:"/my-work/pains/archived",desc:"Old pains, keep for records"},
    {label:"Deleted",val:painStats.deleted,color:"#ff4444",route:"/my-work/pains/deleted",desc:"Trash - auto-delete 30 days"}
  ];

  const cards = activeTab === "deals"? dealCards : painCards;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>MY WORK COMMAND CENTER</h1>
            <div style={{fontSize:11,opacity:0.7}}>Private workspace. Your deals. Your pains. Your money.</div>
          </div>
          <a href="/dashboard" style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",fontSize:12}}>← Dashboard</a>
        </div>

        {/* Alert Banner - Private */}
        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔒 PRIVATE WORKSPACE: Actions here do NOT affect public marketplace. This is your command center.
        </div>

        {/* Tab Switcher */}
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          <button 
            onClick={()=>setActiveTab("deals")} 
            style={{padding:"12px 24px",borderRadius:8,fontWeight:900,background:activeTab==="deals"?"#FFD700":"#222",color:activeTab==="deals"?"#000":"#fff",border:"none"}}
          >
            DEAL WORKSPACE
          </button>
          <button 
            onClick={()=>setActiveTab("pains")} 
            style={{padding:"12px 24px",borderRadius:8,fontWeight:900,background:activeTab==="pains"?"#FFD700":"#222",color:activeTab==="pains"?"#000":"#fff",border:"none"}}
          >
            PAIN WORKSPACE
          </button>
        </div>

        {/* 6 Cards Grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
          {cards.map(card => (
            <div 
              key={card.label}
              onClick={()=>window.location.href=card.route}
              style={{
                border:`1px solid ${card.color}`,
                borderRadius:12,
                padding:20,
                background:"#0a0f1a",
                cursor:"pointer",
                transition:"all 0.2s",
              }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 20px ${card.color}40`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
            >
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                <div style={{fontWeight:900,fontSize:16,color:card.color}}>{card.label}</div>
                <div style={{fontSize:32,fontWeight:900,color:card.color}}>{card.val}</div>
              </div>
              <div style={{fontSize:11,opacity:0.7}}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{marginTop:32,border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a"}}>
          <div style={{fontWeight:900,marginBottom:16,color:"#FFD700"}}>QUICK ACTIONS</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href="/deal-rooms/create" style={{padding:"8px 16px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:12,fontWeight:900}}>+ New Deal</a>
            <a href="/pain-rooms/create" style={{padding:"8px 16px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:12,fontWeight:900}}>+ New Pain</a>
            <a href="/deal-rooms" style={{padding:"8px 16px",border:"1px solid #FFD700",color:"#FFD700",borderRadius:6,fontSize:12}}>Browse Deals</a>
            <a href="/pain-rooms" style={{padding:"8px 16px",border:"1px solid #FFD700",color:"#FFD700",borderRadius:6,fontSize:12}}>Browse Pains</a>
          </div>
        </div>
      </div>
    </main>
  );
}
