 "use client";

import { useState } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Land"];
const PAIN_CATEGORIES = ["Legal", "Financial", "Partnership", "Operations", "Contractor", "Tenant", "Other"];

export default function CreatePain() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("GA");
  const [propertyType, setPropertyType] = useState("Residential");
  const [painCategory, setPainCategory] = useState("Legal");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("Medium");

  // Residential fields
  const [address, setAddress] = useState("");
  const [issueDate, setIssueDate] = useState("");
  
  // Commercial fields
  const [businessName, setBusinessName] = useState("");
  const [leaseType, setLeaseType] = useState("");
  
  // Land fields
  const [acreage, setAcreage] = useState("");
  const [zoningIssue, setZoningIssue] = useState("");

  function savePain() {
    if (!title.trim()) return alert("Enter a pain point title");

    const email = localStorage.getItem("vaultforge_current_email") || "unknown";
    const stored = localStorage.getItem("vaultforge_pains");
    const pains = stored? JSON.parse(stored) : [];

    const painData: any = {
      id: Date.now(),
      title,
      state,
      propertyType,
      painCategory,
      description,
      urgency,
      postedBy: email,
      createdAt: Date.now(),
      status: "active"
    };

    // Add type-specific fields
    if (propertyType === "Residential") {
      painData.residential = { address, issueDate };
    } else if (propertyType === "Commercial") {
      painData.commercial = { businessName, leaseType };
    } else if (propertyType === "Land") {
      painData.land = { acreage, zoningIssue };
    }

    pains.push(painData);
    localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
    alert("Pain point posted!");
    window.location.href = `/pain-rooms/${state.toLowerCase()}`;
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <h1 style={{color:"#FFD700",fontWeight:900,marginBottom:16}}>POST PAIN POINT</h1>

        {/* Basic Info */}
        <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:16}}>
          <h3 style={{fontWeight:900,marginBottom:12}}>Basic Info</h3>
          
          <label style={{display:"block",marginBottom:8}}>Issue Title</label>
          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Ex: Contractor lien dispute on property"
            style={{width:"100%",padding:12,marginBottom:16,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
          />

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div>
              <label style={{display:"block",marginBottom:8}}>State</label>
              <select
                value={state}
                onChange={e=>setState(e.target.value)}
                style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
              >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",marginBottom:8}}>Property Type</label>
              <select
                value={propertyType}
                onChange={e=>setPropertyType(e.target.value)}
                style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
              >
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:"block",marginBottom:8}}>Pain Category</label>
              <select
                value={painCategory}
                onChange={e=>setPainCategory(e.target.value)}
                style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
              >
                {PAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",marginBottom:8}}>Urgency</label>
              <select
                value={urgency}
                onChange={e=>setUrgency(e.target.value)}
                style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Fields by Property Type */}
        {propertyType === "Residential" && (
          <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:16}}>
            <h3 style={{fontWeight:900,marginBottom:12}}>Residential Details</h3>
            <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Property Address" style={{width:"100%",padding:12,marginBottom:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}} />
            <input value={issueDate} onChange={e=>setIssueDate(e.target.value)} placeholder="Issue Start Date" style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}} />
          </div>
        )}

        {propertyType === "Commercial" && (
          <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:16}}>
            <h3 style={{fontWeight:900,marginBottom:12}}>Commercial Details</h3>
            <input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Business/Property Name" style={{width:"100%",padding:12,marginBottom:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}} />
            <input value={leaseType} onChange={e=>setLeaseType(e.target.value)} placeholder="Lease Type / Issue" style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}} />
          </div>
        )}

        {propertyType === "Land" && (
          <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:16}}>
            <h3 style={{fontWeight:900,marginBottom:12}}>Land Details</h3>
            <input value={acreage} onChange={e=>setAcreage(e.target.value)} placeholder="Acreage" style={{width:"100%",padding:12,marginBottom:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}} />
            <input value={zoningIssue} onChange={e=>setZoningIssue(e.target.value)} placeholder="Zoning / Land Use Issue" style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}} />
          </div>
        )}

        {/* Description */}
        <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:24}}>
          <h3 style={{fontWeight:900,marginBottom:12}}>Description</h3>
          <textarea
            value={description}
            onChange={e=>setDescription(e.target.value)}
            placeholder="Describe the problem, what help you need, what's at stake..."
            rows={4}
            style={{width:"100%",padding:12,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
          />
        </div>

        <button
          onClick={savePain}
          style={{padding:"14px 22px",borderRadius:999,fontWeight:900,background:"#FFD700",color:"#000",width:"100%",marginBottom:12}}
        >
          Post Pain Point
        </button>

        <a href="/pain-rooms" style={{display:"block",textAlign:"center",color:"#FFD700"}}>Cancel</a>
      </div>
    </main>
  );
}
