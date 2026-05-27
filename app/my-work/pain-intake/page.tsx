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
  const [address, setAddress] = useState("");
  const [myDrafts, setMyDrafts] = useState<any[]>([]);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const drafts = pains.filter((p:any) => p.postedBy === currentEmail && p.status === "draft");
    setMyDrafts(drafts);
  }, [currentEmail]);

  function handleSaveDraft() {
    if (!title) return alert("Title required");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const newPain = {
      id: Date.now(),
      title, state, propertyType, painType, urgency, budget, description, address,
      postedBy: currentEmail,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    pains.push(newPain);
    localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
    alert("Draft saved to My Work → Drafts");
    window.location.reload();
  }

  function handlePushToPainRoom() {
    if (!title ||!painType ||!description) return alert("Title, Pain Type, and Description required to publish");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const newPain = {
      id: Date.now(),
      title, state, propertyType, painType, urgency, budget, description, address,
      postedBy: currentEmail,
      status: "active", // active = published to internal Pain Room
      createdAt: Date.now(),
      postedAt: Date.now()
    };
    pains.push(newPain);
    localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
    alert("Pain pushed to Pain Room! Contractors with matching skills will be alerted.");
    window.location.href = "/pain-room";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#00ccff",fontWeight:900}}>PAIN INTAKE</h1>
            <div style={{fontSize:11,opacity:0.7}}>Private studio. Document property issues here. Push to Pain Room when ready.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ccff",color:"#00ccff",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔒 PRIVATE: Pains created here are NOT visible to contractors until you "Push to Pain Room"
        </div>

        <div style={{border:"1px solid #00ccff",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:24}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Create New Pain Project</div>
          
          <div style={{display:"grid",gap:12}}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Pain Title (e.g. HVAC Out - 123 Main St)" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <select value={state} onChange={e=>setState(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["GA","FL","TN","AL","NC","SC","TX"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={propertyType} onChange={e=>setPropertyType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["SFH","Multi-Family","Land","Commercial","Mobile"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <select value={painType} onChange={e=>setPainType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["HVAC","Plumbing","Electrical","Roof","Foundation","Pest","Cosmetic","Other"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <select value={urgency} onChange={e=>setUrgency(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["low","medium","high","emergency"].map(u=><option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
              <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Budget (optional)" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            </div>

            <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Property Address (optional, kept private)" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />

            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the issue, timeline, access instructions, etc..." rows={4} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />

            <div style={{border:"1px solid #00ccff",borderRadius:8,padding:16,background:"#05070d"}}>
              <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>DMAIC MATCHING</div>
              <div style={{fontSize:12,opacity:0.9}}>
                When pushed to Pain Room, VaultForge AI matches this to contractors based on: 
                <span style={{color:"#00ccff",fontWeight:900}}> {painType} skills</span> + 
                <span style={{color:"#00ccff",fontWeight:900}}> {state} location</span> + 
                <span style={{color:"#00ccff",fontWeight:900}}> {urgency} urgency</span>
              </div>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={handleSaveDraft} style={{flex:1,padding:12,borderRadius:8,background:"#222",color:"#fff",border:"1px solid #666",fontWeight:900}}>Save Draft</button>
              <button onClick={handlePushToPainRoom} style={{flex:1,padding:12,borderRadius:8,background:"#00ccff",color:"#000",border:"none",fontWeight:900}}>Push to Pain Room →</button>
            </div>
          </div>
        </div>

        {myDrafts.length > 0 && (
          <div>
            <div style={{fontSize:14,fontWeight:900,marginBottom:12}}>Your Drafts ({myDrafts.length})</div>
            <div style={{display:"grid",gap:8}}>
              {myDrafts.map((p:any) => (
                <div key={p.id} onClick={()=>window.location.href=`/my-work/pains/drafts`} style={{border:"1px solid #666",borderRadius:8,padding:12,background:"#0a0f1a",cursor:"pointer"}}>
                  <div style={{fontWeight:900}}>{p.title}</div>
                  <div style={{fontSize:11,opacity:0.7}}>{p.state} • {p.painType} • {p.urgency.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
