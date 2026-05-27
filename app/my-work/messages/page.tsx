"use client";

import { useEffect, useState, useRef } from "react";

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";
  const currentName = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_name") || "You" : "You";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    if (to) {
      setActiveThread(to);
    }
    loadConversations();
  }, [currentEmail]);

  useEffect(() => {
    if (activeThread) {
      loadMessages(activeThread);
    }
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function loadConversations() {
    const allMessages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const myMessages = allMessages.filter((m:any) => m.from === currentEmail || m.to === currentEmail);
    
    const threads: any = {};
    myMessages.forEach((m:any) => {
      const otherParty = m.from === currentEmail? m.to : m.from;
      if (!threads[otherParty]) {
        threads[otherParty] = {
          email: otherParty,
          messages: [],
          lastMessage: null,
          unread: 0
        };
      }
      threads[otherParty].messages.push(m);
      if (!m.read && m.to === currentEmail) {
        threads[otherParty].unread++;
      }
    });

    const convoArray = Object.values(threads).map((t:any) => {
      t.lastMessage = t.messages[t.messages.length - 1];
      return t;
    }).sort((a:any,b:any) => b.lastMessage.createdAt - a.lastMessage.createdAt);

    setConversations(convoArray);
  }

  function loadMessages(threadEmail: string) {
    const allMessages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const threadMessages = allMessages.filter((m:any) => 
      (m.from === currentEmail && m.to === threadEmail) ||
      (m.from === threadEmail && m.to === currentEmail)
    ).sort((a:any,b:any) => a.createdAt - b.createdAt);

    // Mark as read
    const updated = allMessages.map((m:any) => {
      if (m.to === currentEmail && m.from === threadEmail &&!m.read) {
        return {...m, read: true};
      }
      return m;
    });
    localStorage.setItem("vaultforge_messages", JSON.stringify(updated));

    setMessages(threadMessages);
    loadConversations();
  }

  function handleSendMessage() {
    if (!newMessage.trim() ||!activeThread) return;

    const allMessages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const newMsg = {
      id: Date.now(),
      from: currentEmail,
      fromName: currentName,
      to: activeThread,
      body: newMessage,
      createdAt: Date.now(),
      read: false
    };

    allMessages.push(newMsg);
    localStorage.setItem("vaultforge_messages", JSON.stringify(allMessages));
    setNewMessage("");
    loadMessages(activeThread);
  }

  function getMemberName(email: string) {
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const profile = profiles.find((p:any) => p.email === email);
    return profile?.name || email.split("@")[0];
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1400,margin:"0 auto",height:"calc(100vh - 32px)",display:"flex",flexDirection:"column"}}>
        <div style={{textAlign:"center",marginBottom:16,padding:"20px 0",borderBottom:"2px solid #FF00FF"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FF00FF)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FF00FF",fontWeight:900,fontSize:24,letterSpacing:1}}>MESSAGES</h1>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{display:"flex",gap:16,flex:1,minHeight:0}}>
          {/* CONVERSATIONS LIST */}
          <div style={{width:320,border:"1px solid #333",borderRadius:12,background:"#0a0f1a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:12,borderBottom:"1px solid #333",fontSize:12,fontWeight:900,opacity:0.7}}>
              CONVERSATIONS ({conversations.length})
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {conversations.length === 0? (
                <div style={{padding:40,textAlign:"center",opacity:0.5,fontSize:12}}>
                  No messages yet
                </div>
              ) : conversations.map((convo:any) => (
                <button
                  key={convo.email}
                  onClick={()=>setActiveThread(convo.email)}
                  style={{
                    width:"100%",
                    padding:12,
                    border:"none",
                    borderBottom:"1px solid #1a1f2a",
                    background: activeThread === convo.email? "#1a1f2a" : "transparent",
                    color:"#fff",
                    textAlign:"left",
                    cursor:"pointer"
                  }}
                >
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
                    <div style={{fontWeight:900,fontSize:14}}>{getMemberName(convo.email)}</div>
                    {convo.unread > 0 && (
                      <div style={{background:"#ff4444",color:"#fff",borderRadius:999,padding:"2px 6px",fontSize:10,fontWeight:900}}>
                        {convo.unread}
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:11,opacity:0.6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {convo.lastMessage.body}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGE THREAD */}
          <div style={{flex:1,border:"1px solid #333",borderRadius:12,background:"#0a0f1a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {!activeThread? (
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",opacity:0.5}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:16}}>💬</div>
                  <div style={{fontSize:14}}>Select a conversation</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{padding:12,borderBottom:"1px solid #333",fontWeight:900,fontSize:14}}>
                  {getMemberName(activeThread)}
                </div>
                <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
                  {messages.map((msg:any) => (
                    <div key={msg.id} style={{display:"flex",justifyContent: msg.from === currentEmail? "flex-end" : "flex-start"}}>
                      <div style={{
                        maxWidth:"70%",
                        padding:"10px 14px",
                        borderRadius:12,
                        background: msg.from === currentEmail? "#FFD700" : "#1a1f2a",
                        color: msg.from === currentEmail? "#000" : "#fff",
                        fontSize:14,
                        wordWrap:"break-word"
                      }}>
                        <div style={{fontSize:10,opacity:0.7,marginBottom:4}}>{msg.fromName}</div>
                        {msg.body}
                        <div style={{fontSize:9,opacity:0.5,marginTop:4,textAlign:"right"}}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{padding:12,borderTop:"1px solid #333",display:"flex",gap:8}}>
                  <input 
                    value={newMessage}
                    onChange={e=>setNewMessage(e.target.value)}
                    onKeyDown={e=>e.key==="Enter" && handleSendMessage()}
                    placeholder="Type message..."
                    style={{flex:1,padding:"10px 14px",borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",fontSize:14}}
                  />
                  <button 
                    onClick={handleSendMessage}
                    style={{padding:"10px 20px",borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontWeight:900,fontSize:14}}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
