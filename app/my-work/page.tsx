"use client";

import { useEffect, useState } from "react";

export default function MyWorkCommand() {
  const [stats, setStats] = useState({deals:0,pains:0,saved:0,underContract:0,sold:0});
  const [myDeals, setMyDeals] = useState<any[]>([]);
  const [myPains, setMyPains] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
    const pains = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
    
    const myD = deals.filter((d:any) => d.postedBy === currentEmail);
    const myP = pains.filter((p:any) => p.postedBy === currentEmail);
    const savedD = deals.filter((d:any) => d.savedBy?.includes(currentEmail));
    const savedP = pains.filter((p:any) => p.savedBy?.includes(currentEmail));
    
    setMyDeals(myD);
    setMyPains(myP);
    setStats({
      deals: myD.length,
      pains: myP.length,
      saved: savedD.length + savedP.length,
      underContract: myD.filter((d:any) => d.status === "under_contract").length,
      sold: myD.filter((d:any) => d.status === "sold").length
    });
  }, [currentEmail]);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>MY WORK COMMAND CENTER</h1>
            <div style={{fontSize:11,opacity:0.7}}>Your deals. Your pains. Your money.</div>
          </div>
          <a href="/dashboard" style={{color:"#FFD700"}}>Dashboard</a>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
          {[
            {label:"My Deals",val:stats.deals,color:"#FFD700"},
            {label:"My Pains",val:stats.pains,color:"#FFD700"},
            {label:"Saved",val:stats.saved,color:"#FFD700"},
            {label:"Under Contract",val:stats.underContract,color:"#00ff00"},
            {label:"Sold",val:stats.sold,color:"#00ff00"}
          ].map(s => (
            <div key={s.label} style={{border:"1px solid #222",borderRadius:12,padding:16,textAlign:"center",background:"#0a0f1a"}}>
              <div style={{fontSize:28,fontWeight:900,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,opacity:0.7}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          <div style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#0a0f1a"}}>
            <div style={{fontWeight:900,marginBottom:12,color:"#FFD700"}}>MY DEALS</div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <a href="/deal-rooms/create" style={{padding:"6px 12px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:11,fontWeight:900}}>+ New</a>
              <a href="/deal-rooms/saved" style={{padding:"6px 12px",border:"1px solid #FFD700",color:"#FFD700",borderRadius:6,fontSize:11}}>Saved</a>
              <a href="/deal-rooms/archived" style={{padding:"6px 12px",border:"1px solid #222",color:"#fff",borderRadius:6,fontSize:11}}>Archived</a>
            </div>
            {myDeals.slice(0,3).map((d:any) => (
              <div key={d.id} onClick={()=>window.location.href=`/deal-rooms/view/${d.id}`} style={{padding:8,border:"1px solid #222",borderRadius:8,marginBottom:8,cursor:"pointer",fontSize:12}}>
                <div style={{fontWeight:900}}>{d.title}</div>
                <div style={{opacity:0.7}}>{d.state} • {d.askPrice} • {d.vaultForgeRating}</div>
              </div>
            ))}
          </div>

          <div style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#0a0f1a"}}>
            <div style={{fontWeight:900,marginBottom:12,color:"#FFD700"}}>MY PAINS</div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <a href="/pain-rooms/create" style={{padding:"6px 12px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:11,fontWeight:900}}>+ New</a>
              <a href="/pain-rooms/saved" style={{padding:"6px 12px",border:"1px solid #FFD700",color:"#FFD700",borderRadius:6,fontSize:11}}>Saved</a>
              <a href="/pain-rooms/archived" style={{padding:"6px 12px",border:"1px solid #222",color:"#fff",borderRadius:6,fontSize:11}}>Archived</a>
            </div>
            {myPains.slice(0,3).map((p:any) => (
              <div key={p.id} onClick={()=>window.location.href=`/pain-rooms/view/${p.id}`} style={{padding:8,border:"1px solid #222",borderRadius:8,marginBottom:8,cursor:"pointer",fontSize:12}}>
                <div style={{fontWeight:900}}>{p.title}</div>
                <div style={{opacity:0.7}}>{p.state} • {p.urgency} • {p.painType}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
