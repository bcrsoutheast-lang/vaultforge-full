"use client";

import { useEffect, useState } from "react";

export default function SavedDeals() {
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadSavedDeals();
  }, [currentEmail]);

  function loadSavedDeals() {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const saved = deals.filter((d:any) => 
      d.savedBy?.includes(currentEmail) && 
      d.status === "active" && 
      d.postedBy!== currentEmail
    ).sort((a:any,b:any) => b.postedAt - a.postedAt);
    setSavedDeals(saved);
  }

  function handleUnsave(dealId: number) {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === dealId) {
        return {
       ...d,
          savedBy: d.savedBy?.filter((email:string) => email!== currentEmail) || []
        };
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    loadSavedDeals();
  }

  function handleMoveToUnderContract(dealId: number) {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === dealId) {
        return {
       ...d,
          status: "under-contract",
          assignedTo: currentEmail,
          contractDate: Date.now()
        };
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert("Moved to Under Contract");
    loadSavedDeals();
  }

  function handleMessagePoster(deal: any) {
    window.location.href = `/my-work/messages?to=${deal.postedBy}`;
  }

  const filteredDeals = savedDeals.filter(d => {
    if (filter === "all") return true;
    if (filter === "wholesale") return d.dealType === "wholesale";
    if (filter === "flip") return d.dealType === "flip";
    if (filter === "buy-hold") return d.dealType === "buy-hold";
    return true;
  });

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>SAVED DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Deals you saved from Deal Opportunities. {savedDeals.length} total</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
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
              {f.toUpperCase()} {f==="all"? `(${savedDeals.length})` : `(${savedDeals.filter(d=>d.dealType===f).length})`}
            </button>
          ))}
        </div>

        {filteredDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>⭐</div>
            <div style={{fontSize:16,fontWeight:900}}>No saved deals yet</div>
            <div style={{fontSize:12,marginTop:8}}>Browse Deal Opportunities and click "Save" on deals you like</div>
            <button onClick={()=>window.location.href="/deal-opportunities"} style={{marginTop:16,padding:"10px 20px",background:"#FFD700",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
              Browse Deal Opportunities →
            </button>
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
                    <div style={{fontWeight:900,fontSize:16,color:"#FFD700",marginBottom:4}}>{deal.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                      {deal.state} • {deal.propertyType} • {deal.dealType} • Posted {new Date(deal.postedAt).toLocaleDateString()}
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
                  <button 
                    onClick={()=>handleMoveToUnderContract(deal.id)} 
                    style={{flex:1,minWidth:140,padding:"10px",borderRadius:8,background:"#00ff00",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                  >
                    Move to Under Contract
                  </button>
                  <button 
                    onClick={()=>handleMessagePoster(deal)} 
                    style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                  >
                    Message Poster
                  </button>
                  <button 
                    onClick={()=>handleUnsave(deal.id)} 
                    style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#ff4444",border:"1px solid #ff4444",fontSize:12,fontWeight:900}}
                  >
                    Unsave
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
