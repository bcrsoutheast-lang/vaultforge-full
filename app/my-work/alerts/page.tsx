"use client";

import { useEffect, useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadAlerts();
  }, [currentEmail]);

  function loadAlerts() {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const userAlerts = allAlerts
    .filter((a:any) => a.for === currentEmail)
    .sort((a:any,b:any) => b.createdAt - a.createdAt);
    setAlerts(userAlerts);
  }

  function handleMarkRead(alertId: number) {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.map((a:any) => {
      if (a.id === alertId) {
        return {...a, read: true};
      }
      return a;
    });
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  function handleMarkAllRead() {
    const allAlerts = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
    const updated = allAlerts.map((a:any) => {
      if (a.for === currentEmail) {
        return {...a, read: true};
      }
      return a;
    });
    localStorage.setItem("vaultforge_alerts", JSON.stringify(updated));
    loadAlerts();
  }

  function handleClickAlert(alert: any) {
    handleMarkRead(alert.id);
    if (alert.type === "deal" && alert.targetId) {
      window.location.href = `/deal-opportunities`;
    } else if (alert.type === "pain" && alert.targetId) {
      window.location.href = `/pain-room`;
    }
  }

  function getAlertColor(type: string) {
    switch(type) {
      case "deal": return "#FFD700";
      case "pain": return "#00ccff";
      case "message": return "#FF00FF";
      case "system": return "#999";
      default: return "#666";
    }
  }

  function getAlertIcon(type: string) {
    switch(type) {
      case "deal": return "💰";
      case "pain": return "🔧";
      case "message": return "💬";
      case "system": return "🔔";
      default: return "📢";
    }
  }

  const unreadCount = alerts.filter(a =>!a.read).length;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        {/* LOGO LOCKED AT TOP */}
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FF00FF"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FF00FF)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FF00FF",fontWeight:900,fontSize:24,letterSpacing:1}}>ALERTS</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>AI-matched opportunities. {unreadCount} unread</div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{padding:"8px 16px",border:"1px solid #FF00FF",borderRadius:8,color:"#FF00FF",background:"none",fontSize:12}}>
              Mark All Read
            </button>
          )}
        </div>

        {alerts.length === 0? (
          <div style={{textAlign:"center",padding:60,opacity:0.7}}>
            <div style={{fontSize:48,marginBottom:16}}>🔔</div>
            <div style={{fontSize:16,fontWeight:900}}>No alerts yet</div>
            <div style={{fontSize:12,marginTop:8}}>VaultForge AI will notify you when deals or pains match your buy box</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {alerts.map((alert:any) => (
              <button
                key={alert.id}
                onClick={()=>handleClickAlert(alert)}
                style={{
                  border:`1px solid ${getAlertColor(alert.type)}`,
                  borderRadius:12,
                  padding:16,
                  background:alert.read?"#0a0f1a":"#1a0f1a",
                  color:"#fff",
                  textAlign:"left",
                  cursor:"pointer",
                  opacity:alert.read?0.6:1,
                  transition:"all 0.2s"
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background="#1a1f2a";
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background=alert.read?"#0a0f1a":"#1a0f1a";
                }}
              >
                <div style={{display:"flex",gap:12,alignItems:"start"}}>
                  <div style={{fontSize:24}}>{getAlertIcon(alert.type)}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
                      <div style={{fontWeight:900,fontSize:14,color:getAlertColor(alert.type)}}>
                        {alert.title}
                      </div>
                      {!alert.read && (
                        <div style={{width:8,height:8,borderRadius:"50%",background:"#ff4444"}}></div>
                      )}
                    </div>
                    <div style={{fontSize:12,opacity:0.8,marginBottom:4}}>{alert.message}</div>
                    <div style={{fontSize:10,opacity:0.5}}>{new Date(alert.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
