"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState({ deals: 0, pains: 0, members: 0 });

  useEffect(() => {
    const currentEmail = localStorage.getItem("vaultforge_current_email") || "";
    setEmail(currentEmail);
    
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "{}");
    
    // Count unique members: anyone with a profile, deal, or pain
    const memberEmails = new Set<string>();
    Object.keys(profiles).forEach(e => memberEmails.add(e));
    deals.forEach((d:any) => memberEmails.add(d.postedBy));
    pains.forEach((p:any) => memberEmails.add(p.postedBy));
    
    setStats({
      deals: deals.filter((d:any) => d.status === "active").length,
      pains: pains.filter((p:any) => p.status === "active").length,
      members: memberEmails.size
    });
  }, []);

  function handleLogout() {
    localStorage.removeItem("vaultforge_current_email");
    window.location.href = "/login";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900,fontSize:32}}>VAULTFORGE</h1>
            <div style={{opacity:0.7,fontSize:14}}>Welcome, {email}</div>
          </div>
          <button onClick={handleLogout} style={{padding:"8px 16px",borderRadius:8,background:"#0a0f1a",border:"1px solid #222",color:"#fff"}}>
            Logout
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:32}}>
          <div style={{border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a"}}>
            <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>ACTIVE DEALS</div>
            <div style={{fontSize:48,fontWeight:900,color:"#FFD700"}}>{stats.deals}</div>
          </div>
          <div style={{border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a"}}>
            <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>PAIN POINTS</div>
            <div style={{fontSize:48,fontWeight:900,color:"#FFD700"}}>{stats.pains}</div>
          </div>
          <div style={{border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a"}}>
            <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>MEMBERS</div>
            <div style={{fontSize:48,fontWeight:900,color:"#FFD700"}}>{stats.members}</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          <button 
            onClick={()=>window.location.href="/deal-rooms"}
            style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a",textAlign:"left"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>🏢</div>
            <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>Deal Rooms</div>
            <div style={{opacity:0.7,fontSize:14}}>Browse and post deal opportunities</div>
          </button>

          <button 
            onClick={()=>window.location.href="/pain-rooms"}
            style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",textAlign:"left"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>🔥</div>
            <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>Pain Intake</div>
            <div style={{opacity:0.7,fontSize:14}}>Submit or solve property issues</div>
          </button>

          <button 
            onClick={()=>window.location.href="/messages"}
            style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",textAlign:"left"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>💬</div>
            <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>Messages</div>
            <div style={{opacity:0.7,fontSize:14}}>Chat with other members</div>
          </button>

          <button 
            onClick={()=>window.location.href="/deal-rooms/saved"}
            style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",textAlign:"left"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>⭐</div>
            <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>Saved Deals</div>
            <div style={{opacity:0.7,fontSize:14}}>Your bookmarked opportunities</div>
          </button>

          <button 
            onClick={()=>window.location.href="/deal-rooms/archived"}
            style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",textAlign:"left"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>📦</div>
            <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>Archived</div>
            <div style={{opacity:0.7,fontSize:14}}>Hidden deals and pains</div>
          </button>

          <button 
            onClick={()=>window.location.href="/profile"}
            style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",textAlign:"left"}}
          >
            <div style={{fontSize:24,marginBottom:8}}>👤</div>
            <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>My Profile</div>
            <div style={{opacity:0.7,fontSize:14}}>States served & settings</div>
          </button>
        </div>
      </div>
    </main>
  );
}
