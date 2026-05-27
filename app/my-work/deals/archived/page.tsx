"use client";

import { useEffect, useState } from "react";

export default function ArchivedDeals() {
  const [archivedDeals, setArchivedDeals] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const archived = deals.filter((d:any) => 
      d.postedBy === currentEmail && d.status === "archived"
    );
    setArchivedDeals(archived);
  }, [currentEmail]);

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id)? prev.filter(i => i!== id) : [...prev, id]);
  }

  function handleRestore() {
    if (selected.length === 0) return;
    if (!confirm(`Restore ${selected.length} deals to active?`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (selected.includes(d.id)) return {...d, status: "active", statusUpdatedAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handleDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Move ${selected.length} deals to trash? You can recover from Deleted for 30 days.`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (selected.includes(d.id)) return {...d, status: "deleted", deletedAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#666",fontWeight:900}}>ARCHIVED DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Storage. {archivedDeals.length} deals archived. Private workspace.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #666",color:"#666",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12}}>
          📦 ARCHIVE: These deals are hidden from active pipeline but kept for records. Actions here do NOT affect public marketplace.
        </div>

        {selected.length > 0 && (
          <div style={{background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:8,padding:12,marginBottom:16,display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:900}}>{selected.length} selected</div>
            <button onClick={handleRestore} style={{padding:"6px 12px",background:"#00ff00",color:"#000",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Restore to Active</button>
            <button onClick={handleDelete} style={{padding:"6px 12px",background:"#ff4444",color:"#fff",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Move to Trash</button>
            <button onClick={()=>setSelected([])} style={{padding:"6px 12px",background:"#222",color:"#fff",borderRadius:6,fontSize:11,border:"none"}}>Clear</button>
          </div>
        )}

        {archivedDeals.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📦</div>
            <div>No archived deals.</div>
            <div style={{fontSize:12,marginTop:8}}>Archive deals from Saved or Under Contract to keep workspace clean.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {archivedDeals.map((d:any) => (
              <div key={d.id} style={{border:"1px solid #444",borderRadius:12,padding:16,background:"#0a0f1a",opacity:0.8}}>
                <div style={{display:"flex",gap:12,alignItems:"start"}}>
                  <input 
                    type="checkbox" 
                    checked={selected.includes(d.id)}
                    onChange={()=>toggleSelect(d.id)}
                    style={{marginTop:4}}
                  />
                  <div 
                    style={{flex:1,cursor:"pointer"}} 
                    onClick={()=>window.location.href=`/deal-rooms/view/${d.id}`}
                  >
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{fontWeight:900,fontSize:16}}>{d.title}</div>
                      <div style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#666",color:"#fff"}}>ARCHIVED</div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#999"}}>{d.state} - {d.propertyType}</div>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333",color:"#999"}}>Ask: {d.askPrice}</div>
                      {d.vaultForgeAnalysis && <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333",color:"#999"}}>Profit: ${d.vaultForgeAnalysis.profit}</div>}
                    </div>
                    <div style={{opacity:0.6,fontSize:11}}>Archived: {d.statusUpdatedAt? new Date(d.statusUpdatedAt).toLocaleDateString() : "Unknown"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
