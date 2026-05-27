  "use client";
import { useState } from "react";

export default function PainIntake() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("GA");
  const [painType, setPainType] = useState("HVAC");
  const [urgency, setUrgency] = useState("Medium - 2 Weeks");
  const [budget, setBudget] = useState("$1k - $5k");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPain() {
    setLoading(true);
    const email = localStorage.getItem("vaultforge_current_email");
    const res = await fetch("/api/route-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_type: "job",
        city, state, pain_type: painType,
        property_type: "Residential", urgency,
        budget_range: budget, description, user_email: email
      })
    });
    if (res.ok) window.location.href = "/pain-room";
    else alert("Failed to save");
    setLoading(false);
  }

  const input = {width:"100%",padding:14,background:"#0a0f1a",border:"2px solid #00ccff",borderRadius:8,color:"#fff",fontSize:16,marginBottom:12};

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <a href="/my-work" style={{color:"#00ccff"}}>← My Work</a>
      <h1 style={{color:"#00ccff",fontWeight:900,fontSize:32,margin:"16px 0"}}>POST PAIN</h1>
      <div style={{maxWidth:600}}>
        <input style={input} value={city} onChange={e=>setCity(e.target.value)} placeholder="City" />
        <input style={input} value={state} onChange={e=>setState(e.target.value)} placeholder="State" />
        <select style={input} value={painType} onChange={e=>setPainType(e.target.value)}>
          <option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>Roofing</option>
        </select>
        <select style={input} value={urgency} onChange={e=>setUrgency(e.target.value)}>
          <option>Emergency - 24 Hours</option><option>Urgent - 3 Days</option><option>Medium - 2 Weeks</option>
        </select>
        <select style={input} value={budget} onChange={e=>setBudget(e.target.value)}>
          <option>Under $1k</option><option>$1k - $5k</option><option>$5k - $15k</option><option>$15k+</option>
        </select>
        <textarea style={{...input,height:100}} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the problem..." />
        <button onClick={submitPain} disabled={loading} style={{width:"100%",padding:16,background:loading?"#333":"#00ccff",color:"#000",fontWeight:900,fontSize:18,borderRadius:8,border:"none",cursor:"pointer"}}>
          {loading ? "SAVING..." : "SUBMIT PAIN"}
        </button>
      </div>
    </main>
  );
}
