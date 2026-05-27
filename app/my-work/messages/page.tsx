"use client";

import { useEffect, useState, useRef } from "react";

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";
  const currentName = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_name") || "You" : "You";

  useEffect(() => {
    loadConversations();
    // Check URL for?to= param to auto-open thread
    const params = new URLSearchParams(window.location.search);
    const toEmail = params.get("to");
    if (toEmail) {
      openThread(toEmail);
    }
  }, [currentEmail]);

  useEffect(() => {
    if (activeThread) {
      loadMessages(activeThread);
    }
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function loadConversations() {
    const allMessages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const myMessages = allMessages.filter((m:any) => 
      m.from === currentEmail || m.to === currentEmail
    );
    
    // Group by thread - other party's email
    const threads: {[key: string]: any} = {};
    myMessages.forEach((m:any) => {
      const otherParty = m.from === currentEmail? m.to : m.from;
      if (!threads[otherParty]) {
        threads[otherParty] = {
          email: otherParty,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      threads[otherParty].messages.push(m);
      if (!threads[otherParty].lastMessage || m.timestamp > threads[otherParty].lastMessage.timestamp) {
        threads[otherParty].lastMessage = m;
      }
      if (m.to === currentEmail &&!m.read) {
        threads[otherParty].unreadCount++;
      }
    });
    
    const threadsArray = Object.values(threads).sort((a:any,b:any) => 
      (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
    );
    setConversations(threadsArray);
  }

  function loadMessages(threadEmail: string) {
    const allMessages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const threadMessages = allMessages.filter((m:any) => 
      (m.from === currentEmail && m.to === threadEmail) ||
      (m.from === threadEmail && m.to === currentEmail)
    ).sort((a:any,b:any) => a.timestamp - b.timestamp);
    
    // Mark as read
    const updatedMessages = allMessages.map((m:any) => {
      if (m.from === threadEmail && m.to === currentEmail &&!m.read) {
        return {...m, read: true};
      }
      return m;
    });
    localStorage.setItem("vaultforge_messages", JSON.stringify(updatedMessages));
    
    setMessages(threadMessages);
    loadConversations(); // Refresh unread counts
  }

  function sendMessage() {
    if (!newMessage.trim() ||!activeThread) return;
    
    const allMessages = JSON.parse(localStorage.getItem("vaultforge_messages") || "[]");
    const message = {
      id: Date.now() + Math.random(),
      from: currentEmail,
      fromName: currentName,
      to: activeThread,
      body: newMessage.trim(),
      timestamp: Date.now(),
      read: false
    };
    
    allMessages.push(message);
    localStorage.setItem("vaultforge_messages", JSON.stringify(allMessages));
    setNewMessage("");
    loadMessages(activeThread);
  }

  function startNewConversation() {
    if (!searchEmail.trim() || searchEmail === currentEmail) return;
    openThread(searchEmail.trim());
    setSearchEmail("");
  }

  function openThread(email: string) {
    setActiveThread(email);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function formatTime(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",display:"flex"}}>
      {/* Left Sidebar - Conversations */}
      <div style={{width:320,borderRight:"1px solid #333",display:"flex",flexDirection:"column",background:"#0a0f1a"}}>
        <div style={{padding:16,borderBottom:"1px solid #333"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h1 style={{color:"#FFD700",fontWeight:900,fontSize:20}}>MESSAGES</h1>
            <button onClick={()=>window.location.href="/my-work"} style={{padding:"6px 12px",border:"1px solid #FFD700",borderRadius:6,color:"#FFD700",background:"none",fontSize:11}}>← Back</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input 
              value={searchEmail}
              onChange={e=>setSearchEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && startNewConversation()}
              placeholder="Start chat with email..."
              style={{flex:1,padding:"8px 12px",borderRadius:6,background:"#05070d",border:"1px solid #333",color:"#fff",fontSize:12}}
            />
            <button onClick={startNewConversation} style={{padding:"8px 12px",borderRadius:6,background:"#FFD700",color:"#000",border:"none",fontSize:12,fontWeight:900}}>New</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {conversations.length === 0? (
            <div style={{textAlign:"center",padding:40,opacity:0.5,fontSize:12}}>
              No conversations yet.
              <div style={{marginTop:8}}>Start one from Deal Opportunities or Pain Room.</div>
            </div>
          ) : (
            conversations.map((thread:any) => (
              <div 
                key={thread.email}
                onClick={()=>openThread(thread.email)}
                style={{
                  padding:16,
                  borderBottom:"1px solid #1a1f2a",
                  cursor:"pointer",
                  background:activeThread === thread.email?"#1a1f2a" : "transparent",
                  transition:"background 0.2s"
                }}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1f2a"}
                onMouseLeave={e=>e.currentTarget.style.background=activeThread === thread.email?"#1a1f2a":"transparent"}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
                  <div style={{fontWeight:900,fontSize:14}}>{thread.email}</div>
                  {thread.unreadCount > 0 && (
                    <div style={{background:"#ff4444",color:"#fff",borderRadius:999,padding:"2px 6px",fontSize:10,fontWeight:900}}>
                      {thread.unreadCount}
                    </div>
                  )}
                </div>
                <div style={{fontSize:12,opacity:0.7,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {thread.lastMessage?.body || "No messages yet"}
                </div>
                <div style={{fontSize:10,opacity:0.5,marginTop:4}}>
                  {thread.lastMessage? formatTime(thread.lastMessage.timestamp) : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right - Active Thread */}
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        {!activeThread? (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",opacity:0.5}}>
            <div style={{fontSize:48,marginBottom:16}}>💬</div>
            <div style={{fontSize:16,fontWeight:900}}>Select a conversation</div>
            <div style={{fontSize:12,marginTop:8}}>Professional DMs between VaultForge members</div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div style={{padding:16,borderBottom:"1px solid #333",background:"#0a0f1a"}}>
              <div style={{fontWeight:900,fontSize:16}}>{activeThread}</div>
              <div style={{fontSize:11,opacity:0.7,marginTop:2}}>VaultForge Member</div>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
              {messages.map((m:any) => {
                const isMe = m.from === currentEmail;
                return (
                  <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start"}}>
                    <div style={{
                      maxWidth:"70%",
                      padding:"10px 14px",
                      borderRadius:12,
                      background:isMe?"#FFD700":"#1a1f2a",
                      color:isMe?"#000":"#fff",
                      border:isMe?"none":"1px solid #333"
                    }}>
                      <div style={{fontSize:14,lineHeight:1.4}}>{m.body}</div>
                      <div style={{fontSize:10,opacity:0.6,marginTop:4,textAlign:"right"}}>
                        {formatTime(m.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{padding:16,borderTop:"1px solid #333",background:"#0a0f1a"}}>
              <div style={{display:"flex",gap:8}}>
                <input 
                  value={newMessage}
                  onChange={e=>setNewMessage(e.target.value)}
                  onKeyDown={e=>e.key==="Enter" &&!e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Type a message..."
                  style={{flex:1,padding:"12px 16px",borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",fontSize:14}}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding:"12px 24px",
                    borderRadius:8,
                    background:newMessage.trim()?"#FFD700":"#333",
                    color:newMessage.trim()?"#000":"#666",
                    border:"none",
                    fontWeight:900,
                    cursor:newMessage.trim()?"pointer":"not-allowed"
                  }}
                >
                  Send
                </button>
              </div>
              <div style={{fontSize:10,opacity:0.5,marginTop:8}}>
                Professional communication only. Keep it about deals, pains, and business.
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
