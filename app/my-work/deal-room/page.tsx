"use client";

import { useState } from "react";
import { publishDealWithRouting } from "@/lib/vaultforge-ai";

export default function DealRoom() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("GA");
  const [propertyType, setPropertyType] = useState("Single Family");
  const [dealType, setDealType] = useState("Fix & Flip");
  const [askPrice, setAskPrice] = useState("");
  const [arv, setArv] = useState("");
  const [repair, setRepair] = useState("");
  const [notes, setNotes] = useState("");

  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  function calculateProfit() {
    const ask = parseFloat(askPrice) || 0;
    const arvNum = parseFloat(arv) || 0;
    const repairNum = parseFloat(repair) || 0;
    const profit = arvNum - ask - repairNum - (arvNum * 0.1); // 10% costs
    const roi = ask > 0? ((profit / ask) * 100).toFixed(1) : "0";
    return { profit, roi };
  }

  function handlePublish() {
    if (!title ||!askPrice ||!arv) {
      alert("Title, Ask Price, and ARV are required");
      return;
    }
    const { profit, roi } = calculateProfit();
    const result = publishDealWithRouting({
      title, state, propertyType, dealType, askPrice, arv, repair, notes,
      status: "active",
      postedBy: currentEmail,
      vaultForgeAnalysis: { profit, roi }
    });
    alert(`Deal published! VaultForge AI routed to ${result.matchCount} matching members.`);
    window.location.href = "/my-work";
  }

  const { profit, roi } = calculateProfit();

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>DEAL ROOM</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Create private deals. AI routes to matching members.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a"}}>
          <div style={{display:"grid",gap:16}}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Deal Title" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <select value={state} onChange={e=>setState(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["GA","FL","TN","AL","NC","SC","TX","CA","NY"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={propertyType} onChange={e=>setPropertyType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["Single Family","Multi-Family","Condo","Land","Commercial"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <select value={dealType} onChange={e=>setDealType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
              {["Fix & Flip","Buy & Hold","Wholesale","Creative Finance"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <input value={askPrice} onChange={e=>setAskPrice(e.target.value)} placeholder="Ask Price" type="number" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
              <input value={arv} onChange={e=>setArv(e.target.value)} placeholder="ARV" type="number" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
              <input value={repair} onChange={e=>setRepair(e.target.value)} placeholder="Repair Cost" type="number" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            </div>

            <div style={{border:"1px solid #00ff00",borderRadius:8,padding:12,background:"#05070d",textAlign:"center"}}>
              <div style={{fontSize:11,opacity:0.7}}>VAULTFORGE ANALYSIS</div>
              <div style={{fontSize:20,fontWeight:900,color:"#00ff00"}}>${profit.toLocaleString()} PROFIT | {roi}% ROI</div>
            </div>

            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Deal notes, strategy, terms..." rows={4} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />

            <button onClick={handlePublish} style={{padding:16,borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontWeight:900,fontSize:16}}>
              PUBLISH DEAL + ROUTE WITH AI
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
