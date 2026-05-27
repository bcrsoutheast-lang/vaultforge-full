"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  email: string;
  company_name?: string;
  company_logo_url?: string;
};

export default function LoggedInHeader() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("vaultforge_current_email");
    if (!storedEmail) return;
    
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

  return (
    <div style={{
      background: "#0a0f1a",
      borderBottom: "1px solid #FFD700",
      padding: "8px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {profile?.company_logo_url ? (
          <img 
            src={profile.company_logo_url} 
            alt="Company Logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #FFD700"
            }}
          />
        ) : (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#FFD700",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 14
          }}>
            {email.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ color: "#FFD700", fontWeight: 700 }}>
            {profile?.company_name || email}
          </div>
          {profile?.company_name && (
            <div style={{ color: "#666", fontSize: 11 }}>
              {email}
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={handleLogout}
        style={{
          background: "none",
          border: "1px solid #FFD700",
          color: "#FFD700",
          padding: "4px 12px",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12
        }}
      >
        Logout
      </button>
    </div>
  );
}
