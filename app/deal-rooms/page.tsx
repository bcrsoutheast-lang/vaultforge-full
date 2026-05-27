"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("vaultforge_current_email") || "";
    setCurrentEmail(email);
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>VAULTFORGE DASHBOARD</h1>
          <div style={{opacity:0.7}}>{currentEmail}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
          <button 
            onClick={()=>window.location.href="/members"}
            style={{padding:20,borderRadius:12,background:"#0a0f1a",border:"1px solid #222",color:"#fff",fontWeight:900,textAlign:"left"}}
          >
            <div style={{fontSize:24,color:"#FFD700",marginBottom:8}}>Members</div>
            <div style={{opacity:0.7,fontSize:14}}>View by state</div>
          </button>

          <button 
            onClick={()=>window.location.href="/deal-rooms"}
            style={{padding:20,borderRadius:12,background:"#0a0f1a",border:"1px solid #222",color:"#fff",fontWeight:900,textAlign:"left"}}
          >
            <div style={{fontSize:24,color:"#FFD700",marginBottom:8}}>Deal Room</div>
            <div style={{opacity:0.7,fontSize:14}}>Residential, Commercial, Land</div>
          </button>

          <button 
            onClick={()=>window.location.href="/pain-rooms"}
            style={{padding:20,borderRadius:12,background:"#0a0f1a",border:"1px solid #222",color:"#fff",fontWeight:900,textAlign:"left"}}
          >
            <div style={{fontSize:24,color:"#FFD700",marginBottom:8}}>Pain Intake</div>
            <div style={{opacity:0.7,fontSize:14}}>Residential, Commercial, Land</div>
          </button>
        </div>
      </div>
    </main>
  );
}
