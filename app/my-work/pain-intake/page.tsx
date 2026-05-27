"use client";

import { useState } from "react";
import { publishPainWithRouting } from "@/lib/vaultforge-ai";

export default function PainIntake() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("GA");
  const [propertyType, setPropertyType] = useState("Single Family");
  const [painType, setPainType] = useState("Foundation");
  const [urgency, setUrgency] = useState("medium");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");

  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  function handlePublish() {
    if (!title ||!description) {
      alert("Title and Description are required");
      return;
    }
    const result = publishPainWithRouting({
      title, state, propertyType, painType, urgency, budget, description,
      status: "active",
      postedBy: currentEmail
    });
    alert(`Pain published! VaultForge AI routed to ${result.matchCount} matching contractors.`);
    window.location.href = "/my-work";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #00ccff"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #00ccff)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#00ccff",fontWeight:900,fontSize:24,letterSpacing:1}}>PAIN INTAKE</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Create private pains. AI routes to matching contractors.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{border:"1px solid #00ccff",borderRadius:12,padding:24,background:"#0a0f1a"}}>
          <div style={{display:"grid",gap:16}}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Pain Title - e.g. 'Foundation crack needs repair'" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <select value={state} onChange={e=>setState(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["GA","FL","TN","AL","NC","SC","TX","CA","NY"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={propertyType} onChange={e=>setPropertyType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["Single Family","Multi-Family","Condo","Land","Commercial"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <select value={painType} onChange={e=>setPainType(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                {["Foundation","Roof","HVAC","Plumbing","Electrical","Framing","Drywall","Flooring","Paint","Landscaping","General"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <select value={urgency} onChange={e=>setUrgency(e.target.value)} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Budget range - e.g. '$5k-10k' or 'Open'" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />

            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the pain, scope of work, timeline, materials needed..." rows={6} style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />

            <button onClick={handlePublish} style={{padding:16,borderRadius:8,background:"#00ccff",color:"#000",border:"none",fontWeight:900,fontSize:16}}>
              PUBLISH PAIN + ROUTE WITH AI
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
