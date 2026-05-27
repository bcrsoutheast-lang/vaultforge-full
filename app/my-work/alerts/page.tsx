"use client";

import { useEffect, useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState("unread");
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadAlerts();
  }, [currentEmail]);

  function loadAlerts() {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const myAlerts = allAlerts.filter((a:any) => a.for === currentEmail);
    setAlerts(myAlerts.sort((a:any,b:any) => b.createdAt - a.createdAt));
  }

  function markAsRead(alertId: number) {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.map((a:any) => a.id === alertId? {...a, read: true} : a);
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  function handleViewAlert(alert: any) {
    markAsRead(alert.id);
    if (alert.type === "deal") {
      window.location.href = `/deal-opportunities`; // TODO: deep link to specific deal
    } else if (alert.type === "pain") {
      window.location.href = `/pain-room`; // TODO: deep link to specific pain
    }
  }

  function deleteAlert(alertId: number) {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.filter((a:any) => a.id!== alertId);
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  // DEMO: Generate sample alert if none exist
  function generateSampleAlert() {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const sampleAlert = {
      id: Date.now(),
      for: currentEmail,
      type: "deal",
      title: "New Deal Match: 123 Main St Flip",
      message: "Matches your buy box: GA, SFH, Under $200K",
      dealId: 12345,
      createdAt: Date.now(),
      read: false,
      matchScore: 92
    };
    allAlerts.push(sampleAlert);
    localStorage.setItem("vaultforge_alerts", JSON.stringify(allAlerts));
    loadAlerts();
  }

  const filteredAlerts = alerts.filter(a => {
    if (filter === "unread") return!a.read;
    if (filter === "deals") return a.type === "deal";
    if (filter === "pains") return a.type === "pain";
    return true;
  });

  const unreadCount = alerts.filter(a =>!a.read).length;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#ff4444",fontWeight:900}}>ALERTS</h1>
            <div style={{fontSize:11,opacity:0.7}}>VaultForge AI routing. {unreadCount} unread</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #ff4444",color:"#ff4444",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🔔 AI MATCHMAKER: VaultForge reads your Profile + Buy Box + DMAIC skills and alerts you when members post matching deals/pains.
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["unread","all","deals","pains"].map(f => (
            <button 
              key={f}
              onClick={()=>setFilter(f)} 
              style={{
                padding:"6px 12px",
                borderRadius:999,
                border:"1px solid #333",
                background:filter===f?"#ff4444":"#0a0f1a",
                color:filter===f?"#000":"#fff",
                fontSize:11,
                fontWeight:900
              }}
            >
              {f === "unread"? `Unread (${unreadCount})` : f.toUpperCase()}
            </button>
          ))}
          <button onClick={generateSampleAlert} style={{padding:"6px 12px",borderRadius:999,border:"1px solid #666",background:"#222",color:"#999",fontSize:11}}>
            + Demo Alert
          </button>
        </div>

        {filteredAlerts.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔕</div>
            <div>No {filter === "unread"? "unread" : ""} alerts.</div>
            <div style={{fontSize:12,marginTop:8}}>VaultForge AI will notify you when deals/pains match your profile.</div>
            <div style={{fontSize:11,marginTop:16,opacity:0.6}}>
              Make sure your Profile has: Investor Type, Buy Box, States, DMAIC Skills
            </div>
            <button onClick={()=>window.location.href="/my-work/profile"} style={{marginTop:16,padding:"8px 16px",background:"#FFD700",color:"#000",borderRadius:6,fontSize:12,fontWeight:900,border:"none"}}>Update Profile</button>
          </div>
        ) : (
          <div style={{display:"grid",gap:8}}>
            {filteredAlerts.map((alert:any) => (
              <div 
                key={alert.id} 
                style={{
                  border:`1px solid ${alert.read?"#333":"#ff4444"}`,
                  borderRadius:12,
                  padding:16,
                  background:alert.read?"#0a0f1a":"#1a0a0a",
                  opacity:alert.read?0.7:1
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:20}}>{alert.type === "deal"?"📈" : "🔧"}</div>
                    <div>
                      <div style={{fontWeight:900,fontSize:14}}>{alert.title}</div>
                      <div style={{fontSize:10,opacity:0.6}}>{new Date(alert.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  {alert.matchScore && (
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#00ff00",color:"#000",fontWeight:900}}>
                      {alert.matchScore}% MATCH
                    </div>
                  )}
                </div>

                <div style={{fontSize:12,opacity:0.9,marginBottom:12}}>{alert.message}</div>

                <div style={{display:"flex",gap:8}}>
                  <button 
                    onClick={()=>handleViewAlert(alert)} 
                    style={{flex:1,padding:"8px",borderRadius:6,background:"#FFD700",color:"#000",border:"none",fontSize:12,fontWeight:900}}
                  >
                    View {alert.type === "deal"?"Deal" : "Pain"} →
                  </button>
                  {!alert.read && (
                    <button 
                      onClick={()=>markAsRead(alert.id)} 
                      style={{padding:"8px 12px",borderRadius:6,background:"#222",color:"#fff",border:"1px solid #666",fontSize:12}}
                    >
                      Mark Read
                    </button>
                  )}
                  <button 
                    onClick={()=>deleteAlert(alert.id)} 
                    style={{padding:"8px 12px",borderRadius:6,background:"#222",color:"#ff4444",border:"1px solid #ff4444",fontSize:12}}
                  >
                    Delete
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
