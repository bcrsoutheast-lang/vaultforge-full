"use client";

import { useEffect, useState } from "react";

export default function DeletedDeals() {
  const [deletedDeals, setDeletedDeals] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    // Auto-purge deals older than 30 days
    const filtered = deals.filter((d:any) => {
      if (d.status === "deleted" && d.deletedAt && (now - d.deletedAt) > thirtyDays) {
        return false; // Purge it
      }
      return true;
    });
    
    // Save back if anything was purged
    if (filtered.length!== deals.length) {
      localStorage.setItem("vaultforge_deals", JSON.stringify(filtered));
    }
    
    const deleted = filtered.filter((d:any) => 
      d.postedBy === currentEmail && d.status === "deleted"
    );
    setDeletedDeals(deleted);
  }, [currentEmail]);

  function getDaysLeft(deletedAt: number): number {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const elapsed = now - deletedAt;
    const remaining = thirtyDays - elapsed;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id)? prev.filter(i => i!== id) : [...prev, id]);
  }

  function handleRestore() {
    if (selected.length === 0) return;
    if (!confirm(`Restore ${selected.length} deals to active?`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (selected.includes(d.id)) return {...d, status: "active", deletedAt: null, statusUpdatedAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handlePermanentDelete() {
    if (selected.length === 0) return;
    if (!confirm(`PERMANENTLY DELETE ${selected.length} deals? This cannot be undone. Deals will be gone forever.`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.filter((d:any) =>!selected.includes(d.id));
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handleEmptyTrash() {
    if (deletedDeals.length === 0) return;
    if (!confirm(`EMPTY TRASH? This permanently deletes ${deletedDeals.length} deals. Cannot be undone.`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.filter((d:any) =>!(d.postedBy === currentEmail && d.status === "deleted"));
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#ff4444",fontWeight:900}}>DELETED DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Trash. {deletedDeals.length} deals. Auto-deletes after 30 days.</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {deletedDeals.length > 0 && (
              <button onClick={handleEmptyTrash} style={{padding:"8px 16px",border:"1px solid #ff4444",borderRadius:8,color:"#ff4444",background:"none",fontSize:12}}>Empty Trash</button>
            )}
            <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          </div>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #ff4444",color:"#ff4444",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          ⚠️ TRASH: Deals here auto-delete permanently after 30 days. Restore them or they’re gone forever.
        </div>

        {selected.length > 0 && (
          <div style={{background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:8,padding:12,marginBottom:16,display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:900}}>{selected.length} selected</div>
            <button onClick={handleRestore} style={{padding:"6px 12px",background:"#00ff00",color:"#000",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Restore</button>
            <button onClick={handlePermanentDelete} style={{padding:"6px 12px",background:"#ff4444",color:"#fff",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Delete Forever</button>
            <button onClick={()=>setSelected([])} style={{padding:"6px 12px",background:"#222",color:"#fff",borderRadius:6,fontSize:11,border:"none"}}>Clear</button>
          </div>
        )}

        {deletedDeals.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🗑️</div>
            <div>Trash is empty.</div>
            <div style={{fontSize:12,marginTop:8}}>Deleted deals stay here for 30 days before permanent removal.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {deletedDeals.map((d:any) => {
              const daysLeft = getDaysLeft(d.deletedAt);
              const isUrgent = daysLeft <= 7;
              return (
                <div key={d.id} style={{border:`1px solid ${isUrgent?"#ff4444":"#444"}`,borderRadius:12,padding:16,background:"#0a0f1a",opacity:0.7}}>
                  <div style={{display:"flex",gap:12,alignItems:"start"}}>
                    <input 
                      type="checkbox" 
                      checked={selected.includes(d.id)}
                      onChange={()=>toggleSelect(d.id)}
                      style={{marginTop:4}}
                    />
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontWeight:900,fontSize:16}}>{d.title}</div>
                        <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:isUrgent?"#ff4444":"#666",color:"#fff",fontWeight:900}}>
                          {daysLeft} DAYS LEFT
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                        <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#999"}}>{d.state} - {d.propertyType}</div>
                        <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333",color:"#999"}}>Ask: {d.askPrice}</div>
                        {d.vaultForgeAnalysis && <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333",color:"#999"}}>Profit: ${d.vaultForgeAnalysis.profit}</div>}
                      </div>
                      <div style={{opacity:0.6,fontSize:11}}>
                        Deleted: {d.deletedAt? new Date(d.deletedAt).toLocaleDateString() : "Unknown"} • 
                        Auto-purge: {d.deletedAt? new Date(d.deletedAt + 30*24*60*60*1000).toLocaleDateString() : "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
