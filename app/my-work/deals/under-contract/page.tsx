"use client";

import { useEffect, useState } from "react";

export default function UnderContractDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [notes, setNotes] = useState<{[key:number]:string}>({});
  const [followUps, setFollowUps] = useState<{[key:number]:string}>({});
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const underContract = allDeals.filter((d:any) => 
      d.postedBy === currentEmail && d.status === "under_contract"
    );
    setDeals(underContract);
    
    const savedNotes = localStorage.getItem("vaultforge_deal_notes");
    setNotes(savedNotes? JSON.parse(savedNotes) : {});
    
    const savedFollowUps = localStorage.getItem("vaultforge_deal_followups");
    setFollowUps(savedFollowUps? JSON.parse(savedFollowUps) : {});
  }, [currentEmail]);

  function saveNote(id: number, note: string) {
    const newNotes = {...notes, [id]: note};
    setNotes(newNotes);
    localStorage.setItem("vaultforge_deal_notes", JSON.stringify(newNotes));
  }

  function saveFollowUp(id: number, date: string) {
    const newFollowUps = {...followUps, [id]: date};
    setFollowUps(newFollowUps);
    localStorage.setItem("vaultforge_deal_followups", JSON.stringify(newFollowUps));
  }

  function handleMarkSold(id: number) {
    if (!confirm("Mark this deal as SOLD? This moves it to Sold pipeline.")) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === id) return {...d, status: "sold", soldAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handleFallThrough(id: number) {
    if (!confirm("Mark as fell through? This moves deal back to active.")) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === id) return {...d, status: "active", statusUpdatedAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  const totalProfit = deals.reduce((sum, d) => {
    const profit = d.vaultForgeAnalysis?.profit? parseFloat(d.vaultForgeAnalysis.profit.replace(/,/g,'')) : 0;
    return sum + profit;
  }, 0);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ff00",fontWeight:900}}>UNDER CONTRACT</h1>
            <div style={{fontSize:11,opacity:0.7}}>Private pipeline. {deals.length} deals closing soon.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {/* Pipeline Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:24}}>
          <div style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7}}>DEALS IN CONTRACT</div>
            <div style={{fontSize:32,fontWeight:900,color:"#00ff00"}}>{deals.length}</div>
          </div>
          <div style={{border:"1px solid #00ff00",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7}}>POTENTIAL PROFIT</div>
            <div style={{fontSize:32,fontWeight:900,color:"#00ff00"}}>${totalProfit.toLocaleString()}</div>
          </div>
          <div style={{border:"1px solid #FFA500",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"center"}}>
            <div style={{fontSize:10,opacity:0.7}}>NEED FOLLOW-UP</div>
            <div style={{fontSize:32,fontWeight:900,color:"#FFA500"}}>{Object.keys(followUps).filter(k => followUps[parseInt(k)] && new Date(followUps[parseInt(k)]) < new Date()).length}</div>
          </div>
        </div>

        {deals.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📋</div>
            <div>No deals under contract yet.</div>
            <a href="/deal-rooms/create" style={{color:"#FFD700",fontSize:12}}>Post a deal →</a>
          </div>
        ) : (
          <div style={{display:"grid",gap:16}}>
            {deals.map((d:any) => {
              const isOverdue = followUps[d.id] && new Date(followUps[d.id]) < new Date();
              return (
                <div key={d.id} style={{border:`1px solid ${isOverdue?"#ff4444":"#00ff00"}`,borderRadius:12,padding:20,background:"#0a0f1a"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <div style={{fontWeight:900,fontSize:20}}>{d.title}</div>
                    <div style={{fontSize:11,padding:"4px 12px",borderRadius:999,background:"#00ff00",color:"#000",fontWeight:900}}>UNDER CONTRACT</div>
                  </div>
                  
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16,fontSize:12}}>
                    <div><strong>Ask:</strong> {d.askPrice}</div>
                    <div><strong>ARV:</strong> {d.arv}</div>
                    <div><strong>Profit:</strong> <span style={{color:"#00ff00"}}>${d.vaultForgeAnalysis?.profit || "TBD"}</span></div>
                    <div><strong>Buyer:</strong> {d.buyerName || "TBD"}</div>
                    <div><strong>Lender:</strong> {d.lenderName || "TBD"}</div>
                    <div><strong>Close Date:</strong> {followUps[d.id] || "Set date"}</div>
                  </div>

                  {isOverdue && (
                    <div style={{background:"#ff4444",color:"#fff",padding:"8px 12px",borderRadius:6,marginBottom:12,fontSize:12,fontWeight:900}}>
                      ⚠️ FOLLOW-UP OVERDUE - {followUps[d.id]}
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div>
                      <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>FOLLOW-UP DATE</div>
                      <input 
                        type="date"
                        value={followUps[d.id] || ""}
                        onChange={e=>saveFollowUp(d.id, e.target.value)}
                        style={{width:"100%",padding:8,borderRadius:6,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:12}}
                      />
                    </div>
                    <div>
                      <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>PRIVATE NOTES</div>
                      <input 
                        value={notes[d.id] || ""}
                        onChange={e=>saveNote(d.id, e.target.value)}
                        placeholder="Inspection scheduled, waiting on appraisal..."
                        style={{width:"100%",padding:8,borderRadius:6,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:12}}
                      />
                    </div>
                  </div>

                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button onClick={()=>window.location.href=`/deal-rooms/view/${d.id}`} style={{padding:"8px 16px",borderRadius:6,background:"#222",color:"#FFD700",fontSize:12,border:"1px solid #FFD700"}}>View Details</button>
                    <button onClick={()=>handleMarkSold(d.id)} style={{padding:"8px 16px",borderRadius:6,background:"#00ff00",color:"#000",fontSize:12,fontWeight:900,border:"none"}}>Mark Sold</button>
                    <button onClick={()=>handleFallThrough(d.id)} style={{padding:"8px 16px",borderRadius:6,background:"#ff4444",color:"#fff",fontSize:12,border:"none"}}>Fell Through</button>
                    {d.buyerPhone && <a href={`tel:${d.buyerPhone}`} style={{padding:"8px 16px",borderRadius:6,background:"#222",color:"#fff",fontSize:12,textDecoration:"none"}}>Call Buyer</a>}
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
