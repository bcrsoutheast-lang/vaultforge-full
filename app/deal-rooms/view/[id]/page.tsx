"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ViewDeal() {
  const params = useParams();
  const [deal, setDeal] = useState<any>(null);
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals");
    const deals = stored? JSON.parse(stored) : [];
    const found = deals.find((d:any) => d.id === Number(params.id));
    setDeal(found);
    
    // Mark as viewed - stops pulsing
    if (found) {
      const viewedStored = localStorage.getItem("vaultforge_deals_viewed");
      const viewed = viewedStored? JSON.parse(viewedStored) : [];
      if (!viewed.includes(found.id)) {
        viewed.push(found.id);
        localStorage.setItem("vaultforge_deals_viewed", JSON.stringify(viewed));
      }
    }
  }, [params.id]);

  function handleSave() {
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const updated = allDeals.map((d:any) => {
      if (d.id === deal.id) {
        const saved = d.savedBy || [];
        if (!saved.includes(currentEmail)) {
          saved.push(currentEmail);
          alert("Saved to My Work → Saved Deals");
        }
        return {...d, savedBy: saved};
      }
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    window.location.reload();
  }

  function handleStatusChange(status: string) {
    if (!confirm(`Mark this deal as ${status}?`)) return;
    const stored = localStorage.getItem("vaultforge_deals");
    const allDeals = stored? JSON.parse(stored) : [];
    const updated = allDeals.map((d:any) => {
      if (d.id === deal.id) return {...d, status, statusUpdatedAt: Date.now()};
      return d;
    });
    localStorage.setItem("vaultforge_deals", JSON.stringify(updated));
    alert(`Deal marked ${status}. Moved to My Work → ${status}`);
    window.location.href = "/my-work";
  }

  if (!deal) return <div style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>Loading...</div>;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>DEAL ANALYSIS</h1>
            <div style={{fontSize:11,opacity:0.7}}>VaultForge Rating System</div>
          </div>
          <button onClick={()=>window.location.href="/deal-rooms"} style={{padding:"8px 16px",border:"1px solid #ff4444",borderRadius:8,color:"#ff4444",background:"none"}}>✕ Escape</button>
        </div>

        {/* Signal Banner for A+ Deals */}
        {deal.vaultForgeRating?.includes("A+") && (
          <div style={{background:"#00ff00",color:"#000",padding:"8px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900,textAlign:"center"}}>
            💰 VAULTFORGE CERTIFIED A+ DEAL - STRONG MARGINS 💰
          </div>
        )}

        <div style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontWeight:900,fontSize:24}}>{deal.title}</div>
            <div style={{fontSize:14,padding:"6px 16px",borderRadius:999,background:deal.vaultForgeRating?.includes("A")?"#00ff00":deal.vaultForgeRating?.includes("B")?"#FFD700":"#ff4444",color:"#000",fontWeight:900}}>{deal.vaultForgeRating || "Unrated"}</div>
          </div>

          {/* Money Metrics */}
          {deal.vaultForgeAnalysis && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              <div style={{textAlign:"center",padding:16,background:"#05070d",borderRadius:8,border:"1px solid #00ff00"}}>
                <div style={{fontSize:10,opacity:0.7}}>PROFIT</div>
                <div style={{fontWeight:900,fontSize:24,color:"#00ff00"}}>${deal.vaultForgeAnalysis.profit}</div>
              </div>
              <div style={{textAlign:"center",padding:16,background:"#05070d",borderRadius:8,border:"1px solid #FFD700"}}>
                <div style={{fontSize:10,opacity:0.7}}>ROI</div>
                <div style={{fontWeight:900,fontSize:24,color:"#FFD700"}}>{deal.vaultForgeAnalysis.roi}</div>
              </div>
              <div style={{textAlign:"center",padding:16,background:"#05070d",borderRadius:8,border:"1px solid #FFD700"}}>
                <div style={{fontSize:10,opacity:0.7}}>MARGIN</div>
                <div style={{fontWeight:900,fontSize:24,color:"#FFD700"}}>{deal.vaultForgeAnalysis.margin}</div>
              </div>
            </div>
          )}

          {/* Deal Specs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20,fontSize:14}}>
            <div><strong>State:</strong> {deal.state}</div>
            <div><strong>Property Type:</strong> {deal.propertyType}</div>
            <div><strong>Deal Type:</strong> {deal.dealType}</div>
            <div><strong>Exit Strategy:</strong> {deal.exitStrategy || "TBD"}</div>
            <div><strong>Ask Price:</strong> {deal.askPrice}</div>
            <div><strong>ARV:</strong> {deal.arv}</div>
            <div><strong>Repair Est:</strong> {deal.repairEst}</div>
            <div><strong>Address:</strong> {deal.address}</div>
          </div>

          {/* VaultForge Feedback */}
          {deal.vaultForgeAnalysis && (
            <div style={{border:"2px solid #FFD700",borderRadius:12,padding:16,background:"#05070d",marginBottom:20}}>
              <div style={{fontWeight:900,marginBottom:8,color:"#FFD700"}}>VAULTFORGE ANALYSIS</div>
              <div style={{fontSize:12,marginBottom:8}}><strong>Feedback:</strong> {deal.vaultForgeAnalysis.feedback}</div>
              <div style={{fontSize:12,background:"#0a0f1a",padding:12,borderRadius:8,border:"1px solid #FFD700"}}>
                <strong style={{color:"#FFD700"}}>NEXT STEP:</strong> {deal.vaultForgeAnalysis.nextStep}
              </div>
            </div>
          )}

          {/* Team Contacts */}
          <div style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#05070d",marginBottom:20}}>
            <div style={{fontWeight:900,marginBottom:12,color:"#FFD700"}}>DEAL TEAM</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,fontSize:12}}>
              {deal.buyerName && <div><strong>Buyer:</strong> {deal.buyerName}<br/><span style={{opacity:0.7}}>{deal.buyerPhone}</span></div>}
              {deal.lenderName && <div><strong>Lender:</strong> {deal.lenderName}</div>}
              {deal.attorneyName && <div><strong>Attorney:</strong> {deal.attorneyName}</div>}
              {deal.titleCompany && <div><strong>Title Co:</strong> {deal.titleCompany}</div>}
            </div>
          </div>

          {/* Description */}
          {deal.description && (
            <div style={{marginBottom:20}}>
              <div style={{fontWeight:900,marginBottom:8,color:"#FFD700"}}>NOTES</div>
              <div style={{fontSize:14,opacity:0.9,padding:12,background:"#05070d",borderRadius:8}}>{deal.description}</div>
            </div>
          )}

          {/* Photos */}
          {deal.photos?.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontWeight:900,marginBottom:12,color:"#FFD700"}}>PROPERTY PHOTOS ({deal.photos.length})</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
                {deal.photos.map((p:string,i:number) => <img key={i} src={p} style={{width:"100%",height:150,objectFit:"cover",borderRadius:8}} />)}
              </div>
            </div>
          )}

          {/* Posted By */}
          <div style={{fontWeight:900,marginBottom:8,color:"#FFD700"}}>POSTED BY</div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:12,background:"#05070d",borderRadius:8}}>
            {deal.posterProfile?.photo? <img src={deal.posterProfile.photo} style={{width:50,height:50,borderRadius:"50%",objectFit:"cover"}} /> : <div style={{width:50,height:50,borderRadius:"50%",background:"#222"}}></div>}
            <div>
              <div style={{fontWeight:900}}>{deal.posterProfile?.email || deal.postedBy}</div>
              <div style={{fontSize:11,opacity:0.7}}>Based: {deal.posterProfile?.based_state || "N/A"} | Serving: {(deal.posterProfile?.states_served || []).join(", ")}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={handleSave} style={{padding:"12px 24px",borderRadius:8,background:"#222",color:"#FFD700",border:"1px solid #FFD700",fontWeight:900}}>Save to My Work</button>
            <button onClick={()=>window.location.href=`/messages/${encodeURIComponent(deal.postedBy)}`} style={{padding:"12px 24px",borderRadius:8,background:"#FFD700",color:"#000",fontWeight:900}}>Message Owner</button>
            {deal.postedBy === currentEmail && (
              <>
                <button onClick={()=>handleStatusChange("under_contract")} style={{padding:"12px 24px",borderRadius:8,background:"#00ff00",color:"#000",fontWeight:900}}>Under Contract</button>
                <button onClick={()=>handleStatusChange("sold")} style={{padding:"12px 24px",borderRadius:8,background:"#00ff00",color:"#000",fontWeight:900}}>Mark Sold</button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
