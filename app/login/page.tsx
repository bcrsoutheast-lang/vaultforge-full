"use client";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");

  async function login() {
    await fetch("/api/member/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    window.location.href = "/dashboard";
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={login}>Login</button>
    </div>
  );
}
