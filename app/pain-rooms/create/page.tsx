"use client";

import { useState, useEffect } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];
const PROPERTY_TYPES = ["Single Family", "Multi-Family 2-4", "Multi-Family 5+", "Commercial Retail", "Commercial Office", "Industrial", "Land", "Mixed Use"];
const PAIN_TYPES = ["Vacant/Abandoned", "Squatter Occupied", "Code Violation", "Title Cloud", "Lien Issue", "Structural Damage", "Roof Damage", "Foundation Issue", "Plumbing Major", "Electrical Hazard", "Mold/Environmental", "Fire Damage", "Flood Damage", "Board-up Needed", "Trash-out Needed", "Vandalism", "HOA Violation", "Tax Delinquent", "Foreclosure Started", "Probate Issue"];
const URGENCY = ["Critical - 24hr", "High - 72hr", "Medium - 1 Week", "Low - 30 Days"];
const IMPACT = ["Revenue Loss", "Legal Risk", "Safety Hazard", "Deal Killer", "Reputation Risk", "Holding Cost"];
const FREQUENCY = ["First Time", "Recurring Monthly", "Recurring Quarterly", "Chronic - 6mo+"];

export default function CreatePainVaultForge() {
  const [form, setForm] = useState({
    title: "", state: "", propertyType: "", painType: "", urgency: "", impact: "", frequency: "",
    address: "", estimatedCost: "", currentRevenueLoss: "", description: "",
    contractorName: "", contractorPhone: "", inspectorName: "", attorneyName: "",
    photos: [] as string[],
    define: "", measure: "", analyze: "", improve: "", control: ""
  });
  const [profile, setProfile] = useState<any>({});
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("vaultforge_current_email") || "";
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "{}");
    setProfile(profiles[email] || { email });
  }, []);

  function handlePhotoUpload(e: any) {
    const files = Array.from(e.target.files) as File[];
    if (form.photos.length + files.length > 10) {
      alert("Max 10 photos");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm(prev => ({...prev, photos: [...prev.photos, event.target?.result as string]}));
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setForm(prev => ({...prev, photos: prev.photos.filter((_, i) => i!== index)}));
  }

  function runVaultForgeAI() {
    if (!form.painType ||!form.urgency ||!form.impact) {
      alert("Select Pain Type, Urgency, and Impact first");
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      const analysis = {
        rootCause: getRootCause(form.painType, form.frequency),
        nextStep: getNextStep(form.painType, form.urgency),
        costOfInaction: getCostOfInaction(form.urgency, form.impact),
        leanWaste: getLeanWaste(form.painType),
        riskScore: getRiskScore(form.urgency, form.impact),
        dmaic: {
          define: `Property in ${form.state} experiencing ${form.painType}. Business Impact: ${form.impact}. Current State: Problem active.`,
          measure: `Frequency: ${form.frequency}. Est. Repair Cost: ${form.estimatedCost || "TBD"}. Monthly Revenue Loss: ${form.currentRevenueLoss || "TBD"}. Days Active: Calculating...`,
          analyze: `Root cause indicators: ${getRootCause(form.painType, form.frequency)}. Contributing factors: Deferred maintenance + ${form.impact} exposure. Waste identified: ${getLeanWaste(form.painType)}.`,
          improve: `Recommended action: ${getNextStep(form.painType, form.urgency)}. Target Resolution: ${form.urgency.split(" - ")[1]}. Assign: Contractor → Inspector → Legal if needed.`,
          control: `Prevention Plan: Implement quarterly inspection checklist. Monitor ${form.impact} metrics monthly. Set VaultForge alert if ${form.frequency} pattern detected. Document solution for knowledge base.`
        }
      };
      setAiAnalysis(analysis);
      setForm(prev => ({
      ...prev,
        define: analysis.dmaic.define,
        measure: analysis.dmaic.measure,
        analyze: analysis.dmaic.analyze,
        improve: analysis.dmaic.improve,
        control: analysis.dmaic.control
      }));
      setAnalyzing(false);
    }, 1500);
  }

  function getRootCause(painType: string, frequency: string): string {
    const causes: any = {
      "Roof Damage": "Deferred maintenance, age >20yr, storm impact, poor drainage",
      "Squatter Occupied": "Vacant >30 days, no security monitoring, weak access control, neighborhood decline",
      "Code Violation": "Non-permitted work, inspector flagged, neighbor complaint, safety hazard",
      "Title Cloud": "Heir dispute, unreleased lien, recording error, fraud",
      "Foundation Issue": "Soil settlement, water intrusion, tree roots, age/structural fatigue",
      "Mold/Environmental": "Water leak undetected >48hr, poor ventilation, HVAC failure",
      "Fire Damage": "Electrical fault, arson, tenant negligence, no sprinklers"
    };
    const chronic = frequency.includes("Chronic")? " + Systemic failure - process broken" : "";
    return (causes[painType] || "Unknown - requires Gemba walk inspection") + chronic;
  }

  function getNextStep(painType: string, urgency: string): string {
    if (urgency.includes("Critical")) return "EMERGENCY: Dispatch contractor NOW + board-up/secure + notify insurance";
    const steps: any = {
      "Roof Damage": "1) Tarp immediately 2) Get 3 roofing bids 3) File insurance claim 4) Schedule repair",
      "Squatter Occupied": "1) Post 24hr notice 2) File eviction with court 3) Coordinate sheriff 4) Change locks post-eviction",
      "Code Violation": "1) Pull permit 2) Hire licensed contractor 3) Correct violation 4) Schedule re-inspection",
      "Title Cloud": "1) Order full title search 2) Contact real estate attorney 3) Quiet title action or release lien 4) Record correction",
      "Mold/Environmental": "1) Air quality test 2) Containment setup 3) Remediation quote 4) Clearance test",
      "Foundation Issue": "1) Structural engineer report 2) Get 3 foundation bids 3) Pull permits 4) Monitor settlement"
    };
    return steps[painType] || "1) Schedule professional inspection 2) Define scope 3) Get bids";
  }

  function getCostOfInaction(urgency: string, impact: string): string {
    if (urgency.includes("Critical")) return "$500-2,500/day + legal liability + total loss risk";
    if (impact === "Deal Killer") return "$10K-50K lost deal value + holding costs";
    if (impact === "Revenue Loss") return "$800-3,000/mo + property degradation";
    if (impact === "Safety Hazard") return "$5K-100K liability + lawsuit risk";
    return "$200-1,000/mo continued degradation";
  }

  function getLeanWaste(painType: string): string {
    const waste: any = {
      "Vacant/Abandoned": "Defects + Waiting + Motion + Inventory",
      "Squatter Occupied": "Defects + Overprocessing + Waiting + Non-utilized Talent",
      "Code Violation": "Defects + Overprocessing + Waiting",
      "Roof Damage": "Defects + Inventory loss + Motion",
      "Mold/Environmental": "Defects + Waiting + Overprocessing"
    };
    return waste[painType] || "Waste: TBD via Gemba walk";
  }

  function getRiskScore(urgency: string, impact: string): string {
    if (urgency.includes("Critical") && impact === "Safety Hazard") return "10/10 - EXTREME";
    if (urgency.includes("Critical") || impact === "Deal Killer") return "8/10 - HIGH";
    if (urgency.includes("High")) return "6/10 - MEDIUM-HIGH";
    return "4/10 - MEDIUM";
  }

  function handleSubmit() {
    const currentEmail = localStorage.getItem("vaultforge_current_email") || "";
    if (!currentEmail) { alert("Login required"); return; }
    if (!form.title ||!form.state ||!form.painType ||!form.urgency) {
      alert("Title, State, Pain Type, and Urgency required"); return;
    }
    const stored = localStorage.getItem("vaultforge_pains");
    const pains = stored? JSON.parse(stored) : [];
    const newPain = {
      id: Date.now(),...form, postedBy: currentEmail, posterProfile: profile,
      status: "active", timestamp: Date.now(), savedBy: [], archivedBy: [], aiAnalysis: aiAnalysis
    };
    pains.push(newPain);
    localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
    setSaved(true);
    setTimeout(() => {
      window.location.href = `/pain-rooms`;
    }, 1500);
  }

  if (saved) {
    return (
      <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",border:"2px solid #00ff00",borderRadius:16,padding:40,background:"#0a0f1a"}}>
          <div style={{fontSize:48,marginBottom:16}}>✓</div>
          <div style={{fontSize:24,fontWeight:900,color:"#00ff00",marginBottom:8}}>Pain Point Logged</div>
          <div style={{opacity:0.7}}>Posted to /pain-rooms/{form.state}</div>
          <div style={{opacity:0.7,fontSize:12,marginTop:16}}>VaultForge AI analysis attached. Redirecting...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900,fontSize:28}}>VAULTFORGE PAIN INTAKE</h1>
            <div style={{fontSize:12,opacity:0.7}}>Lean Six Sigma DMAIC Process</div>
          </div>
          <button onClick={()=>window.location.href="/pain-rooms"} style={{padding:"8px 16px",border:"1px solid #ff4444",borderRadius:8,color:"#ff4444",background:"none"}}>✕ Escape</button>
        </div>

        <div style={{border:"1px solid #FFD700",borderRadius:12,padding:12,background:"#0a0f1a",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
          {profile.photo? <img src={profile.photo} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover"}} /> : <div style={{width:40,height:40,borderRadius:"50%",background:"#222",display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>}
          <div>
            <div style={{fontWeight:900,fontSize:14}}>{profile.email}</div>
            <div style={{fontSize:11,opacity:0.7}}>Based: {profile.based_state || "N/A"} | Serving: {(profile.states_served || []).join(", ")}</div>
          </div>
        </div>

        <div style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:16}}>
          <div style={{fontWeight:900,marginBottom:16,color:"#FFD700"}}>PROBLEM DEFINITION</div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>Problem Title *</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Roof collapse - Unit 3B - Water intrusion" style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff"}} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>State *</label>
              <select value={form.state} onChange={e=>setForm({...form,state:e.target.value})} style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}}>
                <option value="">Select</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Property *</label>
              <select value={form.propertyType} onChange={e=>setForm({...form,propertyType:e.target.value})} style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}}>
                <option value="">Select</option>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Pain Type *</label>
              <select value={form.painType} onChange={e=>setForm({...form,painType:e.target.value})} style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}}>
                <option value="">Select</option>{PAIN_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Urgency *</label>
              <select value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})} style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}}>
                <option value="">Select</option>{URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Impact *</label>
              <select value={form.impact} onChange={e=>setForm({...form,impact:e.target.value})} style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}}>
                <option value="">Select</option>{IMPACT.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Frequency</label>
              <select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}}>
                <option value="">Select</option>{FREQUENCY.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Est. Repair Cost</label>
              <input value={form.estimatedCost} onChange={e=>setForm({...form,estimatedCost:e.target.value})} placeholder="$5,000" style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}} />
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Monthly Revenue Loss</label>
              <input value={form.currentRevenueLoss} onChange={e=>setForm({...form,currentRevenueLoss:e.target.value})} placeholder="$1,200/mo" style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}} />
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>Address/City</label>
            <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="123 Main St, Atlanta, GA" style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff"}} />
          </div>

          <div style={{fontWeight:900,marginBottom:16,marginTop:24,color:"#FFD700"}}>ASSIGNED TEAM</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Contractor</label>
              <input value={form.contractorName} onChange={e=>setForm({...form,contractorName:e.target.value})} placeholder="ABC Construction" style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}} />
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Inspector</label>
              <input value={form.inspectorName} onChange={e=>setForm({...form,inspectorName:e.target.value})} placeholder="John Doe Inspections" style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}} />
            </div>
            <div><label style={{display:"block",marginBottom:8,fontWeight:900,fontSize:12}}>Attorney</label>
              <input value={form.attorneyName} onChange={e=>setForm({...form,attorneyName:e.target.value})} placeholder="Jane Smith Law" style={{width:"100%",padding:10,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:14}} />
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>Problem Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the issue, timeline, attempts to fix..." rows={3} style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",resize:"none"}} />
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>Photos ({form.photos.length}/10)</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{marginBottom:12,fontSize:12}} />
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:8}}>
              {form.photos.map((photo, idx) => (
                <div key={idx} style={{position:"relative"}}>
                  <img src={photo} style={{width:"100%",height:80,objectFit:"cover",borderRadius:8}} />
                  <button onClick={()=>removePhoto(idx)} style={{position:"absolute",top:4,right:4,width:20,height:20,borderRadius:"50%",background:"#ff4444",color:"#fff",fontSize:12,border:"none"}}>×</button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={runVaultForgeAI} disabled={analyzing} style={{width:"100%",padding:"12px",borderRadius:8,fontWeight:900,background: analyzing? "#333" : "linear-gradient(90deg,#FFD700,#FFA500)",color:"#000",marginBottom:16,border:"none"}}>
            {analyzing? "Analyzing..." : "🧠 RUN VAULTFORGE AI ANALYSIS + DMAIC"}
          </button>
          {aiAnalysis && (
            <div style={{border:"2px solid #FFD700",borderRadius:12,padding:16,background:"#0a0f1a",marginBottom:16}}>
              <div style={{fontWeight:900,marginBottom:12,color:"#FFD700",fontSize:18}}>VAULTFORGE INTELLIGENCE REPORT</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>
                <div style={{fontSize:11}}><strong>Risk Score:</strong> {aiAnalysis.riskScore}</div>
                <div style={{fontSize:11}}><strong>Lean Waste:</strong> {aiAnalysis.leanWaste}</div>
              </div>
              <div style={{fontSize:12,marginBottom:8}}><strong>Root Cause:</strong> {aiAnalysis.rootCause}</div>
              <div style={{fontSize:12,marginBottom:8}}><strong>Cost of Inaction:</strong> {aiAnalysis.costOfInaction}</div>
              <div style={{fontSize:12,marginBottom:12}}><strong>Best Next Step:</strong> {aiAnalysis.nextStep}</div>
              <div style={{fontWeight:900,marginTop:16,marginBottom:8,color:"#FFD700",fontSize:12}}>DMAIC AUTO-FILLED:</div>
              <div style={{fontSize:11,opacity:0.8,marginBottom:4}}><strong>D:</strong> {form.define}</div>
              <div style={{fontSize:11,opacity:0.8,marginBottom:4}}><strong>M:</strong> {form.measure}</div>
              <div style={{fontSize:11,opacity:0.8,marginBottom:4}}><strong>A:</strong> {form.analyze}</div>
              <div style={{fontSize:11,opacity:0.8,marginBottom:4}}><strong>I:</strong> {form.improve}</div>
              <div style={{fontSize:11,opacity:0.8}}><strong>C:</strong> {form.control}</div>
            </div>
          )}
          <button onClick={handleSubmit} style={{width:"100%",padding:"14px 22px",borderRadius:999,fontWeight:900,background:"#FFD700",color:"#000"}}>
            Submit Pain Point to VaultForge
          </button>
        </div>
      </div>
    </main>
  );
}
