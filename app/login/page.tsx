"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  function enter() {
    try {
      const cleanEmail = String(email || "member@vaultforge.local").trim().toLowerCase();
      localStorage.setItem("vaultforge_current_email", cleanEmail);
      localStorage.setItem("vaultforge_logged_in", "true");
    } catch {}

    window.location.href = "/command";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:24}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <h1>VaultForge Login</h1>
        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="Email"
          style={{padding:14,borderRadius:12,width:"100%",marginBottom:14}}
        />
        <button
          onClick={enter}
          style={{padding:"14px 22px",borderRadius:999,fontWeight:900}}
        >
          Enter Command
        </button>
      </div>
    </main>
  );
}
