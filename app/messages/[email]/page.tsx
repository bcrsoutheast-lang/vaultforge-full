"use client";

import { useEffect, useState, useRef } from "react";

export default function ChatThread({ params }: { params: { email: string } }) {
  const partnerEmail = decodeURIComponent(params.email);
  const [messages, setMessages] = useState<any[]>([]);
  const [newText, setNewText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    loadMessages();
  }, [partnerEmail, currentEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function loadMessages() {
    const stored = localStorage.getItem("vaultforge_messages");
    const allMsgs = stored? JSON.parse(stored) : [];
    const threadMsgs = allMsgs.filter((m:any) => 
      (m.from === partnerEmail && m.to === currentEmail) || 
      (m.from === currentEmail && m.to === partnerEmail)
    ).sort((a:any,b:any) => a.timestamp - b.timestamp);
    setMessages(threadMsgs);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function sendMessage() {
    if (!newText.trim()) return;
    
    const stored = localStorage.getItem("vaultforge_messages");
    const msgs = stored? JSON.parse(stored) : [];
    msgs.push({
      id: Date.now(),
      from: currentEmail,
      to: partnerEmail,
      text: newText.trim(),
      timestamp: Date.now()
    });
    localStorage.setItem("vaultforge_messages", JSON.stringify(msgs));
    setNewText("");
    loadMessages();
  }

  function handleKeyPress(e: any) {
    if (e.key === "Enter" &&!e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",display:"flex",flexDirection:"column"}}>
      <div style={{borderBottom:"1px solid #222",padding:16}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <a href="/messages" style={{color:"#FFD700",fontSize:12}}>← Back</a>
            <h1 style={{color:"#FFD700",fontWeight:900,marginTop:4}}>{partnerEmail}</h1>
          </div>
          <a href="/dashboard" style={{color:"#FFD700"}}>Dashboard</a>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          {messages.length === 0? (
            <div style={{opacity:0.7,textAlign:"center",marginTop:40}}>No messages yet. Send the first one.</div>
          ) : (
            <div style={{display:"grid",gap:12}}>
              {messages.map((m:any) => (
                <div key={m.id} style={{
                  display:"flex",
                  justifyContent: m.from === currentEmail? "flex-end" : "flex-start"
                }}>
                  <div style={{
                    maxWidth:"70%",
                    padding:"10px 14px",
                    borderRadius:12,
                    background: m.from === currentEmail? "#FFD700" : "#0a0f1a",
                    color: m.from === currentEmail? "#000" : "#fff",
                    border: m.from === currentEmail? "none" : "1px solid #222"
                  }}>
                    <div style={{fontSize:14,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.text}</div>
                    <div style={{fontSize:10,opacity:0.6,marginTop:4,textAlign:"right"}}>
                      {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div style={{borderTop:"1px solid #222",padding:16}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",gap:8}}>
          <textarea
            value={newText}
            onChange={e=>setNewText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex:1,
              padding:12,
              borderRadius:8,
              background:"#0a0f1a",
              border:"1px solid #222",
              color:"#fff",
              resize:"none"
            }}
          />
          <button
            onClick={sendMessage}
            style={{padding:"12px 24px",borderRadius:8,background:"#FFD700",color:"#000",fontWeight:900}}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
