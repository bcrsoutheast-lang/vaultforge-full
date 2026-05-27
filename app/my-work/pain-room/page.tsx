'use client';
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PainRoom() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Property
  const [propertyType, setPropertyType] = useState("Residential");
  const [city, setCity] = useState("");
  const [state, setState] = useState("GA");
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  
  // Pain Metrics
  const [occupancyStatus, setOccupancyStatus] = useState("Vacant");
  const [reasonForSelling, setReasonForSelling] = useState("");
  const [sellerMotivation, setSellerMotivation] = useState("5");
  const [monthsBehind, setMonthsBehind] = useState("");
  const [backTaxes, setBackTaxes] = useState("");
  const [lienAmount, setLienAmount] = useState("");
  const [codeViolations, setCodeViolations] = useState("");
  const [propertyCondition, setPropertyCondition] = useState("Fair");
  const [vacancyLength, setVacancyLength] = useState("");
  const [tenantIssues, setTenantIssues] = useState("");
  
  // Financial
  const [mortgageBalance, setMortgageBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [isForeclosure, setIsForeclosure] = useState(false);
  const [auctionDate, setAuctionDate] = useState("");
  
  const [description, setDescription] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setImages(files);
    }
  };

  const stripCommas = (val: string) => val.replace(/,/g, "");

  // AI Pain Analyzer - runs before submit
  function analyzePain(data: any) {
    let score = 0;
    const causes: string[] = [];
    const solutions: any[] = [];
    const steps: string[] = [];
    const exits: string[] = [];
    
    // Score calculation
    if (data.isForeclosure) { score += 30; causes.push("Active foreclosure"); }
    if (data.auction_date) { score += 25; causes.push("Auction date set"); }
    if (Number(data.monthsBehind) > 6) { score += 20; causes.push(`${data.monthsBehind} months behind`); }
    else if (Number(data.monthsBehind) > 3) { score += 10; causes.push(`${data.monthsBehind} months behind`); }
    if (Number(data.backTaxes) > 5000) { score += 15; causes.push(`$${data.backTaxes} back taxes`); }
    if (Number(data.lienAmount) > 0) { score += 10; causes.push(`$${data.lienAmount} in liens`); }
    if (data.occupancyStatus === "Vacant" && Number(data.vacancyLength) > 6) { score += 10; causes.push(`Vacant ${data.vacancyLength} months`); }
    if (data.propertyCondition === "Poor" || data.propertyCondition === "Uninhabitable") { score += 15; causes.push(`Property condition: ${data.propertyCondition}`); }
    if (Number(data.sellerMotivation) >= 8) { score += 10; causes.push("High seller motivation"); }
    
    const painLevel = score >= 70 ? "Critical" : score >= 50 ? "High" : score >= 30 ? "Medium" : "Low";
    
    // Problem Analysis
    let analysis = `Seller motivation level ${data.sellerMotivation}/10. `;
    if (data.isForeclosure) analysis += "Property is in foreclosure with limited time to act. ";
    if (causes.length > 0) analysis += `Key distress factors: ${causes.join(", ")}. `;
    
    // Solution Paths
    if (data.isForeclosure || Number(data.monthsBehind) > 3) {
      solutions.push({ strategy: "Subject To", urgency: "High", description: "Take over payments, stop foreclosure, seller walks with debt relief" });
      steps.push("Verify loan balance and arrearage with lender");
      steps.push("Get authorization to release info signed");
      exits.push("Subject To -> Lease Option");
    }
    
    if (Number(data.backTaxes) > 0) {
      solutions.push({ strategy: "Tax Negotiation", urgency: "Medium", description: "Pay back taxes at closing, negotiate payment plan" });
      steps.push("Pull tax certificate from county");
      exits.push("Wholesale to tax lien investor");
    }
    
    if (data.propertyCondition === "Poor" || data.propertyCondition === "Uninhabitable") {
      solutions.push({ strategy: "Wholesale As-Is", urgency: "Medium", description: "Market to rehabbers, no repairs needed" });
      steps.push("Get 3 contractor repair bids for credibility");
      exits.push("Assign to fix & flip buyer");
    }
    
    if (Number(data.sellerMotivation) >= 7 && !data.isForeclosure) {
      solutions.push({ strategy: "Seller Finance", urgency: "Low", description: "Structure terms, low/no money down, cash flow play" });
      steps.push("Run numbers on seller finance vs cash offer");
      exits.push("Wrap mortgage / Lease Option");
    }
    
    // Default steps
    if (steps.length === 0) steps.push("Run comps and confirm ARV");
    steps.push("Calculate MAO: ARV x 0.7 - Repairs - Your Fee");
    steps.push("Present 3 offers: Cash, Terms, Hybrid");
    
    const timeline = painLevel === "Critical" ? "7-14 Days" : painLevel === "High" ? "14-30 Days" : "30-60 Days";
    
    return {
      pain_score: score,
      pain_level: painLevel,
      ai_summary: analysis,
      root_causes: causes,
      problem_analysis: analysis,
      solution_paths: solutions,
      next_steps: steps,
      estimated_timeline: timeline,
      exit_strategies: exits.length > 0 ? exits : ["Wholesale", "Wholetail", "Novation"]
    };
  }

  async function submitPain() {
    if (!city || !description) {
      alert("City and Description required");
      return;
    }
    
    setLoading(true);
    setUploading(true);
    
    const email = localStorage.getItem("vaultforge_current_email");
    const imageUrls: string[] = [];
    
    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('vaultforge-pain-photos')
        .upload(fileName, file);
      
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('vaultforge-pain-photos')
          .getPublicUrl(data.path);
        imageUrls.push(publicUrl);
      }
    }
    setUploading(false);
    
    const formData = {
      property_type: propertyType, city, state, zipcode, address,
      occupancy_status: occupancyStatus,
      reason_for_selling: reasonForSelling,
      seller_motivation: Number(sellerMotivation),
      months_behind: monthsBehind ? Number(monthsBehind) : null,
      back_taxes: backTaxes ? Number(stripCommas(backTaxes)) : null,
      lien_amount: lienAmount ? Number(stripCommas(lienAmount)) : null,
      code_violations: codeViolations,
      property_condition: propertyCondition,
      vacancy_length_months: vacancyLength ? Number(vacancyLength) : null,
      tenant_issues: tenantIssues,
      mortgage_balance: mortgageBalance ? Number(stripCommas(mortgageBalance)) : null,
      monthly_payment: monthlyPayment ? Number(stripCommas(monthlyPayment)) : null,
      interest_rate: interestRate ? Number(interestRate) : null,
      is_foreclosure: isForeclosure,
      auction_date: auctionDate || null,
      description
    };
    
    const aiResults = analyzePain(formData);
    
    const payload = {
      post_type: "pain",
      user_email: email,
      ...formData,
      ...aiResults,
      image_urls: imageUrls
    };

    const res = await fetch("/api/route-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    setLoading(false);
    if (res.ok) {
      window.location.href = "/my-work";
    } else {
      const data = await res.json();
      alert("Error: " + (data.error || "Failed to save"));
    }
  }

  const input = {width:"100%",padding:"12px",background:"#0a0f1a",border:"2px solid #FF6B6B",borderRadius:"8px",color:"#fff",fontSize:"15px",marginBottom:"14px"};
  const label = {color:"#FF6B6B",fontSize:"11px",fontWeight:"700",marginBottom:"4px",display:"block",letterSpacing:"0.5px"};
  const section = {borderTop:"1px solid #222",paddingTop:"20px",marginTop:"20px"};
  const sectionTitle = {color:"#FFB86C",fontSize:"14px",fontWeight:"800",marginBottom:"16px"};

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:"16px"}}>
      <a href="/my-work" style={{color:"#00ccff",fontSize:"14px"}}>← Back to My Work</a>
      <h1 style={{color:"#FF6B6B",fontWeight:"900",fontSize:"28px",margin:"16px 0 8px"}}>LOG PAIN POINT</h1>
      <p style={{opacity:0.7,fontSize:"14px",marginBottom:"24px"}}>AI analyzes distress level and generates solution paths instantly</p>
      
      <div style={{maxWidth:"700px"}}>
        <label style={label}>PROPERTY TYPE *</label>
        <select style={{...input,background:"#1a0a0a"}} value={propertyType} onChange={e=>setPropertyType(e.target.value)}>
          <option>Residential</option>
          <option>Commercial</option>
          <option>Land</option>
          <option>Multi-Family</option>
        </select>

        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"12px"}}>
          <div><label style={label}>CITY *</label><input style={input} value={city} onChange={e=>setCity(e.target.value)} placeholder="Atlanta" /></div>
          <div><label style={label}>STATE</label><select style={input} value={state} onChange={e=>setState(e.target.value)}><option>GA</option><option>FL</option><option>TX</option><option>CA</option><option>NY</option><option>AL</option><option>AZ</option><option>NC</option><option>SC</option><option>TN</option></select></div>
          <div><label style={label}>ZIP</label><input style={input} value={zipcode} onChange={e=>setZipcode(e.target.value)} placeholder="30303" /></div>
        </div>

        <label style={label}>PROPERTY ADDRESS</label>
        <input style={input} value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St" />

        <div style={section}>
          <div style={sectionTitle}>DISTRESS INDICATORS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <div><label style={label}>OCCUPANCY STATUS</label><select style={input} value={occupancyStatus} onChange={e=>setOccupancyStatus(e.target.value)}><option>Vacant</option><option>Owner Occupied</option><option>Tenant Occupied</option><option>Abandoned</option></select></div>
            <div><label style={label}>PROPERTY CONDITION</label><select style={input} value={propertyCondition} onChange={e=>setPropertyCondition(e.target.value)}><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Uninhabitable</option></select></div>
          </div>
          <label style={label}>REASON FOR SELLING</label>
          <input style={input} value={reasonForSelling} onChange={e=>setReasonForSelling(e.target.value)} placeholder="Foreclosure, Divorce, Job Loss, Inheritance" />
          <label style={label}>SELLER MOTIVATION 1-10</label>
          <input style={input} type="range" min="1" max="10" value={sellerMotivation} onChange={e=>setSellerMotivation(e.target.value)} />
          <div style={{textAlign:"center",color:"#FFB86C",fontWeight:"900",marginTop:"-10px",marginBottom:"14px"}}>{sellerMotivation}/10</div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>FINANCIAL DISTRESS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
            <div><label style={label}>MONTHS BEHIND</label><input style={input} type="text" inputMode="numeric" value={monthsBehind} onChange={e=>setMonthsBehind(e.target.value)} placeholder="6" /></div>
            <div><label style={label}>BACK TAXES</label><input style={input} type="text" inputMode="numeric" value={backTaxes} onChange={e=>setBackTaxes(e.target.value)} placeholder="8500" /></div>
            <div><label style={label}>LIEN AMOUNT</label><input style={input} type="text" inputMode="numeric" value={lienAmount} onChange={e=>setLienAmount(e.target.value)} placeholder="12000" /></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
            <div><label style={label}>MORTGAGE BALANCE</label><input style={input} type="text" inputMode="numeric" value={mortgageBalance} onChange={e=>setMortgageBalance(e.target.value)} placeholder="185000" /></div>
            <div><label style={label}>MONTHLY PAYMENT</label><input style={input} type="text" inputMode="numeric" value={monthlyPayment} onChange={e=>setMonthlyPayment(e.target.value)} placeholder="1250" /></div>
            <div><label style={label}>INTEREST RATE %</label><input style={input} type="text" inputMode="decimal" value={interestRate} onChange={e=>setInterestRate(e.target.value)} placeholder="7.5" /></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
            <input type="checkbox" checked={isForeclosure} onChange={e=>setIsForeclosure(e.target.checked)} style={{width:"20px",height:"20px"}} />
            <label style={{...label,marginBottom:"0"}}>FORECLOSURE ACTIVE</label>
            {isForeclosure && <input style={{...input,marginBottom:"0",width:"200px"}} type="date" value={auctionDate} onChange={e=>setAuctionDate(e.target.value)} />}
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>PROPERTY ISSUES</div>
          <label style={label}>CODE VIOLATIONS</label>
          <input style={input} value={codeViolations} onChange={e=>setCodeViolations(e.target.value)} placeholder="Roof, Electrical, Plumbing" />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <div><label style={label}>VACANCY LENGTH (MONTHS)</label><input style={input} type="text" inputMode="numeric" value={vacancyLength} onChange={e=>setVacancyLength(e.target.value)} placeholder="8" /></div>
            <div><label style={label}>TENANT ISSUES</label><input style={input} value={tenantIssues} onChange={e=>setTenantIssues(e.target.value)} placeholder="Non-payment, Eviction" /></div>
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>EVIDENCE PHOTOS</div>
          <label style={label}>UPLOAD UP TO 10 PHOTOS</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{...input,padding:"10px",border:"2px dashed #FF6B6B"}} />
          {images.length > 0 && <p style={{color:"#FFB86C",fontSize:"12px",marginTop:"-8px"}}>{images.length} image(s) selected</p>}
        </div>

        <div style={section}>
          <label style={label}>DETAILED DESCRIPTION *</label>
          <textarea style={{...input,height:"120px",resize:"none"}} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Full situation: timeline, seller quotes, other offers, deadlines..." />
        </div>

        <button onClick={submitPain} disabled={loading} style={{width:"100%",padding:"18px",background:loading?"#333":"#FF6B6B",color:"#000",fontWeight:"900",fontSize:"18px",borderRadius:"8px",border:"none",cursor:loading?"not-allowed":"pointer",marginTop:"8px"}}>
          {uploading ? "UPLOADING EVIDENCE..." : loading ? "ANALYZING PAIN..." : "LOG PAIN & GENERATE PLAN"}
        </button>
      </div>
    </main>
  );
}
