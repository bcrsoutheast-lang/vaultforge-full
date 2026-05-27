"use client";

import { useEffect, useState } from "react";

export default function DealOpportunities() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filterState, setFilterState] = useState("all");
  const [filterType, setFilterType] = useState("all");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadDeals();
  }, []);

  function loadDeals() {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    // Show active deals not posted by current user
    const publicDeals = allDeals.filter((d:any) => d.status === "active" && d.postedBy!== currentEmail);
    setDeals(publicDeals.sort((a:any,b:any) => b.postedAt - a.postedAt));
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
    alert("Deal saved to My Work");
  }

  function handleMessagePoster(posterEmail: string) {
    window.location.href = `/my-work/messages?to=${posterEmail}`;
  }

  const filteredDeals = deals.filter(d => {
    const stateMatch = filterState === "all" || d.state === filterState;
    const typeMatch = filterType === "all" || d.dealType === filterType;
    return stateMatch && typeMatch;
  });

  const states = ["all",...Array.from(new Set(deals.map(d=>d.state)))];
  const dealTypes = ["all",...Array.from(new Set(deals.map(d=>d.dealType)))];

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>DEAL OPPORTUNITIES</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>AI-matched deals from VaultForge network. Save or DM to lock up.</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={filterState} onChange={e=>setFilterState(e.target.value)} style={{padding:"8px 12px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:12}}>
              {states.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"8px 12px",borderRadius:8,background:"#0a0f1a",border:"1px solid #333",color:"#fff",fontSize:12}}>
              {dealTypes.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔥 {filteredDeals.length} ACTIVE DEALS | AI routes deals to your buy box. Save to move to Under Contract.
        </div>

        {filteredDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🏠</div>
            <div style={{fontSize:16,fontWeight:900}}>No deals match your filters</div>
            <div style={{fontSize:12,marginTop:8}}>Update your buy box in Profile or check back soon</div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(350px,1fr))",gap:16}}>
            {filteredDeals.map((deal:any) => {
              const isSaved = deal.savedBy?.includes(currentEmail);
              return (
                <div 
                  key={deal.id} 
                  style={{
                    border:"1px solid #FFD700",
                    borderRadius:12,
                    padding:20,
                    background:"#0a0f1a",
                    boxShadow:"0 0 12px #FFD70020"
                  }}
                >
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                    <div style={{fontWeight:900,fontSize:18,color:"#FFD700",flex:1}}>{deal.title}</div>
                    <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:"#1a1f2a",border:"1px solid #FFD700",fontWeight:900}}>
                      {deal.state}
                    </div>
                  </div>

                  <div style={{fontSize:11,opacity:0.7,marginBottom:12}}>
                    {deal.propertyType} | {deal.dealType}
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12,textAlign:"center"}}>
                    <div>
                      <div style={{fontSize:10,opacity:0.6}}>ASK</div>
                      <div style={{fontSize:16,fontWeight:900}}>${parseInt(deal.askPrice).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,opacity:0.6}}>ARV</div>
                      <div style={{fontSize:16,fontWeight:900,color:"#00ff00"}}>${parseInt(deal.arv).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,opacity:0.6}}>REPAIR</div>
                      <div style={{fontSize:16,fontWeight:900}}>${parseInt(deal.repair||0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{border:"1px solid #00ff00",borderRadius:8,padding:12,background:"#05070d",marginBottom:12,textAlign:"center"}}>
                    <div style={{fontSize:10,opacity:0.7,marginBottom:2}}>VAULTFORGE ANALYSIS</div>
                    <div style={{fontSize:18,fontWeight:900,color:"#00ff00"}}>
                      ${deal.vaultForgeAnalysis.profit.toLocaleString()} PROFIT | {deal.vaultForgeAnalysis.roi}% ROI
                    </div>
                  </div>

                  {deal.notes && (
                    <div style={{fontSize:12,opacity:0.8,marginBottom:12,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      {deal.notes}
                    </div>
                  )}

                  <div style={{fontSize:10,opacity:0.5,marginBottom:12}}>
                    Posted {new Date(deal.postedAt).toLocaleDateString()}
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button 
                      onClick={()=>handleSaveDeal(deal.id)} 
                      disabled={isSaved}
                      style={{
                        padding:"12px",
                        borderRadius:8,
                        background: isSaved? "#333" : "#FFD700",
                        color: isSaved? "#666" : "#000",
                        border:"none",
                        fontSize:12,
                        fontWeight:900,
                        cursor: isSaved? "not-allowed" : "pointer"
                      }}
                    >
                      {isSaved? "✓ SAVED" : "⭐ SAVE DEAL"}
                    </button>
                    <button 
                      onClick={()=>handleMessagePoster(deal.postedBy)} 
                      style={{padding:"12px",borderRadius:8,background:"none",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                    >
                      💬 DM POSTER
                    </button>
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
