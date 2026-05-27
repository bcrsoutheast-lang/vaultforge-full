"use client";

import { useEffect, useState } from "react";

export default function SoldDeals() {
  const [soldDeals, setSoldDeals] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const mine = allDeals.filter((d:any) => d.underContractBy === currentEmail && d.status === "sold");
    setSoldDeals(mine.sort((a:any,b:any) => b.soldAt - a.soldAt));
  }, []);

  const totalProfit = soldDeals.reduce((sum, d) => sum + (d.vaultForgeAnalysis?.profit || 0), 0);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24}}>SOLD DEALS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Closed deals. Total profit: ${totalProfit.toLocaleString()}</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-start",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"16px",borderRadius:12,marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:11,opacity:0.7}}>TOTAL PROFIT</div>
          <div style={{fontSize:32,fontWeight:900}}>${totalProfit.toLocaleString()}</div>
          <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{soldDeals.length} DEALS CLOSED</div>
        </div>

        {soldDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>💰</div>
            <div style={{fontSize:16,fontWeight:900}}>No sold deals yet</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {soldDeals.map((deal:any) => (
              <div key={deal.id} style={{border:"1px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#FFD700"}}>{deal.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{deal.state} | {deal.propertyType} | {deal.dealType}</div>
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:"#FFD70020",border:"1px solid #FFD700",color:"#FFD700",fontWeight:900}}>SOLD</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,fontSize:12}}>
                  <div><div style={{opacity:0.6}}>SOLD DATE</div><div style={{fontWeight:900}}>{new Date(deal.soldAt).toLocaleDateString()}</div></div>
                  <div><div style={{opacity:0.6}}>PROFIT</div><div style={{fontWeight:900,color:"#00ff00",fontSize:16}}>${deal.vaultForgeAnalysis.profit.toLocaleString()}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
