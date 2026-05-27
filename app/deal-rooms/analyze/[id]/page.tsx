"use client";

import { useEffect, useState } from "react";

export default function AnalyzeDeal({ params }: { params: { id: string } }) {
  const dealId = Number(params.id);
  const [deal, setDeal] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("vaultforge_deals");
    const deals = stored? JSON.parse(stored) : [];
    const found = deals.find((d:any) => d.id === dealId);
    setDeal(found);
    
    if (found) {
      runAnalysis(found);
    }
    setLoading(false);
  }, [dealId]);

  function runAnalysis(d: any) {
    // VaultForge Intelligence Engine - v1 logic
    let riskScore = 50;
    let riskLevel = "Medium";
    let flags: string[] = [];
    let insights: string[] = [];
    
    // Risk scoring based on type
    if (d.type === "Residential") {
      const beds = Number(d.residential?.beds) || 0;
      const baths = Number(d.residential?.baths) || 0;
      const sqft = Number(d.residential?.sqft) || 0;
      const year = Number(d.residential?.yearBuilt) || 0;
      
      if (year && year < 1980) {
        riskScore += 15;
        flags.push("Pre-1980 build: check for lead/asbestos");
      }
      if (sqft && beds && sqft/beds < 200) {
        riskScore += 10;
        flags.push("Tight sqft/bedroom ratio");
      }
      if (baths === 1 && beds >= 3) {
        riskScore += 10;
        flags.push("Under-bathed for bedroom count");
      }
      if (sqft > 2500 && year > 2000) {
        riskScore -= 15;
        insights.push("Newer large home: strong resale pool");
      }
      
    } else if (d.type === "Commercial") {
      const units = Number(d.commercial?.units) || 0;
      const noi = Number(d.commercial?.noi) || 0;
      const cap = Number(d.commercial?.capRate) || 0;
      const sqft = Number(d.commercial?.buildingSqft) || 0;
      
      if (cap < 5) {
        riskScore += 20;
        flags.push("Sub-5% cap: thin margin, rate sensitive");
      }
      if (cap > 8) {
        riskScore -= 10;
        insights.push("Above-market cap: value opportunity or distress");
      }
      if (units > 0 && noi/units < 4000) {
        riskScore += 15;
        flags.push("Low NOI/unit: verify expense load");
      }
      if (sqft > 20000 && units < 10) {
        riskScore += 10;
        flags.push("Large footprint, low unit density: check occupancy");
      }
      
    } else if (d.type === "Land") {
      const acres = Number(d.land?.acres) || 0;
      const zoning = d.land?.zoning || "";
      const utilities = d.land?.utilities || "";
      
      if (!utilities || utilities.toLowerCase().includes("none")) {
        riskScore += 25;
        flags.push("No utilities: add $30k-80k for development");
      }
      if (zoning.toLowerCase().includes("ag") || zoning.toLowerCase().includes("farm")) {
        riskScore += 15;
        flags.push("Ag zoning: rezoning timeline 6-18 months");
      }
      if (acres > 50) {
        riskScore -= 10;
        insights.push("Large parcel: subdivision or assemblage play");
      }
    }

    // Owner info check
    if (!d.ownerInfo?.phone &&!d.ownerInfo?.email) {
      riskScore += 20;
      flags.push("No direct owner contact: deal control risk");
    }

    // Photo check
    if (!d.photos || d.photos.length === 0) {
      riskScore += 10;
      flags.push("No photos: sight-unseen risk");
    } else if (d.photos.length >= 5) {
      riskScore -= 5;
      insights.push("Photo coverage strong");
    }

    // Normalize risk score
    riskScore = Math.max(0, Math.min(100, riskScore));
    if (riskScore >= 70) riskLevel = "High";
    else if (riskScore >= 40) riskLevel = "Medium";
    else riskLevel = "Low";

    // ARV/Valuation estimates
    let arvLow = 0;
    let arvHigh = 0;
    let roiLow = 0;
    let roiHigh = 0;
    
    if (d.type === "Residential") {
      const sqft = Number(d.residential?.sqft) || 1500;
      const stateMult: Record<string, number> = {GA: 150, FL: 180, TN: 140, AL: 120, NC: 160, SC: 155, TX: 165};
      const ppsf = stateMult[d.state] || 150;
      arvLow = Math.round(sqft * ppsf * 0.85);
      arvHigh = Math.round(sqft * ppsf * 1.15);
      roiLow = 8;
      roiHigh = 18;
    } else if (d.type === "Commercial") {
      const noi = Number(d.commercial?.noi) || 50000;
      arvLow = Math.round(noi / 0.08);
      arvHigh = Math.round(noi / 0.06);
      roiLow = 6;
      roiHigh = 14;
    } else if (d.type === "Land") {
      const acres = Number(d.land?.acres) || 1;
      const statePerAcre: Record<string, number> = {GA: 8000, FL: 12000, TN: 7000, AL: 5000, NC: 9000, SC: 8500, TX: 10000};
      const perAcre = statePerAcre[d.state] || 8000;
      arvLow = Math.round(acres * perAcre * 0.7);
      arvHigh = Math.round(acres * perAcre * 1.3);
      roiLow = 15;
      roiHigh = 40;
    }

    setAnalysis({
      riskScore,
      riskLevel,
      flags,
      insights,
      arvLow,
      arvHigh,
      roiLow,
      roiHigh,
      comps: `3 recent ${d.type} sales in ${d.state} pending API`,
      recommendation: riskScore < 40? "Strong Buy" : riskScore < 70? "Proceed with Diligence" : "High Risk - Pass or Renegotiate"
    });
  }

  if (loading) return <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>Loading...</main>;
  if (!deal) return <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>Deal not found</main>;

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900,marginBottom:4}}>VAULTFORGE INTELLIGENCE</h1>
            <div style={{opacity:0.7}}>Analysis for: {deal.title}</div>
          </div>
          <a href={`/deal-rooms/${deal.state.toLowerCase()}`} style={{color:"#FFD700"}}>Back to {deal.state}</a>
        </div>

        {analysis && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
            
            {/* Risk Score Card */}
            <div style={{border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a"}}>
              <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>RISK ASSESSMENT</div>
              <div style={{fontSize:48,fontWeight:900,color:analysis.riskLevel==="Low"?"#00ff00":analysis.riskLevel==="Medium"?"#FFD700":"#ff4444"}}>
                {analysis.riskScore}
              </div>
              <div style={{fontWeight:900,fontSize:18,marginBottom:12}}>{analysis.riskLevel} Risk</div>
              <div style={{fontSize:14,opacity:0.8}}>{analysis.recommendation}</div>
            </div>

            {/* Valuation Card */}
            <div style={{border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a"}}>
              <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>ESTIMATED VALUE</div>
              <div style={{fontSize:32,fontWeight:900,color:"#FFD700",marginBottom:4}}>
                ${analysis.arvLow.toLocaleString()} - ${analysis.arvHigh.toLocaleString()}
              </div>
              <div style={{fontSize:14,opacity:0.7,marginBottom:12}}>Projected ARV Range</div>
              <div style={{fontSize:14}}>ROI: <span style={{color:"#FFD700",fontWeight:900}}>{analysis.roiLow}% - {analysis.roiHigh}%</span></div>
            </div>

            {/* Red Flags Card */}
            <div style={{border:"1px solid #ff4444",borderRadius:12,padding:20,background:"#0a0f1a"}}>
              <div style={{opacity:0.7,fontSize:12,marginBottom:8,color:"#ff4444"}}>RED FLAGS</div>
              {analysis.flags.length === 0? (
                <div style={{opacity:0.7}}>No major flags detected</div>
              ) : (
                <ul style={{margin:0,paddingLeft:16}}>
                  {analysis.flags.map((f:string,i:number) => (
                    <li key={i} style={{marginBottom:8,fontSize:14}}>{f}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Insights Card */}
            <div style={{border:"1px solid #00ff00",borderRadius:12,padding:20,background:"#0a0f1a"}}>
              <div style={{opacity:0.7,fontSize:12,marginBottom:8,color:"#00ff00"}}>POSITIVE SIGNALS</div>
              {analysis.insights.length === 0? (
                <div style={{opacity:0.7}}>No strong positives flagged</div>
              ) : (
                <ul style={{margin:0,paddingLeft:16}}>
                  {analysis.insights.map((ins:string,i:number) => (
                    <li key={i} style={{marginBottom:8,fontSize:14}}>{ins}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Comps Card */}
            <div style={{border:"1px solid #222",borderRadius:12,padding:20,background:"#0a0f1a",gridColumn:"1/-1"}}>
              <div style={{opacity:0.7,fontSize:12,marginBottom:8}}>MARKET COMPS</div>
              <div style={{fontSize:14}}>{analysis.comps}</div>
              <div style={{opacity:0.5,fontSize:11,marginTop:8}}>Live comps API integration coming next</div>
            </div>

          </div>
        )}

        <div style={{marginTop:24,padding:16,border:"1px solid #222",borderRadius:12,background:"#0a0f1a"}}>
          <div style={{fontWeight:900,marginBottom:8}}>Deal Summary</div>
          <div style={{opacity:0.7,fontSize:14}}>{deal.description || "No description provided"}</div>
          <div style={{marginTop:12,fontSize:12,opacity:0.5}}>
            Posted by: {deal.postedBy} | Type: {deal.type} | State: {deal.state}
          </div>
        </div>

      </div>
    </main>
  );
}
