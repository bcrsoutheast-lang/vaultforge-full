"use client";

import { useEffect, useState } from "react";

export default function SavedDeals() {
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const saved = allDeals.filter((d:any) => d.savedBy?.includes(currentEmail) && d.status === "active");
    setSavedDeals(saved.sort((a:any,b:any) => b.postedAt - a.postedAt));
  }, []);

  function handleMoveToContract(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => d.id === dealId? {...d, status: "under-contract", underContractBy: currentEmail} : d);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    setSavedDeals(savedDeals.filter(d => d.id!== dealId));
    alert("Moved to Under Contract");
  }

  function handleUnsave(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => {
      if (d.id === dealId) {
        return {...d, savedBy: d.savedBy.filter((e:string) => e!== currentEmail)};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    setSavedDeals(savedDeals.filter(d => d.id!== dealId));
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24}}>SAVED DEALS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Deals you saved from Opportunities. Move to Under Contract when locked up.</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          <button onClick={()=>window.location.href="/deal-opportunities"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>Browse More</button>
        </div>

        {savedDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>⭐</div>
            <div style={{fontSize:16,fontWeight:900}}>No saved deals</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {savedDeals.map((deal:any) => (
              <div key={deal.id} style={{border:"1px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a",boxShadow:"0 0 12px #FFD70020"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#FFD700"}}>{deal.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{deal.state} | {deal.propertyType} | {deal.dealType}</div>
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:"#FFD70020",border:"1px solid #FFD700",color:"#FFD700",fontWeight:900}}>SAVED</div>
                </div>
                <div style={{border:"1px solid #00ff00",borderRadius:8,padding:12,background:"#05070d",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:10,opacity:0.7}}>VAULTFORGE ANALYSIS</div>
                  <div style={{fontSize:18,fontWeight:900,color:"#00ff00"}}>${deal.vaultForgeAnalysis.profit.toLocaleString()} PROFIT | {deal.vaultForgeAnalysis.roi}% ROI</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>handleMoveToContract(deal.id)} style={{padding:"10px",borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontSize:12,fontWeight:900}}>MOVE TO CONTRACT</button>
                  <button onClick={()=>handleUnsave(deal.id)} style={{padding:"10px",borderRadius:8,background:"none",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}>UNSAVE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
