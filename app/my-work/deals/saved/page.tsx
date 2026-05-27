"use client";

import { useEffect, useState } from "react";

export default function SavedDeals() {
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState<{[key:number]:string}>({});
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const saved = deals.filter((d:any) => d.savedBy?.includes(currentEmail) && d.status === "active");
    setSavedDeals(saved);
    
    const savedNotes = localStorage.getItem("vaultforge_deal_notes");
    setNotes(savedNotes? JSON.parse(savedNotes) : {});
  }, [currentEmail]);

  const filtered = filter === "all"? savedDeals : savedDeals.filter(d => d.state === filter);

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id)? prev.filter(i => i!== id) : [...prev, id]);
  }

  function handleBulkArchive() {
    if (selected.length === 0) return;
    if (!confirm(`Archive ${selected.length} deals?`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (selected.includes(d.id) && d.savedBy?.includes(currentEmail)) {
        return {...d, savedBy: d.savedBy.filter((e:string) => e!== currentEmail), archivedBy: [...(d.archivedBy||[]), currentEmail]};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handleBulkDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Remove ${selected.length} deals from saved? This does NOT delete from marketplace.`)) return;
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = deals.map((d:any) => {
      if (selected.includes(d.id)) {
        return {...d, savedBy: d.savedBy.filter((e:string) => e!== currentEmail)};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function saveNote(id: number, note: string) {
    const newNotes = {...notes, [id]: note};
    setNotes(newNotes);
    localStorage.setItem("vaultforge_deal_notes", JSON.stringify(newNotes));
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>SAVED DEALS</h1>
            <div style={{fontSize:11,opacity:0.7}}>Private workspace. {savedDeals.length} deals bookmarked.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {selected.length > 0 && (
          <div style={{background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:8,padding:12,marginBottom:16,display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:900}}>{selected.length} selected</div>
            <button onClick={handleBulkArchive} style={{padding:"6px 12px",background:"#FFA500",color:"#000",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Archive</button>
            <button onClick={handleBulkDelete} style={{padding:"6px 12px",background:"#ff4444",color:"#fff",borderRadius:6,fontSize:11,fontWeight:900,border:"none"}}>Remove</button>
            <button onClick={()=>setSelected([])} style={{padding:"6px 12px",background:"#222",color:"#fff",borderRadius:6,fontSize:11,border:"none"}}>Clear</button>
          </div>
        )}

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>setFilter("all")} style={{padding:"6px 12px",borderRadius:6,background:filter==="all"?"#FFD700":"#222",color:filter==="all"?"#000":"#fff",fontSize:12,border:"none"}}>All States</button>
          {["GA","FL","TN","AL","NC","SC","TX"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{padding:"6px 12px",borderRadius:6,background:filter===s?"#FFD700":"#222",color:filter===s?"#000":"#fff",fontSize:12,border:"none"}}>{s}</button>
          ))}
        </div>

        {filtered.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📂</div>
            <div>No saved deals yet.</div>
            <a href="/deal-rooms" style={{color:"#FFD700",fontSize:12}}>Browse marketplace →</a>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filtered.map((d:any) => (
              <div key={d.id} style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#0a0f1a"}}>
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
                      <div style={{fontWeight:900,fontSize:18}}>{d.title}</div>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:d.vaultForgeRating?.includes("A")?"#00ff00":d.vaultForgeRating?.includes("B")?"#FFD700":"#ff4444",color:"#000"}}>{d.vaultForgeRating||"Unrated"}</div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{d.state} - {d.propertyType}</div>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>{d.dealType}</div>
                      <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#05070d",border:"1px solid #333"}}>Ask: {d.askPrice}</div>
                      {d.vaultForgeAnalysis && <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#00ff00",color:"#000"}}>Profit: ${d.vaultForgeAnalysis.profit}</div>}
                    </div>
                    <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>Posted by: {d.posterProfile?.email || d.postedBy}</div>
                  </div>
                </div>
                
                <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #222"}}>
                  <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>PRIVATE NOTES (only you see this)</div>
                  <textarea 
                    value={notes[d.id] || ""}
                    onChange={e=>saveNote(d.id, e.target.value)}
                    placeholder="Add notes: offer price, follow-up date, concerns..."
                    rows={2}
                    style={{width:"100%",padding:8,borderRadius:6,background:"#05070d",border:"1px solid #222",color:"#fff",fontSize:12,resize:"none"}}
                  />
                </div>

                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button onClick={()=>window.location.href=`/deal-rooms/view/${d.id}`} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:11,fontWeight:900,border:"none"}}>View Deal</button>
                  <button onClick={()=>window.location.href=`/messages/${encodeURIComponent(d.postedBy)}`} style={{padding:"6px 12px",borderRadius:6,background:"#222",color:"#FFD700",fontSize:11,border:"1px solid #FFD700"}}>Message</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
