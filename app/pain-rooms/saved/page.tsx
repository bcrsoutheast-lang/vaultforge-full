"use client";

import { useEffect, useState } from "react";

export default function SavedPains() {
  const [pains, setPains] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const saved = allPains.filter((p:any) => p.savedBy && p.savedBy.includes(currentEmail));
    setPains(saved);
  }, [currentEmail]);

  function handleUnsave(id: number) {
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const updated = allPains.map((p:any) => {
      if (p.id === id) {
        const saved = (p.savedBy || []).filter((e:string) => e!== currentEmail);
        return {...p, savedBy: saved};
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    window.location.reload();
  }

  function handleMessage(email: string) {
    const text = prompt(`Message to ${email}:`);
    if (!text) return;
    
    const stored = localStorage.getItem("vaultforge_messages");
    const msgs = stored? JSON.parse(stored) : [];
    msgs.push({
      id: Date.now(),
      from: currentEmail,
      to: email,
      text,
      timestamp: Date.now()
    });
    localStorage.setItem("vaultforge_messages", JSON.stringify(msgs));
    window.location.href = `/messages/${encodeURIComponent(email)}`;
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>SAVED PAIN POINTS</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Back to Dashboard</a>
        </div>

        {pains.length === 0? (
          <div style={{opacity:0.7}}>No saved pain points yet. Click Save on any issue to add it here.</div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {pains.map((p:any) => (
              <div key={p.id} style={{border:"1px solid #222",borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:900,fontSize:18}}>{p.title}</div>
                  <div style={{fontSize:12,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{p.state} - {p.propertyType}</div>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#0a0f1a",border:"1px solid #333"}}>{p.painCategory}</div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:p.urgency==="Critical"?"#ff4444":p.urgency==="High"?"#FFD700":"#0a0f1a",color:p.urgency==="High"?"#000":"#fff"}}>{p.urgency}</div>
                </div>
                <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>Posted by: {p.postedBy}</div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{p.description}</div>
                
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>handleUnsave(p.id)} style={{padding:"6px 12px",borderRadius:6,background:"#ff4444",color:"#fff",fontSize:12}}>
                    Unsave
                  </button>
                  <button onClick={()=>handleMessage(p.postedBy)} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
