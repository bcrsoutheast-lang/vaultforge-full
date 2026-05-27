"use client";

import { useEffect, useState } from "react";

export default function DeletedDeals() {
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals_deleted");
    const deleted = stored? JSON.parse(stored) : [];
    setDeals(deleted);
  }, []);

  function handleRestore(id: number) {
    const deletedStored = localStorage.getItem("vaultforge_deals_deleted");
    const deleted = deletedStored? JSON.parse(deletedStored) : [];
    const dealToRestore = deleted.find((d:any) => d.id === id);
    
    if (dealToRestore) {
      const activeStored = localStorage.getItem("vaultforge_deals");
      const active = activeStored? JSON.parse(activeStored) : [];
      active.push({...dealToRestore, status: "active"});
      localStorage.setItem("vaultforge_deals", JSON.stringify(active));
      
      const updatedDeleted = deleted.filter((d:any) => d.id!== id);
      localStorage.setItem("vaultforge_deals_deleted", JSON.stringify(updatedDeleted));
      window.location.reload();
    }
  }

  function handlePermanentDelete(id: number) {
    if (!confirm("Permanently delete this deal? Cannot be undone.")) return;
    const stored = localStorage.getItem("vaultforge_deals_deleted");
    const deleted = stored? JSON.parse(stored) : [];
    const updated = deleted.filter((d:any) => d.id!== id);
    localStorage.setItem("vaultforge_deals_deleted", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>DELETED DEALS</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Dashboard</a>
        </div>
        {deals.length === 0? <div style={{opacity:0.7}}>No deleted deals.</div> : (
          <div style={{display:"grid",gap:12}}>
            {deals.map((d:any) => (
              <div key={d.id} style={{border:"1px solid #ff4444",borderRadius:12,padding:16,opacity:0.5}}>
                <div style={{fontWeight:900,fontSize:18,marginBottom:8}}>{d.title}</div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{d.description}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>handleRestore(d.id)} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>Restore</button>
                  <button onClick={()=>handlePermanentDelete(d.id)} style={{padding:"6px 12px",borderRadius:6,background:"#ff4444",color:"#fff",fontSize:12}}>Delete Forever</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
