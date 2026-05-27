"use client";

import { useState } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];
const TYPES = ["Legal", "Financial", "Partnership", "Operations", "Marketing", "Other"];

export default function CreatePain() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("GA");
  const [type, setType] = useState("Legal");
  const [description, setDescription] = useState("");

  function savePain() {
    if (!title.trim()) return alert("Enter a pain point title");

    const email = localStorage.getItem("vaultforge_current_email") || "unknown";
    const stored = localStorage.getItem("vaultforge_pains");
    const pains = stored? JSON.parse(stored) : [];

    pains.push({
      title,
      state,
      type,
      description,
      postedBy: email,
      createdAt: Date.now()
    });

    localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
    alert("Pain point posted!");
    window.location.href = `/pain-rooms/${state.toLowerCase()}`;
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <h1 style={{color:"#FFD700",fontWeight:900,marginBottom:16}}>POST PAIN POINT</h1>

        <label style={{display:"block",marginBottom:8}}>Issue Title</label>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Ex: Contractor lien dispute on property"
          style={{width:"100%",padding:12,marginBottom:16,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
        />

        <label style={{display:"block",marginBottom:8}}>State</label>
        <select
          value={state}
          onChange={e=>setState(e.target.value)}
          style={{width:"100%",padding:12,marginBottom:16,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
        >
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label style={{display:"block",marginBottom:8}}>Pain Type</label>
        <select
          value={type}
          onChange={e=>setType(e.target.value)}
          style={{width:"100%",padding:12,marginBottom:16,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
        >
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={{display:"block",marginBottom:8}}>Description</label>
        <textarea
          value={description}
          onChange={e=>setDescription(e.target.value)}
          placeholder="Describe the problem, what help you need..."
          rows={4}
          style={{width:"100%",padding:12,marginBottom:24,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
        />

        <button
          onClick={savePain}
          style={{padding:"14px 22px",borderRadius:999,fontWeight:900,background:"#FFD700",color:"#000",width:"100%"}}
        >
          Post Pain Point
        </button>

        <a href="/pain-rooms" style={{display:"block",marginTop:16,textAlign:"center",color:"#FFD700"}}>Cancel</a>
      </div>
    </main>
  );
}
