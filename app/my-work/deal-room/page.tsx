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
  const [editingId, setEditingId] = useState<number | null>(null);

  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      loadDraft(parseInt(editId));
    }
  }, []);

  function loadDraft(id: number) {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const draft = deals.find((d:any) => d.id === id);
    if (draft) {
      setEditingId(id);
      setTitle(draft.title);
      setState(draft.state);
      setPropertyType(draft.propertyType);
      setDealType(draft.dealType);
      setAskPrice(draft.askPrice);
      setArv(draft.arv);
      setRepair(draft.repair || "");
      setNotes(draft.notes || "");
    }
  }

  function calculateProfit() {
    const ask = parseFloat(askPrice) || 0;
    const arvNum = parseFloat(arv) || 0;
    const repairNum = parseFloat(repair) || 0;
    const profit = arvNum - ask - repairNum;
    const roi = ask > 0? ((profit / ask) * 100).toFixed(1) : "0";
    return { profit, roi };
  }

  function handleSaveDraft() {
    if (!title ||!askPrice ||!arv) {
      alert("Title, Ask Price, and ARV are required");
      return;
    }

    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const { profit, roi } = calculateProfit();

    if (editingId) {
      const updated = deals.map((d:any) => {
        if (d.id === editingId) {
          return {
        ...d,
            title, state, propertyType, dealType, askPrice, arv, repair, notes,
            vaultForgeAnalysis: { profit, roi },
            updatedAt: Date.now()
          };
        }
        return d;
      });
      localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
      alert("Draft updated");
    } else {
      const newDeal = {
        id: Date.now(),
        title, state, propertyType, dealType, askPrice, arv, repair, notes,
        status: "draft",
        postedBy: currentEmail,
        postedAt: Date.now(),
        updatedAt: Date.now(),
        vaultForgeAnalysis: { profit, roi },
        savedBy: []
      };
      deals.push(newDeal);
      localStorage.setItem("vaultforge_deals", JSON.stringify(deals));
      alert("Draft saved");
      setEditingId(newDeal.id);
    }
  }

  function handlePublish() {
    if (!title ||!askPrice ||!arv) {
      alert("Title, Ask Price, and ARV are required");
      return;
    }

    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const { profit, roi } = calculateProfit();

    if (editingId) {
      const updated = deals.map((d:any) => {
        if (d.id === editingId) {
          return {
        ...d,
            title, state, propertyType, dealType, askPrice, arv, repair, notes,
            status: "active",
            vaultForgeAnalysis: { profit, roi },
            updatedAt: Date.now()
          };
        }
        return d;
      });
      localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    } else {
      const newDeal = {
        id: Date.now(),
        title, state, propertyType, dealType, askPrice, arv, repair, notes,
        status: "active",
        postedBy: currentEmail,
        postedAt: Date.now(),
        updatedAt: Date.now(),
        vaultForgeAnalysis: { profit, roi },
        savedBy: []
      };
      deals.push(newDeal);
      localStorage.setItem("vaultforge_deals", JSON.stringify(deals));
    }

    alert("Deal published! VaultForge AI will route to matching members.");
    window.location.href = "/my-work";
  }

  const { profit, roi } = calculateProfit();

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        {/* LOGO LOCKED AT TOP */}
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>DEAL ROOM</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Create private deals. VaultForge AI matches to buyers.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a"}}>
          <div style={{fontSize:14,fontWeight:900,marginBottom:16,color:"#FFD700"}}>DEAL DETAILS</div>
          
          <div style={{display:"grid",gap:16}}>
            <input 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              placeholder="Deal Title - e.g. '3BR/2BA Fixer in Atlanta'" 
              style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",fontSize:14}} 
            />

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <select value={state} onChange={e=>setState(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["GA","FL","TN","AL","NC","SC","TX"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={propertyType} onChange={e=>setPropertyType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["SFH","Multi-Family","Land","Commercial","Mobile"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <select value={dealType} onChange={e=>setDealType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
              {["wholesale","flip","buy-hold","creative"].map(d=><option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <input 
                type="number" 
                value={askPrice} 
                onChange={e=>setAskPrice(e.target.value)} 
                placeholder="Ask Price" 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
              />
              <input 
                type="number" 
                value={arv} 
                onChange={e=>setArv(e.target.value)} 
                placeholder="ARV" 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
              />
              <input 
                type="number" 
                value={repair} 
                onChange={e=>setRepair(e.target.value)} 
                placeholder="Repair Est" 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
              />
            </div>

            {askPrice && arv && (
              <div style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #00ff00"}}>
                <div style={{fontSize:12,opacity:0.7,marginBottom:4}}>VAULTFORGE ANALYSIS</div>
                <div style={{fontSize:18,fontWeight:900,color:"#00ff00"}}>
                  ${profit.toLocaleString()} PROFIT | {roi}% ROI
                </div>
              </div>
            )}

            <textarea 
              value={notes} 
              onChange={e=>setNotes(e.target.value)} 
              placeholder="Deal notes - property condition, motivation, terms, etc." 
              rows={4} 
              style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
            />

            <div style={{display:"flex",gap:12}}>
              <button 
                onClick={handleSaveDraft} 
                style={{flex:1,padding:14,borderRadius:8,background:"#222",border:"1px solid #FFD700",color:"#FFD700",fontWeight:900}}
              >
                Save Draft
              </button>
              <button 
                onClick={handlePublish} 
                style={{flex:1,padding:14,borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontWeight:900}}
              >
                Publish to VaultForge
              </button>
            </div>
          </div>
        </div>

        <div style={{marginTop:16,padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #FFD700",fontSize:12}}>
          <div style={{fontWeight:900,color:"#FFD700",marginBottom:4}}>HOW IT WORKS</div>
          <div style={{opacity:0.8,lineHeight:1.6}}>
            1. Create deal with full details<br/>
            2. VaultForge AI analyzes profit/ROI<br/>
            3. Publish → AI matches to members with matching buy box<br/>
            4. Members see it in Deal Opportunities<br/>
            5. They save + message you directly
          </div>
        </div>
      </div>
    </main>
  );
}
