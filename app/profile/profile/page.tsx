"use client";

import { useEffect, useState } from "react";

const ALL_STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];

export default function Profile() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Dmoney");
  const [basedState, setBasedState] = useState("GA");
  const [statesServed, setStatesServed] = useState<string[]>(["GA"]);

  useEffect(() => {
    const currentEmail = localStorage.getItem("vaultforge_current_email") || "";
    setEmail(currentEmail);

    // Load existing member data
    const stored = localStorage.getItem("vaultforge_members");
    const members = stored? JSON.parse(stored) : [];
    const me = members.find((m:any) => m.email === currentEmail);
    if (me) {
      setName(me.name || "Dmoney");
      setBasedState(me.based_state || "GA");
      setStatesServed(me.states_served || ["GA"]);
    }
  }, []);

  function toggleState(state: string) {
    setStatesServed(prev =>
      prev.includes(state)? prev.filter(s => s!== state) : [...prev, state]
    );
  }

  function saveProfile() {
    const stored = localStorage.getItem("vaultforge_members");
    let members = stored? JSON.parse(stored) : [];

    // Update or add this user
    const existingIndex = members.findIndex((m:any) => m.email === email);
    const updatedUser = {
      email,
      name,
      based_state: basedState,
      states_served: statesServed
    };

    if (existingIndex >= 0) {
      members[existingIndex] = updatedUser;
    } else {
      members.push(updatedUser);
    }

    localStorage.setItem("vaultforge_members", JSON.stringify(members));
    alert("Profile saved. Member counts updated.");
    window.location.href = "/dashboard";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <h1 style={{color:"#FFD700",fontWeight:900,marginBottom:16}}>EDIT PROFILE</h1>

        <label style={{display:"block",marginBottom:8}}>Name</label>
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          style={{width:"100%",padding:12,marginBottom:16,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
        />

        <label style={{display:"block",marginBottom:8}}>Based State</label>
        <select
          value={basedState}
          onChange={e=>setBasedState(e.target.value)}
          style={{width:"100%",padding:12,marginBottom:16,borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}
        >
          {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label style={{display:"block",marginBottom:8}}>States Served</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
          {ALL_STATES.map(s => (
            <button
              key={s}
              onClick={()=>toggleState(s)}
              style={{
                padding:"8px 12px",
                borderRadius:8,
                border:"1px solid #222",
                background: statesServed.includes(s)? "#FFD700" : "#0a0f1a",
                color: statesServed.includes(s)? "#000" : "#fff"
              }}
            >{s}</button>
          ))}
        </div>

        <button
          onClick={saveProfile}
          style={{padding:"14px 22px",borderRadius:999,fontWeight:900,background:"#FFD700",color:"#000",width:"100%"}}
        >
          Save Profile
        </button>

        <a href="/dashboard" style={{display:"block",marginTop:16,textAlign:"center",color:"#FFD700"}}>Back to Dashboard</a>
      </div>
    </main>
  );
}
