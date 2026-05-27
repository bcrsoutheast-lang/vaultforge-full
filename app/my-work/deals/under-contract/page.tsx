"use client";

import { useEffect, useState } from "react";

export default function UnderContract() {
  const [contracts, setContracts] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const mine = allDeals.filter((d:any) => d.underContractBy === currentEmail && d.status === "under-contract");
    setContracts(mine.sort((a:any,b:any) => b.postedAt - a.postedAt));
  }, []);

  function handleMarkSold(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => d.id === dealId? {...d, status: "sold", soldAt: Date.now()} : d);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    setContracts(contracts.filter(d => d.id!== dealId));
    alert("Marked as Sold");
  }

  function handleCancelContract(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => d.id === dealId? {...d, status: "active", underContractBy: null} : d);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    setContracts(contracts.filter(d => d.id!== dealId));
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ff00"}}>
          <h1 style={{color:"#00ff00",fontWeight:900,fontSize:24}}>UNDER CONTRACT</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Deals you locked up. Close them to move to Sold.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-start",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {contracts.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📋</div>
            <div style={{fontSize:16,fontWeight:900}}>No deals under contract</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {contracts.map((deal:any) => (
              <div key={deal.id} style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a",boxShadow:"0 0 12px #00ff0020"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#00ff00"}}>{deal.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{deal.state} | {deal.propertyType} | {deal.dealType}</div>
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:"#00ff0020",border:"1px solid #00ff00",color:"#00ff00",fontWeight:900}}>CONTRACT</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12,fontSize:12}}>
                  <div><div style={{opacity:0.6}}>ASK</div><div style={{fontWeight:900}}>${parseInt(deal.askPrice).toLocaleString()}</div></div>
                  <div><div style={{opacity:0.6}}>ARV</div><div style={{fontWeight:900,color:"#00ff00"}}>${parseInt(deal.arv).toLocaleString()}</div></div>
                  <div><div style={{opacity:0.6}}>PROFIT</div><div style={{fontWeight:900,color:"#00ff00"}}>${deal.vaultForgeAnalysis.profit.toLocaleString()}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>handleMarkSold(deal.id)} style={{padding:"10px",borderRadius:8,background:"#00ff00",color:"#000",border:"none",fontSize:12,fontWeight:900}}>MARK SOLD</button>
                  <button onClick={()=>handleCancelContract(deal.id)} style={{padding:"10px",borderRadius:8,background:"none",color:"#ff0000",border:"1px solid #ff0000",fontSize:12,fontWeight:900}}>CANCEL</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
