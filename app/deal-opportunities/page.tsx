"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Deal = {
  id: number;
  title: string;
  state: string;
  property_type: string;
  deal_type: string;
  ask_price: number;
  arv: number;
  repair: number;
  description: string;
  posted_by: string;
  created_at: string;
  vaultforge_analysis: any;
};

export default function DealOpportunities() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ state: "", type: "" });

  useEffect(() => {
    loadDeals();
  }, [filter]);

  async function loadDeals() {
    setLoading(true);
    try {
      let query = supabase
       .from("deals")
       .select("*")
       .eq("status", "active")
       .order("created_at", { ascending: false });

      if (filter.state) query = query.eq("state", filter.state);
      if (filter.type) query = query.eq("property_type", filter.type);

      const { data, error } = await query;
      if (error) throw error;
      setDeals(data || []);
    } catch (err) {
      console.error("Error loading deals:", err);
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "#00ff88";
    if (score >= 60) return "#FFD700";
    return "#ff4444";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900,fontSize:28,marginBottom:4}}>DEAL OPPORTUNITIES</h1>
            <div style={{fontSize:12,opacity:0.7}}>Live deals routed by VaultForge AI</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{background:"none",border:"1px solid #FFD700",color:"#FFD700",padding:"8px 16px",borderRadius:8,cursor:"pointer"}}>
            My Work
          </button>
        </div>

        <div style={{display:"flex",gap:12,marginBottom:24}}>
          <select value={filter.state} onChange={e=>setFilter({...filter,state:e.target.value})} style={{padding:10,background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:8,color:"#fff"}}>
            <option value="">All States</option>
            <option value="GA">Georgia</option>
            <option value="FL">Florida</option>
            <option value="TX">Texas</option>
            <option value="NC">North Carolina</option>
          </select>
          <select value={filter.type} onChange={e=>setFilter({...filter,type:e.target.value})} style={{padding:10,background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:8,color:"#fff"}}>
            <option value="">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Land">Land</option>
            <option value="Multi-Family">Multi-Family</option>
          </select>
        </div>

        {loading? (
          <div style={{textAlign:"center",padding:40,opacity:0.5}}>Loading deals...</div>
        ) : deals.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.5}}>No deals found. Check back soon.</div>
        ) : (
          <div style={{display:"grid",gap:16}}>
            {deals.map(deal => {
              const analysis = deal.vaultforge_analysis || {};
              const profit = analysis.profit || 0;
              const score = analysis.score || 0;
              
              return (
                <div key={deal.id} style={{background:"#0a0f1a",border:"1px solid #FFD700",borderRadius:12,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>{deal.title}</div>
                      <div style={{fontSize:12,opacity:0.7}}>{deal.state} • {deal.property_type} • {deal.deal_type}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:24,fontWeight:900,color:getScoreColor(score)}}>{score}</div>
                      <div style={{fontSize:10,opacity:0.7}}>AI SCORE</div>
                    </div>
                  </div>
                  
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12,fontSize:14}}>
                    <div>
                      <div style={{opacity:0.7,fontSize:11}}>ASK</div>
                      <div style={{fontWeight:700}}>${deal.ask_price.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{opacity:0.7,fontSize:11}}>ARV</div>
                      <div style={{fontWeight:700}}>${deal.arv.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{opacity:0.7,fontSize:11}}>REPAIR</div>
                      <div style={{fontWeight:700}}>${deal.repair.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{opacity:0.7,fontSize:11}}>PROFIT</div>
                      <div style={{fontWeight:700,color:"#00ff88"}}>${profit.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{fontSize:13,opacity:0.8,marginBottom:12,lineHeight:1.5}}>{deal.description}</div>
                  
                  {analysis.flags && analysis.flags.length > 0 && (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                      {analysis.flags.map((flag: string) => (
                        <span key={flag} style={{fontSize:10,background:"#FFD700",color:"#000",padding:"4px 8px",borderRadius:4,fontWeight:700}}>
                          {flag.replace(/_/g," ")}
                        </span>
                      ))}
                    </div>
                  )}

                  <button style={{width:"100%",padding:12,background:"#FFD700",color:"#000",border:"none",borderRadius:8,fontWeight:900,cursor:"pointer"}}>
                    VIEW DEAL + CONTACT SELLER
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
