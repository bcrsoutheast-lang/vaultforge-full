"use client";

import { useEffect, useState } from "react";

export default function SoldDeals() {
  const [soldDeals, setSoldDeals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, totalProfit: 0, avgROI: 0 });
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadSoldDeals();
  }, [currentEmail]);

  function loadSoldDeals() {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const sold = deals.filter((d:any) => 
      d.status === "sold" && 
      (d.assignedTo === currentEmail || d.postedBy === currentEmail)
    ).sort((a:any,b:any) => b.soldDate - a.soldDate);
    
    setSoldDeals(sold);
    calculateStats(sold);
  }

  function calculateStats(deals: any[]) {
    const total = deals.length;
    let totalProfit = 0;
    let totalROI = 0;
    let roiCount = 0;
    
    deals.forEach((d:any) => {
      if (d.vaultForgeAnalysis?.profit) {
        totalProfit += d.vaultForgeAnalysis.profit;
      }
      if (d.vaultForgeAnalysis?.roi) {
        totalROI += parseFloat(d.vaultForgeAnalysis.roi);
        roiCount++;
      }
    });
    
    setStats({
      total,
      totalProfit,
      avgROI: roiCount > 0? (totalROI / roiCount).toFixed(1) : 0
    });
  }

  function handleDelete(dealId: number) {
    if (!confirm("Delete this sold deal from your records?")) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.filter((d:any) => d.id!== dealId);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    loadSoldDeals();
  }

  function handleReopen(dealId: number) {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === dealId) {
        return {
     ...d,
          status: "under-contract",
          soldDate: null
        };
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert("Deal reopened to Under Contract");
    loadSoldDeals();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>SOLD DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Closed deals archive. {soldDeals.length} total closed</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {/* Stats Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:24}}>
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>TOTAL CLOSED</div>
            <div style={{fontSize:28,fontWeight:900,color:"#FFD700"}}>{stats.total}</div>
          </div>
          <div style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>TOTAL PROFIT</div>
            <div style={{fontSize:28,fontWeight:900,color:"#00ff00"}}>${stats.totalProfit.toLocaleString()}</div>
          </div>
          <div style={{border:"1px solid #00ccff",borderRadius:12,padding:16,background:"#0a0f1a"}}>
            <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>AVG ROI</div>
            <div style={{fontSize:28,fontWeight:900,color:"#00ccff"}}>{stats.avgROI}%</div>
          </div>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          💰 CLOSED ARCHIVE: Your wins. Track lifetime profit. Use for credibility with members.
        </div>

        {soldDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>💰</div>
            <div style={{fontSize:16,fontWeight:900}}>No sold deals yet</div>
            <div style={{fontSize:12,marginTop:8}}>Close your first deal and mark it SOLD from Under Contract</div>
            <button onClick={()=>window.location.href="/my-work/deals/under-contract"} style={{marginTop:16,padding:"10px 20px",background:"#00ff00",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
              View Under Contract →
            </button>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {soldDeals.map((deal:any) => (
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
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#00ff00",color:"#000",fontWeight:900}}>
                        SOLD
                      </div>
                    </div>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                      {deal.state} • {deal.propertyType} • {deal.dealType} • Closed {new Date(deal.soldDate).toLocaleDateString()}
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

                {deal.contractNotes && deal.contractNotes.length > 0 && (
                  <div style={{marginBottom:12,padding:12,background:"#05070d",borderRadius:6,border:"1px solid #1a1f2a"}}>
                    <div style={{fontSize:10,opacity:0.7,marginBottom:6,fontWeight:900}}>CLOSING NOTES</div>
                    {deal.contractNotes.map((note:any,idx:number) => (
                      <div key={idx} style={{fontSize:12,marginBottom:4,opacity:0.8}}>
                        {note.text}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button 
                    onClick={()=>handleReopen(deal.id)} 
                    style={{padding:"8px 16px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                  >
                    Reopen to Under Contract
                  </button>
                  <button 
                    onClick={()=>handleDelete(deal.id)} 
                    style={{padding:"8px 16px",borderRadius:8,background:"#222",color:"#ff4444",border:"1px solid #ff4444",fontSize:12,fontWeight:900}}
                  >
                    Delete Record
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
