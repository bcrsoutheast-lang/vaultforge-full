"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PainIntake() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    state: "",
    propertyType: "Residential", // Default to Residential
    painType: "HVAC",
    urgency: "medium",
    description: "",
    budget: "1k-5k"
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
      // 1. Run AI analysis
      const aiRes = await fetch("/api/vaultforge/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pain",
          data: form
        })
      });
      
      const { analysis } = await aiRes.json();

      // 2. Insert pain into Supabase
      const { data: pain, error } = await supabase
        .from("pains")
        .insert({
          title: form.title,
          state: form.state,
          property_type: form.propertyType,
          pain_type: form.painType,
          urgency: form.urgency,
          description: form.description,
          budget: form.budget,
          status: "active",
          posted_by: currentEmail
        })
        .select()
        .single();

      if (error) throw error;
      
      alert(`Pain posted! Priority: ${analysis.priority}. Routing to contractors now.`);
      window.location.href = "/my-work/jobs/assigned";
      
    } catch (err: any) {
      console.error(err);
      alert("Error posting pain: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: 12,
    background: "#0a0f1a",
    border: "1px solid #00ccff",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <button onClick={()=>window.location.href="/my-work"} style={{background:"none",border:"none",color:"#00ccff",cursor:"pointer"}}>
            ← My Work
          </button>
        </div>

        <h1 style={{color:"#00ccff",fontWeight:900,fontSize:24,marginBottom:8}}>PAIN INTAKE</h1>
        <div style={{fontSize:12,opacity:0.7,marginBottom:24}}>Create private pains. VaultForge AI matches to contractors.</div>

        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>
          <input
            placeholder="Pain Title - e.g. 'AC Not Cooling in Rental Property'"
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
            <select value={form.painType} onChange={e=>setForm({...form,painType:e.target.value})} style={inputStyle}>
              <option value="HVAC">HVAC</option>
              <option value="Roof">Roof</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Foundation">Foundation</option>
              <option value="General">General Contractor</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Paint">Paint</option>
              <option value="Flooring">Flooring</option>
              <option value="Windows">Windows/Doors</option>
              <option value="Demolition">Demolition</option>
              <option value="Concrete">Concrete/Asphalt</option>
            </select>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <select value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})} style={inputStyle}>
              <option value="emergency">Emergency - ASAP</option>
              <option value="high">High - This Week</option>
              <option value="medium">Medium - 2 Weeks</option>
              <option value="low">Low - 30+ Days</option>
            </select>
            <select value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} style={inputStyle}>
              <option value="<1k">Under $1k</option>
              <option value="1k-5k">$1k - $5k</option>
              <option value="5k-15k">$5k - $15k</option>
              <option value="15k+">$15k+</option>
            </select>
          </div>

          <textarea
            placeholder="Detailed description - What's broken? When did it start? Any diagnostics done? Access instructions?"
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
              background: loading ? "#333" : "#00ccff",
              color:"#000",
              border:"none",
              borderRadius:8,
              fontWeight:900,
              fontSize:16,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "ANALYZING WITH AI..." : "Publish to VaultForge"}
          </button>
        </form>
      </div>
    </main>
  );
}
