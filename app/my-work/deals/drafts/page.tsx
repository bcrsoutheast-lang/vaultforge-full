"use client";

import { useEffect, useState } from "react";

export default function Drafts() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const myDrafts = allDeals.filter((d:any) => d.postedBy === currentEmail && d.status === "draft");
    setDrafts(myDrafts.sort((a:any,b:any) => b.postedAt - a.postedAt));
  }, []);

  function handlePublish(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.map((d:any) => d.id === dealId? {...d, status: "active"} : d);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.href = "/my-work/deals/sold";
  }

  function handleDelete(dealId: number) {
    const allDeals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const updated = allDeals.filter((d:any) => d.id!== dealId);
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    setDrafts(drafts.filter(d => d.id!== dealId));
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24}}>DRAFT DEALS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Unpublished deals. Publish to route with AI.</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          <button onClick={()=>window.location.href="/my-work/deal-room"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>+ New Deal</button>
        </div>

        {drafts.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>📝</div>
            <div style={{fontSize:16,fontWeight:900}}>No draft deals</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {drafts.map((deal:any) => (
              <div key={deal.id} style={{border:"1px solid #333",borderRadius:12,padding:16,background:"#0a0f1a"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#FFD700"}}>{deal.title}</div>
                    <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{deal.state} | {deal.propertyType} | {deal.dealType}</div>
                  </div>
                  <div style={{fontSize:10,padding:"4px 8px",borderRadius:999,background:"#333",fontWeight:900}}>DRAFT</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12,fontSize:12}}>
                  <div><div style={{opacity:0.6}}>ASK</div><div style={{fontWeight:900}}>${parseInt(deal.askPrice).toLocaleString()}</div></div>
                  <div><div style={{opacity:0.6}}>ARV</div><div style={{fontWeight:900,color:"#00ff00"}}>${parseInt(deal.arv).toLocaleString()}</div></div>
                  <div><div style={{opacity:0.6}}>REPAIR</div><div style={{fontWeight:900}}>${parseInt(deal.repair||0).toLocaleString()}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>handlePublish(deal.id)} style={{padding:"10px",borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontSize:12,fontWeight:900}}>PUBLISH</button>
                  <button onClick={()=>handleDelete(deal.id)} style={{padding:"10px",borderRadius:8,background:"none",color:"#ff0000",border:"1px solid #ff0000",fontSize:12,fontWeight:900}}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
