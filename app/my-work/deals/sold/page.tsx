"use client";

import { useEffect, useState } from "react";

export default function SoldDeals() {
  const [soldDeals, setSoldDeals] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date"|"profit">("date");
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const sold = allDeals.filter((d:any) => 
      d.postedBy === currentEmail && d.status === "sold"
    );
    setSoldDeals(sold);
  }, [currentEmail]);

  const filtered = filter === "all"? soldDeals : soldDeals.filter(d => d.state === filter);
  
  const sorted = [...filtered].sort((a,b) => {
    if (sortBy === "date") return (b.soldAt || 0) - (a.soldAt || 0);
    const profitA = parseFloat(a.vaultForgeAnalysis?.profit?.replace(/,/g,'') || "0");
    const profitB = parseFloat(b.vaultForgeAnalysis?.profit?.replace(/,/g,'') || "0");
    return profitB - profitA;
  });

  const totalProfit = soldDeals.reduce((sum, d) => {
    const profit = parseFloat(d.vaultForgeAnalysis?.profit?.replace(/,/g,'') || "0");
    return sum + profit;
  }, 0);

  const avgROI = soldDeals.length > 0? soldDeals.reduce((sum, d) => {
    const roi = parseFloat(d.vaultForgeAnalysis?.roi?.replace('%','') || "0");
    return sum + roi;
  }, 0) / soldDeals.length : 0;

  const thisMonth = soldDeals.filter(d => {
    if (!d.soldAt) return false;
    const soldDate = new Date(d.soldAt);
    const now = new Date();
    return soldDate.getMonth() === now.getMonth() && soldDate.getFullYear() === now.getFullYear();
  });

  const thisMonthProfit = thisMonth.reduce((sum, d) => {
    const profit = parseFloat(d.vaultForgeAnalysis?.profit?.replace(/,/g,'') || "0");
    return sum + profit;
  }, 0);

  function exportCSV() {
    const headers = "Title,State,Property Type,Deal Type,Ask Price,ARV,Profit,ROI,Sold Date\n";
    const rows = sorted.map(d => 
      `"${d.title}",${d.state},${d.propertyType},${d.dealType},${d.askPrice},${d.arv},${d.vaultForgeAnalysis?.profit||"0"},${d.vaultForgeAnalysis?.roi||"0"},${d.soldAt?new Date(d.soldAt).toLocaleDateString():"N/A"}`
    ).join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], {type: "text/csv"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultforge-sold-deals-${Date.now()}.csv`;
    a.click();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ff00",fontWeight:900}}>SOLD DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Closed pipeline. {soldDeals.length} deals completed.</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={exportCSV} style={{padding:"8px 16px",border:"1px solid #00ff00",borderRadius:8,color:"#00ff00",background:"none",fontSize:12}}>Export CSV</button>
            <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          </div>
        </div>

        {/* Revenue Dashboard */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:24}}>
          <div style={{border:"2px solid #00ff00",borderRadius:12,padding:20,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>TOTAL PROFIT</div>
            <div style={{fontSize:36,fontWeight:900,color:"#00ff00"}}>${totalProfit.toLocaleString()}</div>
            <div style={{fontSize:10,opacity:0.7,marginTop:4}}>All time</div>
          </div>
          <div style={{border:"1px solid #00ff00",borderRadius:12,padding:20,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7}}>THIS MONTH</div>
            <div style={{fontSize:36,fontWeight:900,color:"#00ff00"}}>${thisMonthProfit.toLocaleString()}</div>
            <div style={{fontSize:10,opacity:0.7,marginTop:4}}>{thisMonth.length} deals closed</div>
          </div>
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:20,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7}}>AVG ROI</div>
            <div style={{fontSize:36,fontWeight:900,color:"#FFD700"}}>{avgROI.toFixed(1)}%</div>
            <div style={{fontSize:10,opacity:0.7,marginTop:4}}>Per deal</div>
          </div>
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:20,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7}}>DEALS CLOSED</div>
            <div style={{fontSize:36,fontWeight:900,color:"#FFD700"}}>{soldDeals.length}</div>
            <div style={{fontSize:10,opacity:0.7,marginTop:4}}>Total wins</div>
          </div>
        </div>

        {/* Filters + Sort */}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setFilter("all")} style={{padding:"6px 12px",borderRadius:6,background:filter==="all"?"#00ff00":"#222",color:filter==="all"?"#000":"#fff",fontSize:12,border:"none"}}>All States</button>
            {["GA","FL","TN","AL","NC","SC","TX"].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{padding:"6px 12px",borderRadius:6,background:filter===s?"#00ff00":"#222",color:filter===s?"#000":"#fff",fontSize:12,border:"none"}}>{s}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setSortBy("date")} style={{padding:"6px 12px",borderRadius:6,background:sortBy==="date"?"#FFD700":"#222",color:sortBy==="date"?"#000":"#fff",fontSize:12,border:"none"}}>Sort: Date</button>
            <button onClick={()=>setSortBy("profit")} style={{padding:"6px 12px",borderRadius:6,background:sortBy==="profit"?"#FFD700":"#222",color:sortBy==="profit"?"#000":"#fff",fontSize:12,border:"none"}}>Sort: Profit</button>
          </div>
        </div>

        {sorted.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>💰</div>
            <div>No sold deals yet.</div>
            <div style={{fontSize:12,marginTop:8}}>Close your first deal to start tracking revenue.</div>
            <a href="/my-work/deals/under-contract" style={{color:"#00ff00",fontSize:12}}>View pipeline →</a>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {sorted.map((d:any) => (
              <div key={d.id} onClick={()=>window.location.href=`/deal-rooms/view/${d.id}`} style={{border:"1px solid #00ff00",borderRadius:12,padding:20,background:"#0a0f1a",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontWeight:900,fontSize:18}}>{d.title}</div>
                  <div style={{fontSize:11,padding:"4px 12px",borderRadius:999,background:"#00ff00",color:"#000",fontWeight:900}}>SOLD</div>
                </div>
                
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,opacity:0.7}}>Profit</div>
                    <div style={{fontWeight:900,fontSize:20,color:"#00ff00"}}>${d.vaultForgeAnalysis?.profit || "0"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,opacity:0.7}}>ROI</div>
                    <div style={{fontWeight:900,fontSize:20,color:"#FFD700"}}>{d.vaultForgeAnalysis?.roi || "0%"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,opacity:0.7}}>Sold Date</div>
                    <div style={{fontWeight:900,fontSize:14}}>{d.soldAt? new Date(d.soldAt).toLocaleDateString() : "N/A"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,opacity:0.7}}>State</div>
                    <div style={{fontWeight:900,fontSize:14}}>{d.state}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,opacity:0.7}}>Buyer</div>
                    <div style={{fontWeight:900,fontSize:14}}>{d.buyerName || "N/A"}</div>
                  </div>
                </div>

                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{d.propertyType}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>{d.dealType}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>Ask: {d.askPrice}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>ARV: {d.arv}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
