"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  email?: string;
  name?: string;
  userId?: string;
};

export default function VaultForgeRoomMessageLink({ email, name, userId }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      // 1. Use passed-in props first
      if (email || name) {
        setDisplayName(name || email?.split('@')[0] || "Owner");
        setDisplayEmail(email || "Email not listed");
        return;
      }

      // 2. Try Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setDisplayName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split('@')[0] ||
          "Owner"
        );
        setDisplayEmail(user.email);
        return;
      }

      // 3. Last resort - no hardcoded "VaultForge Member" bullshit
      setDisplayName("Owner");
      setDisplayEmail("Email not listed");
    }

    loadUser();
  }, [email, name, userId]);

  return (
    <div style={{
      border: "1px solid rgba(245, 200, 76,.22)",
      borderRadius: 20,
      padding: 16,
      background: "rgba(2, 6, 23,.6)",
    }}>
      <div style={{
        color: "#f5c84c",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}>
        MESSAGE RECIPIENT
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {displayName}
      </div>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>
        {displayEmail}
      </div>
    </div>
  );
}
