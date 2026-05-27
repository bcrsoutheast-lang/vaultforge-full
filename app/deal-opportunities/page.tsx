'use client';
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DealOpportunities() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('deals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDeals(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
        <h1 style={{color:"#FFD700",fontWeight:"900",fontSize:"28px",margin:0}}>DEAL OPPORTUNITIES</h1>
        <a href="/my-work" style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:"6px",color:"#FFD700",textDecoration:"none",fontSize:"14px"}}>My Work</a>
      </div>

      {loading ? <p>Loading deals...</p> : deals.length === 0 ? <p>No deals found.</p> : (
        <div style={{display:"grid",gap:"16px"}}>
          {deals.map(d => (
            <div key={d.id} style={{background:"#0a0f1a",border:"2px solid #222",borderRadius:"12px",padding:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}>
                <h3 style={{color:"#FFD700",margin:0,fontSize:"18px",fontWeight:"800"}}>{d.title}</h3>
                <span style={{color:"#00ccff",fontWeight:"700"}}>${Number(d.asking_price).toLocaleString()}</span>
              </div>
              <p style={{color:"#999",fontSize:"14px",margin:"0 0 12px"}}>{d.city}, {d.state} • {d.beds}bd {d.baths}ba • {d.sqft} sqft</p>
              <p style={{fontSize:"14px",opacity:0.9,margin:"0 0 12px"}}>{d.description}</p>
              <p style={{fontSize:"12px",opacity:0.5}}>Posted by: {d.user_email}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
