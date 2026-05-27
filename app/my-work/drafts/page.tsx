"use client";

import { useEffect, useState } from "react";

export default function Drafts() {
  const [drafts, setDrafts] = useState<any[]>([]);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadDrafts();
  }, [currentEmail]);

  function loadDrafts() {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    
    const dealDrafts = deals
     .filter((d:any) => d.status === "draft" && d.postedBy === currentEmail)
     .map((d:any) => ({...d, type: "deal"}));
    
    const painDrafts = pains
     .filter((p:any) => p.status === "draft" && p.postedBy === currentEmail)
     .map((p:any) => ({...p, type: "pain"}));
    
    const allDrafts = [...dealDrafts,...painDrafts].sort((a:any,b:any) => b.updatedAt - a.updatedAt);
    setDrafts(allDrafts);
  }

  function handleDelete(type: string, id: number) {
    if (!confirm("Delete this draft permanently?")) return;
    
    if (type === "deal") {
      const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
      const updated = deals.filter((d:any) => d.id!== id);
      localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    } else {
      const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
      const updated = pains.filter((p:any) => p.id!== id);
      localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    }
    loadDrafts();
  }

  function handleEdit(draft: any) {
    if (draft.type === "deal") {
      window.location.href = `/my-work/deal-room?edit=${draft.id}`;
    } else {
      window.location.href = `/my-work/pain-intake?edit=${draft.id}`;
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        {/* LOGO LOCKED AT TOP */}
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>DRAFTS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Unpublished deals and pains. {drafts.length} total</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {drafts.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📄</div>
            <div style={{fontSize:16,fontWeight:900}}>No drafts</div>
            <div style={{fontSize:12,marginTop:8}}>Start a deal or pain and save it as draft to see it here</div>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:16}}>
              <button onClick={()=>window.location.href="/my-work/deal-room"} style={{padding:"10px 20px",background:"#FFD700",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
                Deal Room →
              </button>
              <button onClick={()=>window.location.href="/my-work/pain-intake"} style={{padding:"10px 20px",background:"#00ccff",color:"#000",borderRadius:8,fontSize:12,fontWeight:900,border:"none"}}>
                Pain Intake →
              </button>
            </div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {drafts.map((draft:any) => (
              <div 
                key={`${draft.type}-${draft.id}`} 
                style={{
                  border:`1px solid ${draft.type==="deal"?"#FFD700":"#00ccff"}`,
                  borderRadius:12,
                  padding:16,
                  background:"#0a0f1a"
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{fontWeight:900,fontSize:16,color:draft.type==="deal"?"#FFD700":"#00ccff"}}>
                        {draft.title || "Untitled Draft"}
                      </div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#1a1f2a",border:`1px solid ${draft.type==="deal"?"#FFD700":"#00ccff"}`,fontWeight:900}}>
                        {draft.type.toUpperCase()} DRAFT
                      </div>
                    </div>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:8}}>
                      Last updated {new Date(draft.updatedAt).toLocaleString()}
                    </div>
                    {draft.description && (
                      <div style={{fontSize:12,opacity:0.8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {draft.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{display:"flex",gap:8}}>
                  <button 
                    onClick={()=>handleEdit(draft)} 
                    style={{flex:1,padding:"10px",borderRadius:8,background:draft.type==="deal"?"#FFD700":"#00ccff",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                  >
                    Continue Editing
                  </button>
                  <button 
                    onClick={()=>handleDelete(draft.type, draft.id)} 
                    style={{padding:"10px 16px",borderRadius:8,background:"#222",color:"#ff4444",border:"1px solid #ff4444",fontSize:12,fontWeight:900}}
                  >
                    Delete
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
