"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DealRoom() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    state: "",
    propertyType: "Residential", // Updated default
    dealType: "Wholesale",
    askPrice: "",
    arv: "",
    repair: "",
    description: ""
  });

  const currentEmail = typeof window !== "undefined" ? localStorage.getItem("vaultforge_current_email") || "" : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEmail) {
      alert("Please log in first");
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Run AI analysis first
      const aiRes = await fetch("/api/vaultforge/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deal",
          data: {
            ...form,
            askPrice: Number(form.askPrice),
            arv: Number(form.arv),
            repair: Number(form.repair) || 0
          }
        })
      });
      
      const { analysis } = await aiRes.json();

      // 2. Insert deal into Supabase
      const { data: deal, error } = await supabase
        .from("deals")
        .insert({
          title: form.title,
          state: form.state,
          property_type: form.propertyType,
          deal_type: form.dealType,
          ask_price: Number(form.askPrice),
          arv: Number(form.arv),
          repair: Number(form.repair) || 0,
          description: form.description,
          status: "active",
          posted_by: currentEmail,
          vaultforge_analysis: analysis
        })
        .select()
        .single();

      if (error) throw error;
      
      alert(`Deal posted! AI Score: ${analysis.score}/100. Routing to buyers now.`);
      window.location.href = "/my-work/deals/drafts";
      
    } catch (err: any) {
      console.error(err);
      alert("Error posting deal: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: 12,
    background: "#0a0f1a",
    border: "1px solid #FFD700",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <button onClick={()=>window.location.href="/my-work"} style={{background:"none",border:"none",color:"#FFD700",cursor:"pointer"}}>
            ← Back to My Work
          </button>
        </div>

        <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,marginBottom:8}}>POST DEAL</h1>
        <div style={{fontSize:12,opacity:0.7,marginBottom:24}}>AI will analyze and route to matching buyers instantly</div>

        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>
          <input
            placeholder="Deal Title - 123 Main St, Atlanta GA"
            value={form.title}
            onChange={e=>setForm({...form,title:e.target.value})}
            style={inputStyle}
            required
          />
          
          <select value={form.state} onChange={e=>setForm({...form,state:e.target.value})} style={inputStyle} required>
            <option value="">Select State</option>
            <option value="GA">Georgia</option>
            <option value="FL">Florida</option>
            <option value="TX">Texas</option>
            <option value="NC">North Carolina</option>
            <option value="SC">South Carolina</option>
            <option value="TN">Tennessee</option>
            <option value="AL">Alabama</option>
          </select>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <select value={form.propertyType} onChange={e=>setForm({...form,propertyType:e.target.value})} style={inputStyle}>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Industrial">Industrial</option>
            </select>
            <select value={form.dealType} onChange={e=>setForm({...form,dealType:e.target.value})} style={inputStyle}>
              <option value="Wholesale">Wholesale</option>
              <option value="Flip">Fix & Flip</option>
              <option value="Rental">Buy & Hold</option>
              <option value="Subject-To">Subject-To</option>
              <option value="Owner-Finance">Owner Finance</option>
              <option value="New-Construction">New Construction</option>
            </select>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <input
              type="number"
              placeholder="Ask Price"
              value={form.askPrice}
              onChange={e=>setForm({...form,askPrice:e.target.value})}
              style={inputStyle}
              required
            />
            <input
              type="number"
              placeholder="ARV"
              value={form.arv}
              onChange={e=>setForm({...form,arv:e.target.value})}
              style={inputStyle}
              required
            />
            <input
              type="number"
              placeholder="Repair Est"
              value={form.repair}
              onChange={e=>setForm({...form,repair:e.target.value})}
              style={inputStyle}
            />
          </div>

          <textarea
            placeholder="Deal description, access info, motivation..."
            value={form.description}
            onChange={e=>setForm({...form,description:e.target.value})}
            style={{...inputStyle,minHeight:100}}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding:16,
              background: loading ? "#333" : "#FFD700",
              color:"#000",
              border:"none",
              borderRadius:8,
              fontWeight:900,
              fontSize:16,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "ANALYZING WITH AI..." : "POST DEAL TO VAULTFORGE"}
          </button>
        </form>
      </div>
    </main>
  );
}
