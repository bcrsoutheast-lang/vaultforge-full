"use client";

import { useEffect, useState } from "react";

export default function Messages() {
  const [threads, setThreads] = useState<any[]>([]);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_messages");
    const allMsgs = stored? JSON.parse(stored) : [];
    
    // Get unique thread partners
    const partners = new Set<string>();
    allMsgs.forEach((m:any) => {
      if (m.from === currentEmail) partners.add(m.to);
      if (m.to === currentEmail) partners.add(m.from);
    });

    const threadList = Array.from(partners).map(email => {
      const threadMsgs = allMsgs.filter((m:any) => 
        (m.from === email && m.to === currentEmail) || (m.from === currentEmail && m.to === email)
      );
      const lastMsg = threadMsgs[threadMsgs.length - 1];
      return {
        email,
        lastMsg: lastMsg?.text || "",
        timestamp: lastMsg?.timestamp || 0
      };
    }).sort((a,b) => b.timestamp - a.timestamp);

    setThreads(threadList);
  }, [currentEmail]);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>MESSAGES</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Back to Dashboard</a>
        </div>

        {threads.length === 0? (
          <div style={{opacity:0.7}}>No messages yet. Click Message on any deal or pain to start a thread.</div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {threads.map((t:any) => (
              <button 
                key={t.email}
                onClick={()=>window.location.href=`/messages/${encodeURIComponent(t.email)}`}
                style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#0a0f1a",textAlign:"left"}}
              >
                <div style={{fontWeight:900,marginBottom:4}}>{t.email}</div>
                <div style={{opacity:0.7,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.lastMsg}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
