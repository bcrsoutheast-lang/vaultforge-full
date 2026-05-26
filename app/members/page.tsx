"use client";

import { useEffect, useState } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];

export default function Members() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load member counts by based_state from localStorage
    // For now we'll use dummy data + your own profile
    const stored = localStorage.getItem("vaultforge_members");
    let members = stored? JSON.parse(stored) : [];

    // Add current user if not already in list
    const currentEmail = localStorage.getItem("vaultforge_current_email");
    if (currentEmail &&!members.find((m:any) => m.email === currentEmail)) {
      members.push({
        email: currentEmail,
        name: "Dmoney",
        based_state: "GA", // Your based state from screenshot
        states_served: ["GA","TN","FL","AL","NC","SC","TX"]
      });
      localStorage.setItem("vaultforge_members", JSON.stringify(members));
    }

    // Count by based_state
    const newCounts: Record<string, number> = {};
    STATES.forEach(s => newCounts[s] = 0);
    members.forEach((m:any) => {
      if (newCounts[m.based_state]!== undefined) {
        newCounts[m.based_state]++;
      }
    });
    setCounts(newCounts);
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>MEMBERS BY STATE</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Back to Dashboard</a>
        </div>

        <p style={{opacity:0.7,marginBottom:24}}>Counts by member's based state. Click a state to view profiles.</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:16}}>
          {STATES.map(state => (
            <button
              key={state}
              onClick={()=>window.location.href=`/members/${state.toLowerCase()}`}
              style={{
                border:"1px solid #222",
                borderRadius:12,
                padding:16,
                background:"#0a0f1a",
                textAlign:"left"
              }}
            >
              <div style={{fontSize:24,fontWeight:900,color:"#FFD700"}}>{state}</div>
              <div style={{fontSize:32,fontWeight:900,margin:"8px 0"}}>{counts[state] || 0}</div>
              <div style={{opacity:0.7,fontSize:12}}>members</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
