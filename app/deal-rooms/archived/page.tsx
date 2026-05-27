"use client";

import { useEffect, useState } from "react";

export default function ArchivedDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const archived = allDeals.filter((d:any) => d.archivedBy && d.archivedBy.includes(currentEmail));
    setDeals(archived);
  }, [currentEmail]);

  function handleUnarchive(id: number) {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const updated = allDeals.map((d:any) => {
      if (d.id === id) {
        const archived = (d.archivedBy || []).filter((e:string) => e!== currentEmail);
        return {...d, archivedBy: archived};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>ARCHIVED DEALS</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Dashboard</a>
        </div>
        {deals.length === 0? <div style={{opacity:0.7}}>No archived deals.</div> : (
          <div style={{display:"grid",gap:12}}>
            {deals.map((d:any) => (
              <div key={d.id} style={{border:"1px solid #222",borderRadius:12,padding:16,opacity:0.6}}>
                <div style={{fontWeight:900,fontSize:18,marginBottom:8}}>{d.title}</div>
                <div style={{opacity:0.7,fontSize:14,marginBottom:12}}>{d.description}</div>
                <button onClick={()=>handleUnarchive(d.id)} style={{padding:"6px 12px",borderRadius:6,background:"#FFD700",color:"#000",fontSize:12,fontWeight:900}}>Unarchive</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
