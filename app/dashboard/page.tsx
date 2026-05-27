"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(localStorage.getItem("vaultforge_current_email") || "Dmoney");
  }, []);

  function logout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
  <span style={{color:"#FFD700",fontWeight:900}}>VAULTFORGE</span>
  <button onClick={()=>alert("Command Center - Coming Soon")}>Command</button>
  <button onClick={()=>alert("My Rooms - Coming Soon")}>My Rooms</button>
  <button onClick={()=>window.location.href="/members"}>Members</button>
  <button onClick={()=>alert("Network - Coming Soon")}>Network</button>
  <button onClick={()=>alert("State Map - Coming Soon")}>State Map</button>
  <button onClick={()=>window.location.href="/deal-rooms"}>Deal Rooms</button>
  <button onClick={()=>alert("Pain Rooms - Coming Soon")}>Pain Rooms</button>
  <button onClick={()=>alert("Messages - Coming Soon")}>Messages</button>
  <button 
    onClick={()=>window.location.href="/profile"} 
    style={{background:"#FFD700",color:"#000"}}
  >Profile</button>
  <button onClick={logout} style={{background:"#8B0000"}}>Logout</button>
</div>

        <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:16}}>
          <button style={{background:"#FFD700",color:"#000",marginRight:8}}>Submit Profile for Approval</button>
          <button>Open Members</button>
          <button>Open Network</button>
          <div style={{marginTop:8,opacity:0.7}}>{email} • Based Cville, GA • Serves GA, TN, FL, AL, NC, SC, TX</div>
        </div>

        <div style={{border:"1px solid #222",borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{color:"#FFD700",fontSize:12}}>MEMBER PROFILE INTELLIGENCE</div>
          <h1 style={{fontSize:32,fontWeight:900,margin:"8px 0"}}>Profile powers the network.</h1>
          <p style={{opacity:0.7}}>Based state controls member cards. States served controls routing, matching, deal/pain fit, and state network intelligence.</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{border:"1px solid #222",borderRadius:12,padding:16}}>
            <div style={{color:"#FFD700",fontSize:12}}>PROFILE PREVIEW</div>
            <div style={{marginTop:8}}>INVESTOR</div>
            <div style={{fontSize:24,fontWeight:900}}>Dmoney</div>
            <div style={{opacity:0.7,fontSize:12}}>Based Cville, GA • Serves GA, TN, FL, AL, NC, SC, TX</div>
          </div>
          
          <div style={{border:"1px solid #222",borderRadius:12,padding:16}}>
            <div style={{color:"#FFD700",fontSize:12}}>COMPLETION</div>
            <div style={{fontSize:32,fontWeight:900}}>80%</div>
            <div style={{opacity:0.7,fontSize:12}}>used for trust and matching</div>
          </div>
        </div>

      </div>
    </main>
  );
}
