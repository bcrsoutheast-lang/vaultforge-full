"use client";

import { useEffect, useState } from "react";

export default function DealRoom() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("GA");
  const [propertyType, setPropertyType] = useState("SFH");
  const [dealType, setDealType] = useState("wholesale");
  const [askPrice, setAskPrice] = useState("");
  const [arv, setArv] = useState("");
  const [repair, setRepair] = useState("");
  const [notes, setNotes] = useState("");
  const [myDrafts, setMyDrafts] = useState<any[]>([]);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const drafts = deals.filter((d:any) => d.postedBy === currentEmail && d.status === "draft");
    setMyDrafts(drafts);
  }, [currentEmail]);

  function calculateProfit() {
    const ask = parseFloat(askPrice.replace(/,/g,'') || "0");
    const arvNum = parseFloat(arv.replace(/,/g,'') || "0");
    const repairNum = parseFloat(repair.replace(/,/g,'') || "0");
    const profit = arvNum - ask - repairNum;
    const roi = ask > 0? ((profit / ask) * 100).toFixed(1) : "0";
    return { profit: profit.toLocaleString(), roi: roi + "%" };
  }

  function handleSaveDraft() {
    if (!title) return alert("Title required");
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const newDeal = {
      id: Date.now(),
      title, state, propertyType, dealType, askPrice, arv, repair, notes,
      postedBy: currentEmail,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vaultForgeAnalysis: calculateProfit()
    };
    deals.push(newDeal);
    localStorage.setItem("vaultforge_deals", JSON.stringify(deals));
    alert("Draft saved to My Work → Drafts");
    window.location.href = "/my-work/deals/drafts";
  }

  function handlePushToOpportunities() {
    if (!title ||!askPrice ||!arv) return alert("Title, Ask Price, and ARV required to publish");
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const newDeal = {
      id: Date.now(),
      title, state, propertyType, dealType, askPrice, arv, repair, notes,
      postedBy: currentEmail,
      status: "active", // active = published to internal Deal Opportunities
      createdAt: Date.now(),
      postedAt: Date.now(),
      vaultForgeAnalysis: calculateProfit()
    };
    deals.push(newDeal);
    localStorage.setItem("vaultforge_deals", JSON.stringify(deals));
    alert("Deal pushed to Deal Opportunities! Members with matching buy boxes will be alerted.");
    window.location.href = "/deal-opportunities";
  }

  const { profit, roi } = calculateProfit();

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>DEAL ROOM</h1>
            <div style={{fontSize:11,opacity:0.7}}>Private studio. Build deals here. Push to Deal Opportunities when ready.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFD700",color:"#FFD700",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔒 PRIVATE: Deals created here are NOT visible to other members until you "Push to Deal Opportunities"
        </div>

        <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:24}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Create New Deal Project</div>
          
          <div style={{display:"grid",gap:12}}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Deal Title (e.g. 123 Main St Flip)" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <select value={state} onChange={e=>setState(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["GA","FL","TN","AL","NC","SC","TX"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={propertyType} onChange={e=>setPropertyType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["SFH","Multi-Family","Land","Commercial","Mobile"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <select value={dealType} onChange={e=>setDealType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["wholesale","flip","buy-hold","creative","note"].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <input value={askPrice} onChange={e=>setAskPrice(e.target.value)} placeholder="Ask Price" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
              <input value={arv} onChange={e=>setArv(e.target.value)} placeholder="ARV" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
              <input value={repair} onChange={e=>setRepair(e.target.value)} placeholder="Repair Est" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            </div>

            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes, comps, access info, etc..." rows={4} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />

            <div style={{border:"1px solid #00ff00",borderRadius:8,padding:16,background:"#05070d"}}>
              <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>VAULTFORGE ANALYSIS</div>
              <div style={{display:"flex",gap:24}}>
                <div>
                  <div style={{fontSize:10,opacity:0.7}}>Est. Profit</div>
                  <div style={{fontSize:24,fontWeight:900,color:"#00ff00"}}>${profit}</div>
                </div>
                <div>
                  <div style={{fontSize:10,opacity:0.7}}>Est. ROI</div>
                  <div style={{fontSize:24,fontWeight:900,color:"#FFD700"}}>{roi}</div>
                </div>
              </div>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={handleSaveDraft} style={{flex:1,padding:12,borderRadius:8,background:"#222",color:"#fff",border:"1px solid #666",fontWeight:900}}>Save Draft</button>
              <button onClick={handlePushToOpportunities} style={{flex:1,padding:12,borderRadius:8,background:"#00ff00",color:"#000",border:"none",fontWeight:900}}>Push to Deal Opportunities →</button>
            </div>
          </div>
        </div>

        {myDrafts.length > 0 && (
          <div>
            <div style={{fontSize:14,fontWeight:900,marginBottom:12}}>Your Drafts ({myDrafts.length})</div>
            <div style={{display:"grid",gap:8}}>
              {myDrafts.map((d:any) => (
                <div key={d.id} onClick={()=>window.location.href=`/my-work/deals/drafts`} style={{border:"1px solid #666",borderRadius:8,padding:12,background:"#0a0f1a",cursor:"pointer"}}>
                  <div style={{fontWeight:900}}>{d.title}</div>
                  <div style={{fontSize:11,opacity:0.7}}>{d.state} • {d.propertyType} • Ask: {d.askPrice}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
