"use client";

import { useEffect, useState } from "react";

export default function UnderContract() {
  const [underContractDeals, setUnderContractDeals] = useState<any[]>([]);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadUnderContractDeals();
  }, [currentEmail]);

  function loadUnderContractDeals() {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const contracts = deals.filter((d:any) => 
      d.status === "under-contract" && 
      (d.assignedTo === currentEmail || d.postedBy === currentEmail)
    ).sort((a:any,b:any) => b.contractDate - a.contractDate);
    setUnderContractDeals(contracts);
  }

  function handleMoveToSold(dealId: number) {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === dealId) {
        return {
      ...d,
          status: "sold",
          soldDate: Date.now()
        };
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert("Deal marked as SOLD 💰");
    loadUnderContractDeals();
  }

  function handleBackToSaved(dealId: number) {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === dealId) {
        return {
      ...d,
          status: "active",
          assignedTo: null,
          contractDate: null
        };
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert("Moved back to Saved");
    loadUnderContractDeals();
  }

  function handleMessagePoster(deal: any) {
    window.location.href = `/my-work/messages?to=${deal.postedBy}`;
  }

  function handleAddNote(dealId: number) {
    const note = prompt("Add a note to this deal:");
    if (!note) return;
    
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (d.id === dealId) {
        const notes = d.contractNotes || [];
        notes.push({
          text: note,
          timestamp: Date.now(),
          by: currentEmail
        });
        return {...d, contractNotes: notes};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    loadUnderContractDeals();
  }

  function getDaysInContract(timestamp: number) {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days;
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ff00",fontWeight:900}}>UNDER CONTRACT</h1>
            <div style={{fontSize:11,opacity:0.7}}>Your active pipeline. {underContractDeals.length} deal{underContractDeals.length!==1?"s":""} in progress</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ff00",color:"#00ff00",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          📝 ACTIVE PIPELINE: Deals you moved from Saved. Track closing, add notes, mark sold when closed.
        </div>

        {underContractDeals.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📝</div>
            <div style={{fontSize:16,fontWeight:900}}>No deals under contract</div>
            <div style={{fontSize:12,marginTop:8}}>Move deals from Saved to Under Contract to track your pipeline</div>
            <button onClick={()=>window.location.href="/my-work/deals/saved"} style={{marginTop:16,padding:"10px 20px",background:"#00ff00",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
              View Saved Deals →
            </button>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {underContractDeals.map((deal:any) => {
              const daysInContract = getDaysInContract(deal.contractDate);
              return (
                <div 
                  key={deal.id} 
                  style={{
                    border:`1px solid ${daysInContract > 30?"#ff4444":"#00ff00"}`,
                    borderRadius:12,
                    padding:16,
                    background:"#0a0f1a"
                  }}
                >
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{fontWeight:900,fontSize:16,color:"#00ff00"}}>{deal.title}</div>
                        {daysInContract > 30 && (
                          <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#ff4444",color:"#fff",fontWeight:900}}>
                            {daysInContract} DAYS
                          </div>
                        )}
                      </div>
                      <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                        {deal.state} • {deal.propertyType} • {deal.dealType} • Under Contract {new Date(deal.contractDate).toLocaleDateString()}
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
                      <div style={{fontSize:10,opacity:0.7,marginBottom:6,fontWeight:900}}>CONTRACT NOTES</div>
                      {deal.contractNotes.map((note:any,idx:number) => (
                        <div key={idx} style={{fontSize:12,marginBottom:4,paddingBottom:4,borderBottom:idx < deal.contractNotes.length-1?"1px solid #1a1f2a":"none"}}>
                          <div style={{opacity:0.8}}>{note.text}</div>
                          <div style={{fontSize:10,opacity:0.5,marginTop:2}}>{new Date(note.timestamp).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button 
                      onClick={()=>handleMoveToSold(deal.id)} 
                      style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,background:"#00ff00",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                    >
                      Mark as SOLD 💰
                    </button>
                    <button 
                      onClick={()=>handleAddNote(deal.id)} 
                      style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#00ff00",border:"1px solid #00ff00",fontSize:12,fontWeight:900}}
                    >
                      Add Note
                    </button>
                    <button 
                      onClick={()=>handleMessagePoster(deal)} 
                      style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontSize:12,fontWeight:900}}
                    >
                      Message
                    </button>
                    <button 
                      onClick={()=>handleBackToSaved(deal.id)} 
                      style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#999",border:"1px solid #666",fontSize:12,fontWeight:900}}
                    >
                      Back to Saved
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
