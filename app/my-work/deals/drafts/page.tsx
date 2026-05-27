"use client";

import { useEffect, useState } from "react";

export default function DraftDeals() {
  const [draftDeals, setDraftDeals] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const drafts = deals.filter((d:any) => 
      d.postedBy === currentEmail && d.status === "draft"
    );
    setDraftDeals(drafts);
  }, [currentEmail]);

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id)? prev.filter(i => i!== id) : [...prev, id]);
  }

  function handlePublish() {
    if (selected.length === 0) return;
    if (!confirm(`Publish ${selected.length} deals to marketplace?`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (selected.includes(d.id)) return {...d, status: "active", postedAt: Date.now(), statusUpdatedAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert(`${selected.length} deals published to marketplace!`);
    window.location.reload();
  }

  function handleDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} drafts permanently?`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.filter((d:any) =>!selected.includes(d.id));
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFA500",fontWeight:900}}>DRAFT DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Unfinished. {draftDeals.length} drafts. Not visible to public.</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>window.location.href="/deal-rooms/create"} style={{padding:"8px 16px",border:"1px solid #FFA500",borderRadius:8,color:"#FFA500",background:"none",fontSize:12}}>+ New Draft</button>
            <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          </div>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #FFA500",color:"#FFA500",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          ✏️ DRAFTS: These deals are NOT posted to marketplace. Edit, publish, or delete them.
        </div>

        {selected.length > 0 && (
          <div style={{background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:8,padding:12,marginBottom:16,display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:900}}>{selected.length} selected</div>
            <button onClick={handlePublish} style={{padding:"6px 12px",background:"#00ff00",color:"#000",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Publish to Marketplace</button>
            <button onClick={handleDelete} style={{padding:"6px 12px",background:"#ff4444",color:"#fff",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Delete Drafts</button>
            <button onClick={()=>setSelected([])} style={{padding:"6px 12px",background:"#222",color:"#fff",borderRadius:6,fontSize:11,border:"none"}}>Clear</button>
          </div>
        )}

        {draftDeals.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📝</div>
            <div>No drafts saved.</div>
            <div style={{fontSize:12,marginTop:8}}>Start creating a deal and save it as draft to finish later.</div>
            <button onClick={()=>window.location.href="/deal-rooms/create"} style={{marginTop:16,padding:"8px 16px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:12,fontWeight:900,border:"none"}}>Create Deal</button>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {draftDeals.map((d:any) => (
              <div key={d.id} style={{border:"1px solid #FFA500",borderRadius:12,padding:16,background:"#0a0f1a"}}>
                <div style={{display:"flex",gap:12,alignItems:"start"}}>
                  <input 
                    type="checkbox" 
                    checked={selected.includes(d.id)}
                    onChange={()=>toggleSelect(d.id)}
                    style={{marginTop:4}}
                  />
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{fontWeight:900,fontSize:16}}>{d.title || "Untitled Draft"}</div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#FFA500",color:"#000",fontWeight:900}}>DRAFT</div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFA500"}}>{d.state || "No State"} - {d.propertyType || "No Type"}</div>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>Ask: {d.askPrice || "TBD"}</div>
                      {d.vaultForgeAnalysis && <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>Profit: ${d.vaultForgeAnalysis.profit}</div>}
                    </div>
                    <div style={{opacity:0.6,fontSize:11}}>Last saved: {d.updatedAt? new Date(d.updatedAt).toLocaleDateString() : "Unknown"}</div>
                  </div>
                </div>
                
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button onClick={()=>window.location.href=`/deal-rooms/create?edit=${d.id}`} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:11,fontWeight:900,border:"none"}}>Edit Draft</button>
                  <button onClick={()=>{
                    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
                    const updated = deals.map((item:any) => {
                      if (item.id === d.id) return {...item, status: "active", postedAt: Date.now()};
                      return item;
                    });
                    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
                    alert("Published to marketplace!");
                    window.location.reload();
                  }} style={{padding:"6px 12px",borderRadius:6,background:"#00ff00",color:"#000",fontSize:11,fontWeight:900,border:"none"}}>Publish Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
