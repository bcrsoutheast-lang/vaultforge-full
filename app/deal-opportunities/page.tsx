"use client";

import { useEffect, useState } from "react";

export default function DealOpportunities() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadDeals();
  }, [currentEmail]);

  function loadDeals() {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const activeDeals = allDeals.filter((d:any) => 
      d.status === "active" && 
      d.postedBy!== currentEmail
    ).sort((a:any,b:any) => b.postedAt - a.postedAt);
    setDeals(activeDeals);
  }

  function handleSaveDeal(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => {
      if (d.id === dealId) {
        const savedBy = d.savedBy || [];
        if (!savedBy.includes(currentEmail)) {
          savedBy.push(currentEmail);
        }
        return {...d, savedBy};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    loadDeals();
  }

  function handleUnsaveDeal(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => {
      if (d.id === dealId) {
        return {
    ...d,
          savedBy: d.savedBy?.filter((email:string) => email!== currentEmail) || []
        };
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    loadDeals();
  }

  function handleMessagePoster(deal: any) {
    window.location.href = `/my-work/messages?to=${deal.postedBy}`;
  }

  function isSaved(deal: any) {
    return deal.savedBy?.includes(currentEmail) || false;
  }

  const filteredDeals = deals.filter(d => {
    const matchesFilter = filter === "all" || d.dealType === filter;
    const matchesSearch = searchTerm === "" || 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.propertyType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: deals.length,
    wholesale: deals.filter(d=>d.dealType==="wholesale").length,
    flip: deals.filter(d=>d.dealType==="flip").length,
    "buy-hold": deals.filter(d=>d.dealType==="buy-hold").length
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>DEAL OPPORTUNITIES</h1>
            <div style={{fontSize:11,opacity:0.7}}>Internal feed. AI-matched deals from VaultForge members. {deals.length} active</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🤖 AI-MATCHED: These deals were pushed from private Deal Rooms. VaultForge alerts you only to deals matching your buy box.
        </div>

        <div style={{marginBottom:16}}>
          <input 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            placeholder="Search by title, state, property type..."
            style={{width:"100%",padding:"12px 16px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:14}}
          />
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["all","wholesale","flip","buy-hold"].map(f => (
            <button 
              key={f}
              onClick={()=>setFilter(f)} 
              style={{
                padding:"6px 12px",
                borderRadius:999,
                border:"1px solid #333",
                background:filter===f?"#FFD700":"#0a0f1a",
                color:filter===f?"#000":"#fff",
                fontSize:11,
                fontWeight:900
              }}
            >
              {f.toUpperCase()} ({counts[f as keyof typeof counts]})
            </button>
          ))}
        </div>

        {filteredDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📭</div>
            <div style={{fontSize:16,fontWeight:900}}>No deals available</div>
            <div style={{fontSize:12,marginTop:8}}>
              {searchTerm? "No deals match your search" : "VaultForge AI will alert you when deals match your buy box"}
            </div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredDeals.map((deal:any) => (
              <div 
                key={deal.id} 
                style={{
                  border:"1px solid #FFD700",
                  borderRadius:12,
                  padding:16,
                  background:"#0a0f1a"
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{fontWeight:900,fontSize:16,color:"#FFD700"}}>{deal.title}</div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#1a1f2a",border:"1px solid #FFD700",fontWeight:900}}>
                        {deal.dealType.toUpperCase()}
                      </div>
                    </div>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                      {deal.state} • {deal.propertyType} • Posted by {deal.postedBy} • {new Date(deal.postedAt).toLocaleDateString()}
                    </div>
                    <div style={{display:"flex",gap:16,fontSize:13}}>
                      <div><span style={{opacity:0.7}}>Ask:</span> <span style={{fontWeight:900}}>${parseFloat(deal.askPrice).toLocaleString()}</span></div>
                      <div><span style={{opacity:0.7}}>ARV:</span> <span style={{fontWeight:900}}>${parseFloat(deal.arv).toLocaleString()}</span></div>
                      {deal.repair && <div><span style={{opacity:0.7}}>Repair:</span> <span style={{fontWeight:900}}>${parseFloat(deal.repair).toLocaleString()}</span></div>}
                    </div>
                    {deal.vaultForgeAnalysis && (
                      <div style={{marginTop:8,padding:"6px 12px",borderRadius:6,background:"#05070d",border:"1px solid #00ff00",fontSize:12}}>
                        <span style={{color:"#00ff00",fontWeight:900}}>
                          ${deal.vaultForgeAnalysis.profit.toLocaleString()} PROFIT | {deal.vaultForgeAnalysis.roi}% ROI
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {deal.notes && (
                  <div style={{fontSize:12,opacity:0.8,marginBottom:12,padding:12,background:"#05070d",borderRadius:6,border:"1px solid #1a1f2a"}}>
                    {deal.notes}
                  </div>
                )}

                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {isSaved(deal)? (
                    <button 
                      onClick={()=>handleUnsaveDeal(deal.id)} 
                      style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                    >
                      ★ Saved
                    </button>
                  ) : (
                    <button 
                      onClick={()=>handleSaveDeal(deal.id)} 
                      style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                    >
                      Save Deal
                    </button>
                  )}
                  <button 
                    onClick={()=>handleMessagePoster(deal)} 
                    style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,background:"#222",color:"#00ccff",border:"1px solid #00ccff",fontSize:12,fontWeight:900}}
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
