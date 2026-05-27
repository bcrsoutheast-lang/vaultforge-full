"use client";

import { useEffect, useState } from "react";

export default function DealOpportunities() {
  const [deals, setDeals] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState("all");
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    // Only show deals with status: "active" = published to Deal Opportunities
    const published = allDeals.filter((d:any) => d.status === "active");
    setDeals(published);
    
    // Get which deals YOU already saved to My Work
    const mySaved = allDeals.filter((d:any) => d.savedBy?.includes(currentEmail));
    setSavedIds(mySaved.map((d:any) => d.id));
  }, [currentEmail]);

  function handleSaveDeal(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const deal = allDeals.find((d:any) => d.id === dealId);
    if (!deal) return;

    // Create YOUR copy in My Work → Saved
    const myCopy = {
     ...deal,
      id: Date.now(), // New ID for your copy
      originalDealId: deal.id, // Link back to original
      status: "saved",
      savedBy: [currentEmail],
      savedAt: Date.now(),
      // Your copy is isolated - your actions don't affect original
    };
    
    allDeals.push(myCopy);
    localStorage.setItem("vaultforge_deals", JSON.stringify(allDeals));
    setSavedIds(prev => [...prev, dealId]);
    alert("Saved to My Work → Deals → Saved");
  }

  function handleMessagePoster(posterEmail: string) {
    window.location.href = `/my-work/messages?to=${posterEmail}`;
  }

  const filteredDeals = deals.filter(d => {
    if (filter === "all") return true;
    if (filter === "my-state") return d.state === "GA"; // TODO: Use member profile state
    if (filter === "wholesale") return d.dealType === "wholesale";
    if (filter === "flip") return d.dealType === "flip";
    return true;
  });

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>DEAL OPPORTUNITIES</h1>
            <div style={{fontSize:11,opacity:0.7}}>Internal member feed. {deals.length} deals from members. Save to your workspace.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔒 MEMBERS ONLY: Deals here are posted by members for members. Save to My Work to add to your pipeline. Your actions here don't affect other members.
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["all","my-state","wholesale","flip"].map(f => (
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
              {f === "all"? "All Deals" : f === "my-state"? "My State" : f.toUpperCase()}
            </button>
          ))}
        </div>

        {filteredDeals.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📭</div>
            <div>No deals in Deal Opportunities yet.</div>
            <div style={{fontSize:12,marginTop:8}}>Members push deals here from their Deal Room. Check back soon or post your own.</div>
            <button onClick={()=>window.location.href="/my-work/deal-room"} style={{marginTop:16,padding:"8px 16px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:12,fontWeight:900,border:"none"}}>Go to Deal Room</button>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredDeals.map((d:any) => {
              const isSaved = savedIds.includes(d.id);
              const isMine = d.postedBy === currentEmail;
              return (
                <div key={d.id} style={{border:"1px solid #333",borderRadius:12,padding:16,background:"#0a0f1a"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontWeight:900,fontSize:16}}>{d.title}</div>
                    <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>
                      {isMine? "YOUR POST" : "MEMBER DEAL"}
                    </div>
                  </div>
                  
                  <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#999"}}>{d.state} - {d.propertyType}</div>
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>Ask: {d.askPrice}</div>
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>ARV: {d.arv}</div>
                    {d.vaultForgeAnalysis && (
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #00ff00",color:"#00ff00"}}>
                        Profit: ${d.vaultForgeAnalysis.profit} | ROI: {d.vaultForgeAnalysis.roi}
                      </div>
                    )}
                  </div>

                  <div style={{opacity:0.8,fontSize:12,marginBottom:12}}>{d.notes?.slice(0,120)}...</div>
                  
                  <div style={{opacity:0.6,fontSize:11,marginBottom:12}}>
                    Posted by: {isMine? "You" : d.postedBy} • {d.postedAt? new Date(d.postedAt).toLocaleDateString() : "Recently"}
                  </div>

                  <div style={{display:"flex",gap:8}}>
                    {!isMine && (
                      <>
                        <button 
                          onClick={()=>handleSaveDeal(d.id)} 
                          disabled={isSaved}
                          style={{
                            padding:"8px 16px",
                            borderRadius:6,
                            background:isSaved?"#333":"#FFD700",
                            color:isSaved?"#666":"#000",
                            border:"none",
                            fontSize:12,
                            fontWeight:900,
                            cursor:isSaved?"not-allowed":"pointer"
                          }}
                        >
                          {isSaved?"✓ Saved to My Work" : "Save to My Work"}
                        </button>
                        <button 
                          onClick={()=>handleMessagePoster(d.postedBy)} 
                          style={{padding:"8px 16px",borderRadius:6,background:"#222",color:"#fff",border:"1px solid #666",fontSize:12}}
                        >
                          Message Poster
                        </button>
                      </>
                    )}
                    {isMine && (
                      <button 
                        onClick={()=>window.location.href="/my-work/deal-room"} 
                        style={{padding:"8px 16px",borderRadius:6,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12}}
                      >
                        Manage in Deal Room
                      </button>
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
