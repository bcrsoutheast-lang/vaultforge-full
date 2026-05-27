'use client';
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DealRoom() {
  const [form, setForm] = useState({
    title: "", city: "", state: "GA", address: "", zipcode: "",
    asking_price: "", arv: "", deal_type: "Wholesale", description: "",
    beds: "", baths: "", sqft: "", repair_estimate: ""
  });
  const [loading, setLoading] = useState(false);

  async function submitDeal() {
    if (!form.city || !form.asking_price || !form.description) {
      alert("City, Asking Price, and Description are required");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.from("deals").insert({
      title: form.title || `${form.beds || '?'}bd ${form.baths || '?'}ba ${form.city} - $${Number(form.asking_price).toLocaleString()}`,
      user_email: "dm2107137@gmail.com", // matches your existing rows
      property_type: "Residential",
      city: form.city,
      state: form.state,
      address: form.address,
      zipcode: form.zipcode,
      asking_price: Number(form.asking_price) || 0,
      arv: Number(form.arv) || 0,
      deal_type: form.deal_type,
      description: form.description,
      beds: Number(form.beds) || null,
      baths: Number(form.baths) || null,
      sqft: Number(form.sqft) || null,
      repair_estimate: Number(form.repair_estimate) || null,
      status: 'active',
      ai_score: 0,
      target_buyer: ["Cash Buyer", "Fix & Flip Investor"],
      timeline: "30 Days"
    });
    
    setLoading(false);
    if (error) alert("Error: " + error.message);
    else window.location.href = "/deal-opportunities";
  }

  const I = {width:"100%",padding:"12px",background:"#0a0f1a",border:"2px solid #FFD700",borderRadius:"8px",color:"#fff",fontSize:"15px",marginBottom:"14px"};
  const L = {color:"#FFD700",fontSize:"11px",fontWeight:"700",marginBottom:"4px",display:"block"};

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:"16px"}}>
      <a href="/my-work" style={{color:"#00ccff",fontSize:"14px"}}>← Back to My Work</a>
      <h1 style={{color:"#FFD700",fontWeight:"900",fontSize:"28px",margin:"16px 0 24px"}}>POST DEAL</h1>
      
      <div style={{maxWidth:"700px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <div><label style={L}>CITY *</label><input style={I} value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
        <div><label style={L}>STATE</label><select style={I} value={form.state} onChange={e=>setForm({...form,state:e.target.value})}><option>GA</option><option>FL</option><option>TX</option><option>CA</option></select></div>
        <div><label style={L}>ASKING PRICE *</label><input style={I} type="number" value={form.asking_price} onChange={e=>setForm({...form,asking_price:e.target.value})} /></div>
        <div><label style={L}>ARV</label><input style={I} type="number" value={form.arv} onChange={e=>setForm({...form,arv:e.target.value})} /></div>
        <div><label style={L}>BEDS</label><input style={I} type="number" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})} /></div>
        <div><label style={L}>BATHS</label><input style={I} type="number" value={form.baths} onChange={e=>setForm({...form,baths:e.target.value})} /></div>
        <div><label style={L}>SQFT</label><input style={I} type="number" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})} /></div>
        <div><label style={L}>REPAIR ESTIMATE</label><input style={I} type="number" value={form.repair_estimate} onChange={e=>setForm({...form,repair_estimate:e.target.value})} /></div>
        <div style={{gridColumn:"1 / -1"}}><label style={L}>ADDRESS</label><input style={I} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="123 main" /></div>
        <div style={{gridColumn:"1 / -1"}}><label style={L}>DEAL DESCRIPTION *</label><textarea style={{...I,height:"100px",resize:"none"}} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
        <div style={{gridColumn:"1 / -1"}}>
          <button onClick={submitDeal} disabled={loading} style={{width:"100%",padding:"18px",background:loading?"#333":"#FFD700",color:"#000",fontWeight:"900",fontSize:"18px",borderRadius:"8px",border:"none",cursor:loading?"not-allowed":"pointer",marginTop:"8px"}}>
            {loading ? "POSTING..." : "POST DEAL"}
          </button>
        </div>
      </div>
    </main>
  );
}
