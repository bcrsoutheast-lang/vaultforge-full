"use client";

import { useEffect, useState } from "react";

export default function DeletedPains() {
  const [pains, setPains] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_pains_deleted");
    const deleted = stored? JSON.parse(stored) : [];
    setPains(deleted);
  }, []);

  function handleRestore(id: number) {
    const deletedStored = localStorage.getItem("vaultforge_pains_deleted");
    const deleted = deletedStored? JSON.parse(deletedStored) : [];
    const painToRestore = deleted.find((p:any) => p.id === id);
    
    if (painToRestore) {
      const activeStored = localStorage.getItem("vaultforge_pains");
      const active = activeStored? JSON.parse(activeStored) : [];
      active.push({...painToRestore, status: "active"});
      localStorage.setItem("vaultforge_pains", JSON.stringify(active));
      
      const updatedDeleted = deleted.filter((p:any) => p.id!== id);
      localStorage.setItem("vaultforge_pains_deleted", JSON.stringify(updatedDeleted));
      window.location.reload();
    }
  }

  function handlePermanentDelete(id: number) {
    if (!confirm("Permanently delete this pain point? Cannot be undone.")) return;
    const stored = localStorage.getItem("vaultforge_pains_deleted");
    const deleted = stored? JSON.parse(stored) : [];
    const updated = deleted.filter((p:any) => p.id!== id);
    localStorage.setItem("vaultforge_pains_deleted", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>DELETED PAIN POINTS</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Dashboard</a>
        </div>
        {pains.length === 0? <div style={{opacity:0.7}}>No deleted pain points.</div> : (
          <div style={{display:"grid",gap:12}}>
            {pains.map((p:any) => (
              <div key={p.id} style={{border:"1px solid #ff4444",borderRadius:12,padding:16,opacity:0.5}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:900,fontSize:18}}>{p.title}</div>
                  <div style={{fontSize:12,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{p.state} - {p.propertyType}</div>
                </div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{p.description}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>handleRestore(p.id)} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>Restore</button>
                  <button onClick={()=>handlePermanentDelete(p.id)} style={{padding:"6px 12px",borderRadius:6,background:"#ff4444",color:"#fff",fontSize:12}}>Delete Forever</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
