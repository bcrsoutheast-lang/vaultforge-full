'use client';
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Debug() {
  const [deals, setDeals] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('deals').select('*');
      if (error) setError(error.message);
      else setDeals(data || []);
    }
    load();
  }, []);

  return (
    <main style={{padding:"20px",background:"#000",color:"#fff",minHeight:"100vh"}}>
      <h1>DEBUG: All Deals in DB</h1>
      {error && <p style={{color:"red"}}>Error: {error}</p>}
      <p>Total deals found: {deals.length}</p>
      <pre style={{background:"#111",padding:"16px",overflow:"auto"}}>
        {JSON.stringify(deals, null, 2)}
      </pre>
    </main>
  );
}
