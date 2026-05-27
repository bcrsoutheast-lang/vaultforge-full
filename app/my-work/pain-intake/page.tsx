"use client";

import { useEffect, useState } from "react";

export default function PainIntake() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("GA");
  const [propertyType, setPropertyType] = useState("SFH");
  const [painType, setPainType] = useState("HVAC");
  const [urgency, setUrgency] = useState("medium");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
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
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const draft = pains.find((p:any) => p.id === id);
    if (draft) {
      setEditingId(id);
      setTitle(draft.title);
      setState(draft.state);
      setPropertyType(draft.propertyType);
      setPainType(draft.painType);
      setUrgency(draft.urgency);
      setBudget(draft.budget || "");
      setDescription(draft.description || "");
    }
  }

  function handleSaveDraft() {
    if (!title ||!description) {
      alert("Title and Description are required");
      return;
    }

    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");

    if (editingId) {
      const updated = pains.map((p:any) => {
        if (p.id === editingId) {
          return {
        ...p,
            title, state, propertyType, painType, urgency, budget, description,
            updatedAt: Date.now()
          };
        }
        return p;
      });
      localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
      alert("Draft updated");
    } else {
      const newPain = {
        id: Date.now(),
        title, state, propertyType, painType, urgency, budget, description,
        status: "draft",
        postedBy: currentEmail,
        postedAt: Date.now(),
        updatedAt: Date.now(),
        assignedTo: null
      };
      pains.push(newPain);
      localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
      alert("Draft saved");
      setEditingId(newPain.id);
    }
  }

  function handlePublish() {
    if (!title ||!description) {
      alert("Title and Description are required");
      return;
    }

    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");

    if (editingId) {
      const updated = pains.map((p:any) => {
        if (p.id === editingId) {
          return {
        ...p,
            title, state, propertyType, painType, urgency, budget, description,
            status: "active",
            updatedAt: Date.now()
          };
        }
        return p;
      });
      localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    } else {
      const newPain = {
        id: Date.now(),
        title, state, propertyType, painType, urgency, budget, description,
        status: "active",
        postedBy: currentEmail,
        postedAt: Date.now(),
        updatedAt: Date.now(),
        assignedTo: null
      };
      pains.push(newPain);
      localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
    }

    alert("Pain published! VaultForge AI will route to matching contractors.");
    window.location.href = "/my-work";
  }

  function getUrgencyColor(u: string) {
    switch(u) {
      case "emergency": return "#ff0000";
      case "high": return "#ff4444";
      case "medium": return "#FFA500";
      case "low": return "#00ff00";
      default: return "#666";
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        {/* LOGO LOCKED AT TOP */}
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ccff"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #00ccff)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#00ccff",fontWeight:900,fontSize:24,letterSpacing:1}}>PAIN INTAKE</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Create private pains. VaultForge AI matches to contractors.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{border:"1px solid #00ccff",borderRadius:12,padding:24,background:"#0a0f1a"}}>
          <div style={{fontSize:14,fontWeight:900,marginBottom:16,color:"#00ccff"}}>PAIN DETAILS</div>
          
          <div style={{display:"grid",gap:16}}>
            <input 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              placeholder="Pain Title - e.g. 'AC Not Cooling in Rental Property'" 
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

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <select value={painType} onChange={e=>setPainType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["HVAC","Plumbing","Electrical","Roof","Foundation","Pest","Cosmetic","Other"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <select value={urgency} onChange={e=>setUrgency(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:`1px solid ${getUrgencyColor(urgency)}`,color:"#fff"}}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="emergency">EMERGENCY</option>
              </select>
            </div>

            <input 
              type="number" 
              value={budget} 
              onChange={e=>setBudget(e.target.value)} 
              placeholder="Budget (optional) - e.g. 5000" 
              style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
            />

            <textarea 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              placeholder="Detailed description - What's broken? When did it start? Any diagnostics done? Access instructions?" 
              rows={5} 
              style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
            />

            {urgency === "emergency" && (
              <div style={{padding:12,borderRadius:8,background:"#1a0000",border:"1px solid #ff0000"}}>
                <div style={{fontSize:12,fontWeight:900,color:"#ff0000",marginBottom:4}}>⚠️ EMERGENCY PRIORITY</div>
                <div style={{fontSize:11,opacity:0.8}}>This will be flagged urgent and routed to contractors immediately. Use only for true emergencies.</div>
              </div>
            )}

            <div style={{display:"flex",gap:12}}>
              <button 
                onClick={handleSaveDraft} 
                style={{flex:1,padding:14,borderRadius:8,background:"#222",border:"1px solid #00ccff",color:"#00ccff",fontWeight:900}}
              >
                Save Draft
              </button>
              <button 
                onClick={handlePublish} 
                style={{flex:1,padding:14,borderRadius:8,background:"#00ccff",color:"#000",border:"none",fontWeight:900}}
              >
                Publish to VaultForge
              </button>
            </div>
          </div>
        </div>

        <div style={{marginTop:16,padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #00ccff",fontSize:12}}>
          <div style={{fontWeight:900,color:"#00ccff",marginBottom:4}}>HOW IT WORKS</div>
          <div style={{opacity:0.8,lineHeight:1.6}}>
            1. Create pain with full details<br/>
            2. Set urgency level<br/>
            3. Publish → AI matches to contractors with DMAIC skills<br/>
            4. Contractors see it in Pain Room<br/>
            5. They claim + message you directly
          </div>
        </div>
      </div>
    </main>
  );
}
