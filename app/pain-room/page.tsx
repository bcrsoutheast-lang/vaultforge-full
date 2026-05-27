"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pain = {
  id: number;
  title: string;
  state: string;
  property_type: string;
  pain_type: string;
  urgency: string;
  budget: string;
  description: string;
  posted_by: string;
  created_at: string;
};

export default function PainRoom() {
  const [pains, setPains] = useState<Pain[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ state: "", type: "", urgency: "" });

  useEffect(() => {
    loadPains();
  }, [filter]);

  async function loadPains() {
    setLoading(true);
    try {
      let query = supabase
       .from("pains")
       .select("*")
       .eq("status", "active")
       .order("created_at", { ascending: false });

      if (filter.state) query = query.eq("state", filter.state);
      if (filter.type) query = query.eq("pain_type", filter.type);
      if (filter.urgency) query = query.eq("urgency", filter.urgency);

      const { data, error } = await query;
      if (error) throw error;
      setPains(data || []);
    } catch (err) {
      console.error("Error loading pains:", err);
    } finally {
      setLoading(false);
    }
  }

  function getUrgencyColor(urgency: string) {
    if (urgency === "emergency") return "#ff4444";
    if (urgency === "high") return "#ff8800";
    if (urgency === "medium") return "#00ccff";
    return "#888";
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{color:"#00ccff",fontWeight:900,fontSize:28,marginBottom:4}}>PAIN ROOM</h1>
            <div style={{fontSize:12,opacity:0.7}}>Live contractor jobs routed by VaultForge AI</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{background:"none",border:"1px solid #00ccff",color:"#00ccff",padding:"8px 16px",borderRadius:8,cursor:"pointer"}}>
            My Work
          </button>
        </div>

        <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
          <select value={filter.state} onChange={e=>setFilter({...filter,state:e.target.value})} style={{padding:10,background:"#0a0f1a",border:"1px solid #00ccff",borderRadius:8,color:"#fff"}}>
            <option value="">All States</option>
            <option value="GA">Georgia</option>
            <option value="FL">Florida</option>
            <option value="TX">Texas</option>
            <option value="NC">North Carolina</option>
          </select>
          <select value={filter.type} onChange={e=>setFilter({...filter,type:e.target.value})} style={{padding:10,background:"#0a0f1a",border:"1px solid #00ccff",borderRadius:8,color:"#fff"}}>
            <option value="">All Trades</option>
            <option value="HVAC">HVAC</option>
            <option value="Roof">Roof</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Foundation">Foundation</option>
          </select>
          <select value={filter.urgency} onChange={e=>setFilter({...filter,urgency:e.target.value})} style={{padding:10,background:"#0a0f1a",border:"1px solid #00ccff",borderRadius:8,color:"#fff"}}>
            <option value="">All Urgency</option>
            <option value="emergency">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {loading? (
          <div style={{textAlign:"center",padding:40,opacity:0.5}}>Loading jobs...</div>
        ) : pains.length === 0? (
          <div style={{textAlign:"center",padding:40,opacity:0.5}}>No jobs found. Check back soon.</div>
        ) : (
          <div style={{display:"grid",gap:16}}>
            {pains.map(pain => (
              <div key={pain.id} style={{background:"#0a0f1a",border:`1px solid ${getUrgencyColor(pain.urgency)}`,borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>{pain.title}</div>
                    <div style={{fontSize:12,opacity:0.7}}>{pain.state} • {pain.property_type} • {pain.pain_type}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:900,color:getUrgencyColor(pain.urgency),textTransform:"uppercase"}}>{pain.urgency}</div>
                    <div style={{fontSize:10,opacity:0.7}}>URGENCY</div>
                  </div>
                </div>
                
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:12,fontSize:14}}>
                  <div>
                    <div style={{opacity:0.7,fontSize:11}}>BUDGET</div>
                    <div style={{fontWeight:700}}>{pain.budget}</div>
                  </div>
                  <div>
                    <div style={{opacity:0.7,fontSize:11}}>POSTED</div>
                    <div style={{fontWeight:700}}>{new Date(pain.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{fontSize:13,opacity:0.8,marginBottom:12,lineHeight:1.5}}>{pain.description}</div>

                <button style={{width:"100%",padding:12,background:"#00ccff",color:"#000",border:"none",borderRadius:8,fontWeight:900,cursor:"pointer"}}>
                  CLAIM JOB + MESSAGE CLIENT
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
