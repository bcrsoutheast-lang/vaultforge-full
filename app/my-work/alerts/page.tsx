"use client";

import { useEffect, useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState("unread");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadAlerts();
  }, []);

  function loadAlerts() {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const myAlerts = allAlerts.filter((a:any) => a.for === currentEmail);
    setAlerts(myAlerts.sort((a:any,b:any) => b.createdAt - a.createdAt));
  }

  function markAsRead(alertId: number) {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.map((a:any) => {
      if (a.id === alertId) return {...a, read: true};
      return a;
    });
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  function markAllRead() {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.map((a:any) => {
      if (a.for === currentEmail) return {...a, read: true};
      return a;
    });
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  function deleteAlert(alertId: number) {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.filter((a:any) => a.id!== alertId);
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  function handleClickAlert(alert: any) {
    markAsRead(alert.id);
    if (alert.type === "deal") {
      window.location.href = "/deal-opportunities";
    } else if (alert.type === "pain") {
      window.location.href = "/pain-room";
    } else if (alert.type === "message") {
      window.location.href = "/my-work/messages";
    }
  }

  const filteredAlerts = alerts.filter(a => {
    if (filter === "unread") return !a.read;
    if (filter === "read") return a.read;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>ALERTS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>AI-matched deals and pains routed to your buy box</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:900,color:"#FFD700"}}>{unreadCount} UNREAD</div>
            <button onClick={markAllRead} style={{padding:"8px 12px",border:"1px solid #333",borderRadius:8,color:"#fff",background:"none",fontSize:11}}>Mark All Read</button>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["unread","all","read"].map(f=>(
            <button 
              key={f}
              onClick={()=>setFilter(f)}
              style={{
                padding:"8px 16px",
                borderRadius:8,
                border: filter===f? "1px solid #FFD700" : "1px solid #333",
                background: filter===f? "#FFD70020" : "none",
                color: filter===f? "#FFD700" : "#fff",
                fontSize:12,
                fontWeight: filter===f? 900 : 400
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {filteredAlerts.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔔</div>
            <div style={{fontSize:16,fontWeight:900}}>No {filter} alerts</div>
            <div style={{fontSize:12,marginTop:8}}>Publish deals/pains and VaultForge AI will route matches here</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {filteredAlerts.map((alert:any) => (
              <div 
                key={alert.id}
                style={{
                  border: alert.read? "1px solid #333" : "1px solid #FFD700",
                  borderRadius:12,
                  padding:16,
                  background: alert.read? "#0a0f1a" : "#0a0f1a",
                  boxShadow: alert.read? "none" : "0 0 12px #FFD70020",
                  cursor:"pointer"
                }}
                onClick={()=>handleClickAlert(alert)}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{
                        fontSize:10,
                        padding:"3px 8px",
                        borderRadius:999,
                        background: alert.type==="deal"? "#FFD70020" : alert.type==="pain"? "#00ccff20" : "#333",
                        border: alert.type==="deal"? "1px solid #FFD700" : alert.type==="pain"? "1px solid #00ccff" : "1px solid #333",
                        color: alert.type==="deal"? "#FFD700" : alert.type==="pain"? "#00ccff" : "#fff",
                        fontWeight:900
                      }}>
                        {alert.type.toUpperCase()}
                      </div>
                      {!alert.read && <div style={{width:8,height:8,borderRadius:"50%",background:"#FFD700"}}></div>}
                    </div>
                    <div style={{fontWeight:900,fontSize:14,marginBottom:4}}>{alert.title}</div>
                    <div style={{fontSize:12,opacity:0.8,marginBottom:8}}>{alert.message}</div>
                    <div style={{fontSize:10,opacity:0.5}}>
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    onClick={(e)=>{e.stopPropagation();deleteAlert(alert.id);}}
                    style={{padding:"6px 10px",border:"1px solid #ff0000",borderRadius:6,color:"#ff0000",background:"none",fontSize:10}}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
