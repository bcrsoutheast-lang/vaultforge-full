"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ViewPain() {
  const params = useParams();
  const [pain, setPain] = useState<any>(null);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_pains");
    const pains = stored? JSON.parse(stored) : [];
    const found = pains.find((p:any) => p.id === Number(params.id));
    setPain(found);
    
    // Mark as viewed - stops pulsing
    if (found) {
      const viewedStored = localStorage.getItem("vaultforge_pains_viewed");
      const viewed = viewedStored? JSON.parse(viewedStored) : [];
      if (!viewed.includes(found.id)) {
        viewed.push(found.id);
        localStorage.setItem("vaultforge_pains_viewed", JSON.stringify(viewed));
      }
    }
  }, [params.id]);

  function handleSave() {
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const updated = allPains.map((p:any) => {
      if (p.id === pain.id) {
        const saved = p.savedBy || [];
        if (!saved.includes(currentEmail)) {
          saved.push(currentEmail);
          alert("Saved to My Work → Saved Pains");
        }
        return {...p, savedBy: saved};
      }
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    window.location.reload();
  }

  function handleMarkResolved() {
    if (!confirm("Mark this pain point as resolved?")) return;
    const stored = localStorage.getItem("vaultforge_pains");
    const allPains = stored? JSON.parse(stored) : [];
    const updated = allPains.map((p:any) => {
      if (p.id === pain.id) return {...p, status: "resolved", resolvedAt: Date.now()};
      return p;
    });
    localStorage.setItem("vaultforge_pains", JSON.stringify(updated));
    alert("Pain resolved. Moved to My Work → Resolved");
    window.location.href = "/my-work";
  }

  if (!pain) return <div style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>Loading...</div>;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>PAIN INTELLIGENCE REPORT</h1>
            <div style={{fontSize:11,opacity:0.7}}>VaultForge DMAIC Analysis</div>
          </div>
          <button onClick={()=>window.location.href="/pain-rooms"} style={{padding:"8px 16px",border:"1px solid #ff4444",borderRadius:8,color:"#ff4444",background:"none"}}>✕ Escape</button>
        </div>

        {/* Signal Banner */}
        {pain.urgency?.includes("Critical") && (
          <div style={{background:"#ff4444",color:"#fff",padding:"8px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900,textAlign:"center"}}>
            ⚠️ CRITICAL URGENCY - IMMEDIATE ACTION REQUIRED ⚠️
          </div>
        )}

        <div style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontWeight:900,fontSize:24}}>{pain.title}</div>
            <div style={{fontSize:12,padding:"4px 12px",borderRadius:999,background:pain.urgency?.includes("Critical")?"#ff4444":"#222",color:pain.urgency?.includes("Critical")?"#fff":"#FFD700"}}>{pain.urgency}</div>
          </div>

          {/* Key Metrics */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:20}}>
            <div style={{textAlign:"center",padding:12,background:"#05070d",borderRadius:8}}>
              <div style={{fontSize:10,opacity:0.7}}>State</div>
              <div style={{fontWeight:900,color:"#FFD700"}}>{pain.state}</div>
            </div>
            <div style={{textAlign:"center",padding:12,background:"#05070d",borderRadius:8}}>
              <div style={{fontSize:10,opacity:0.7}}>Property</div>
              <div style={{fontWeight:900}}>{pain.propertyType}</div>
            </div>
            <div style={{textAlign:"center",padding:12,background:"#05070d",borderRadius:8}}>
              <div style={{fontSize:10,opacity:0.7}}>Pain Type</div>
              <div style={{fontWeight:900}}>{pain.painType}</div>
            </div>
            <div style={{textAlign:"center",padding:12,background:"#05070d",borderRadius:8}}>
              <div style={{fontSize:10,opacity:0.7}}>Impact</div>
              <div style={{fontWeight:900,color:"#ff4444"}}>{pain.impact}</div>
            </div>
          </div>

          {/* VaultForge AI Analysis */}
          {pain.aiAnalysis && (
            <div style={{border:"2px solid #FFD700",borderRadius:12,padding:16,background:"#05070d",marginBottom:20}}>
              <div style={{fontWeight:900,marginBottom:12,color:"#FFD700",fontSize:16}}>🧠 VAULTFORGE INTELLIGENCE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,opacity:0.7}}>Risk Score</div>
                  <div style={{fontWeight:900,fontSize:18,color:"#ff4444"}}>{pain.aiAnalysis.riskScore}</div>
                </div>
                <div>
                  <div style={{fontSize:10,opacity:0.7}}>Cost of Inaction</div>
                  <div style={{fontWeight:900,fontSize:14,color:"#ff4444"}}>{pain.aiAnalysis.costOfInaction}</div>
                </div>
              </div>
              <div style={{fontSize:12,marginBottom:8}}><strong>Root Cause:</strong> {pain.aiAnalysis.rootCause}</div>
              <div style={{fontSize:12,marginBottom:8}}><strong>Lean Waste:</strong> {pain.aiAnalysis.leanWaste}</div>
              <div style={{fontSize:12,background:"#0a0f1a",padding:12,borderRadius:8,border:"1px solid #FFD700"}}>
                <strong style={{color:"#FFD700"}}>NEXT STEP:</strong> {pain.aiAnalysis.nextStep}
              </div>
            </div>
          )}

          {/* DMAIC Breakdown */}
          <div style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#05070d",marginBottom:20}}>
            <div style={{fontWeight:900,marginBottom:16,color:"#FFD700"}}>DMAIC ANALYSIS</div>
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:900,fontSize:12,color:"#FFD700",marginBottom:4}}>DEFINE</div>
              <div style={{fontSize:12,opacity:0.9}}>{pain.define || "Not analyzed yet"}</div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:900,fontSize:12,color:"#FFD700",marginBottom:4}}>MEASURE</div>
              <div style={{fontSize:12,opacity:0.9}}>{pain.measure || "Not analyzed yet"}</div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:900,fontSize:12,color:"#FFD700",marginBottom:4}}>ANALYZE</div>
              <div style={{fontSize:12,opacity:0.9}}>{pain.analyze || "Not analyzed yet"}</div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:900,fontSize:12,color:"#FFD700",marginBottom:4}}>IMPROVE</div>
              <div style={{fontSize:12,opacity:0.9}}>{pain.improve || "Not analyzed yet"}</div>
            </div>
            <div>
              <div style={{fontWeight:900,fontSize:12,color:"#FFD700",marginBottom:4}}>CONTROL</div>
              <div style={{fontSize:12,opacity:0.9}}>{pain.control || "Not analyzed yet"}</div>
            </div>
          </div>

          {/* Team Contacts */}
          {(pain.contractorName || pain.inspectorName || pain.attorneyName) && (
            <div style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#05070d",marginBottom:20}}>
              <div style={{fontWeight:900,marginBottom:12,color:"#FFD700"}}>ASSIGNED TEAM</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,fontSize:12}}>
                {pain.contractorName && <div><strong>Contractor:</strong> {pain.contractorName}</div>}
                {pain.inspectorName && <div><strong>Inspector:</strong> {pain.inspectorName}</div>}
                {pain.attorneyName && <div><strong>Attorney:</strong> {pain.attorneyName}</div>}
              </div>
            </div>
          )}

          {/* Photos */}
          {pain.photos?.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontWeight:900,marginBottom:12,color:"#FFD700"}}>EVIDENCE PHOTOS ({pain.photos.length})</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
                {pain.photos.map((p:string,i:number) => <img key={i} src={p} style={{width:"100%",height:150,objectFit:"cover",borderRadius:8}} />)}
              </div>
            </div>
          )}

          {/* Posted By */}
          <div style={{fontWeight:900,marginBottom:8,color:"#FFD700"}}>POSTED BY</div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:12,background:"#05070d",borderRadius:8}}>
            {pain.posterProfile?.photo? <img src={pain.posterProfile.photo} style={{width:50,height:50,borderRadius:"50%",objectFit:"cover"}} /> : <div style={{width:50,height:50,borderRadius:"50%",background:"#222"}}></div>}
            <div>
              <div style={{fontWeight:900}}>{pain.posterProfile?.email || pain.postedBy}</div>
              <div style={{fontSize:11,opacity:0.7}}>Based: {pain.posterProfile?.based_state || "N/A"} | Serving: {(pain.posterProfile?.states_served || []).join(", ")}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={handleSave} style={{padding:"12px 24px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontWeight:900}}>Save to My Work</button>
            <button onClick={()=>window.location.href=`/messages/${encodeURIComponent(pain.postedBy)}`} style={{padding:"12px 24px",borderRadius:8,background:"#FFD700",color:"#000",fontWeight:900}}>Message Owner</button>
            {pain.postedBy === currentEmail && (
              <button onClick={handleMarkResolved} style={{padding:"12px 24px",borderRadius:8,background:"#00ff00",color:"#000",fontWeight:900}}>Mark Resolved</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
