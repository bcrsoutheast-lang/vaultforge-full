"use client";
import { useState } from "react";

export default function DealRoom() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("GA");
  const [propertyType, setPropertyType] = useState("Residential");
  const [askingPrice, setAskingPrice] = useState("");
  const [arv, setArv] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitDeal() {
    setLoading(true);
    const email = localStorage.getItem("vaultforge_current_email");
    const res = await fetch("/api/route-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_type: "deal",
        city, state, property_type: propertyType,
        asking_price: Number(askingPrice), arv: Number(arv),
        description, user_email: email
      })
    });
    if (res.ok) window.location.href = "/deal-opportunities";
    else alert("Failed to save");
    setLoading(false);
  }

  const input = {width:"100%",padding:14,background:"#0a0f1a",border:"2px solid #FFD700",borderRadius:8,color:"#fff",fontSize:16,marginBottom:12};

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <a href="/my-work" style={{color:"#00ccff"}}>← My Work</a>
      <h1 style={{color:"#FFD700",fontWeight:900,fontSize:32,margin:"16px 0"}}>POST DEAL</h1>
      <div style={{maxWidth:600}}>
        <input style={input} value={city} onChange={e=>setCity(e.target.value)} placeholder="City" />
        <input style={input} value={state} onChange={e=>setState(e.target.value)} placeholder="State" />
        <select style={input} value={propertyType} onChange={e=>setPropertyType(e.target.value)}>
          <option>Residential</option><option>Commercial</option><option>Land</option>
        </select>
        <input style={input} type="number" value={askingPrice} onChange={e=>setAskingPrice(e.target.value)} placeholder="Asking Price" />
        <input style={input} type="number" value={arv} onChange={e=>setArv(e.target.value)} placeholder="ARV" />
        <textarea style={{...input,height:100}} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Deal details..." />
        <button onClick={submitDeal} disabled={loading} style={{width:"100%",padding:16,background:loading?"#333":"#FFD700",color:"#000",fontWeight:900,fontSize:18,borderRadius:8,border:"none",cursor:"pointer"}}>
          {loading ? "SAVING..." : "SUBMIT DEAL"}
        </button>
      </div>
    </main>
  );
}
