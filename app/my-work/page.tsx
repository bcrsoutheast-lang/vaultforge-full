"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  email: string;
  company_name?: string;
  company_logo_url?: string;
};

export default function MyWork() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("vaultforge_current_email");
    if (!storedEmail) {
      window.location.href = "/login";
      return;
    }
    setEmail(storedEmail);
    fetchProfile(storedEmail);
  }, []);

  async function fetchProfile(userEmail: string) {
    const { data } = await supabase
      .from("profiles")
      .select("email, company_name, company_logo_url")
      .eq("email", userEmail)
      .single();
    
    if (data) setProfile(data);
  }

  function handleLogout() {
    localStorage.removeItem("vaultforge_current_email");
    window.location.href = "/login";
  }

  if (!email) return null;

  const buttonStyle = {
    padding: 16,
    background: "#0a0f1a",
    border: "1px solid #333",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left" as const
  };

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff"}}>
      {/* LOGGED IN HEADER */}
      <div style={{
        background: "#0a0f1a",
        borderBottom: "1px solid #FFD700",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {profile?.company_logo_url ? (
            <img 
              src={profile.company_logo_url} 
              alt="Company Logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #FFD700"
              }}
            />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#FFD700",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 18,
              border: "2px solid #FFD700"
            }}>
              {email.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 16 }}>
              {profile?.company_name || "VAULTFORGE MEMBER"}
            </div>
            <div style={{ color: "#666", fontSize: 12 }}>
              {email}
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: "none",
            border: "1px solid #FFD700",
            color: "#FFD700",
            padding: "6px 16px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700
          }}
        >
          Logout
        </button>
      </div>

      {/* MY WORK DASHBOARD */}
      <div style={{padding:16}}>
        <h1 style={{color:"#FFD700",fontWeight:900,fontSize:28,marginBottom:24}}>MY WORK</h1>
        
        {/* POST BUTTONS */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
          <button 
            onClick={()=>window.location.href="/my-work/deal-room"}
            style={{
              padding:20,
              background:"#0a0f1a",
              border:"2px solid #FFD700",
              borderRadius:12,
              color:"#FFD700",
              fontWeight:900,
              fontSize:16,
              cursor:"pointer"
            }}
          >
            POST DEAL
          </button>
          <button 
            onClick={()=>window.location.href="/my-work/pain-intake"}
            style={{
              padding:20,
              background:"#0a0f1a",
              border:"2px solid #00ccff",
              borderRadius:12,
              color:"#00ccff",
              fontWeight:900,
              fontSize:16,
              cursor:"pointer"
            }}
          >
            POST PAIN
          </button>
        </div>

        {/* DASHBOARD SECTIONS */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <button onClick={()=>window.location.href="/my-work/notifications"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>🔔 Notifications</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>New matches from AI routing</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/deals/drafts"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>💰 My Deals</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>Active, pending, closed deals</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/jobs/assigned"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>🔧 My Jobs</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>Assigned pains & completed work</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/alerts"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>⚡ My Alerts</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>Set buy boxes & contractor filters</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/earnings"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>📊 Earnings</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>Commission & job payouts</div>
          </button>

          <button onClick={()=>window.location.href="/my-work/analytics"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>📈 Analytics</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>AI scores, win rates, response time</div>
          </button>

          <button onClick={()=>window.location.href="/settings/profile"} style={buttonStyle}>
            <div style={{fontSize:16,fontWeight:900}}>⚙️ Settings</div>
            <div style={{fontSize:12,opacity:0.6,marginTop:4}}>Company logo, info, preferences</div>
          </button>
        </div>
      </div>
    </main>
  );
}
