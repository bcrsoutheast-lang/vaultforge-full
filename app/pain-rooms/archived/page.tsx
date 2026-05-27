"use client";

import { useEffect, useState } from "react";

export default function ArchivedPains() {
  const [pains, setPains] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const archived = allPains.filter((p:any) => p.archivedBy && p.archivedBy.includes(currentEmail));
    setPains(archived);
  }, [currentEmail]);

  function handleUnarchive(id: number) {
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const updated = allPains.map((p:any) => {
      if (p.id === id) {
        const archived = (p.archivedBy || []).filter((e:string) => e!== currentEmail);
        return {...p, archivedBy: archived};
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>ARCHIVED PAIN POINTS</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Dashboard</a>
        </div>
        {pains.length === 0? <div style={{opacity:0.7}}>No archived pain points.</div> : (
          <div style={{display:"grid",gap:12}}>
            {pains.map((p:any) => (
              <div key={p.id} style={{border:"1px solid #222",borderRadius:12,padding:16,opacity:0.6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:900,fontSize:18}}>{p.title}</div>
                  <div style={{fontSize:12,padding:"2px 8px",borderRadius:999,background:"#222",color:"#FFD700"}}>{p.state} - {p.propertyType}</div>
                </div>
                <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>Posted by: {p.postedBy}</div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{p.description}</div>
                <button onClick={()=>handleUnarchive(p.id)} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>Unarchive</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
