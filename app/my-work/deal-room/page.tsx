'use client';
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUYER_TYPES = [
  "Cash Buyer",
  "Fix & Flip Investor", 
  "Buy & Hold Investor",
  "End User",
  "Developer",
  "Landlord",
  "Airbnb Investor"
];

export default function DealRoom() {
  const [propertyType, setPropertyType] = useState("Residential");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [city, setCity] = useState("");
  const [state, setState] = useState("GA");
  const [address, setAddress] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [arv, setArv] = useState("");
  const [dealType, setDealType] = useState("Wholesale");
  const [description, setDescription] = useState("");
  
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [repairEstimate, setRepairEstimate] = useState("");
  
  const [units, setUnits] = useState("");
  const [capRate, setCapRate] = useState("");
  const [noi, setNoi] = useState("");
  const [tenantType, setTenantType] = useState("");
  
  const [acreage, setAcreage] = useState("");
  const [zoning, setZoning] = useState("");
  const [utilities, setUtilities] = useState("");
  
  const [targetBuyers, setTargetBuyers] = useState<string[]>(["Cash Buyer"]);
  const [minCashRequired, setMinCashRequired] = useState("");
  const [timeline, setTimeline] = useState("30 Days");
  const [assignmentFee, setAssignmentFee] = useState("");
  
  const [sellerFinancing, setSellerFinancing] = useState("No");
  const [existingMortgage, setExistingMortgage] = useState("No");
  const [mortgageBalance, setMortgageBalance] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setImages(files);
    }
  };

  const toggleBuyer = (buyer: string) => {
    setTargetBuyers(prev => 
      prev.includes(buyer) 
        ? prev.filter(b => b !== buyer)
        : [...prev, buyer]
    );
  };

  const stripCommas = (val: string) => val.replace(/,/g, "");

  async function submitDeal() {
    const cleanAsking = stripCommas(askingPrice);
    const cleanArv = stripCommas(arv);
    
    if (!city || !cleanAsking || !description) {
      alert("City, Asking Price, and Description required");
      return;
    }
    
    if (targetBuyers.length === 0) {
      alert("Select at least one target buyer type");
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
        .from('vaultforge-deal-photos')
        .upload(fileName, file);
      
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('vaultforge-deal-photos')
          .getPublicUrl(data.path);
        imageUrls.push(publicUrl);
      }
    }
    setUploading(false);
    
    // Auto-generate title so we never hit NULL constraint
    const title = `${beds}bd ${baths}ba ${propertyType} in ${city}, ${state} - $${Number(cleanAsking).toLocaleString()}`;
    
    const payload = {
      post_type: "deal",
      title,
      user_email: email,
      property_type: propertyType,
      city, state, address, zipcode,
      asking_price: Number(cleanAsking),
      arv: cleanArv ? Number(cleanArv) : null,
      deal_type: dealType,
      description,
      beds: beds ? Number(beds) : null,
      baths: baths ? Number(baths) : null,
      sqft: sqft ? Number(sqft) : null,
      year_built: yearBuilt ? Number(yearBuilt) : null,
      repair_estimate: repairEstimate ? Number(stripCommas(repairEstimate)) : null,
      units: units ? Number(units) : null,
      cap_rate: capRate ? Number(capRate) : null,
      noi: noi ? Number(noi) : null,
      tenant_type: tenantType,
      acreage: acreage ? Number(acreage) : null,
      zoning, utilities,
      target_buyer: targetBuyers, // Now sends array
      min_cash_required: minCashRequired ? Number(stripCommas(minCashRequired)) : null,
      timeline, assignment_fee: assignmentFee ? Number(stripCommas(assignmentFee)) : null,
      seller_financing: sellerFinancing,
      existing_mortgage: existingMortgage,
      mortgage_balance: mortgageBalance ? Number(stripCommas(mortgageBalance)) : null,
      image_urls: imageUrls
    };

    const res = await fetch("/api/route-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    setLoading(false);
    if (res.ok) {
      window.location.href = "/deal-opportunities";
    } else {
      const data = await res.json();
      alert("Error: " + (data.error || "Failed to save"));
    }
  }

  const input = {width:"100%",padding:"12px",background:"#0a0f1a",border:"2px solid #FFD700",borderRadius:"8px",color:"#fff",fontSize:"15px",marginBottom:"14px"};
  const label = {color:"#FFD700",fontSize:"11px",fontWeight:"700",marginBottom:"4px",display:"block",letterSpacing:"0.5px"};
  const section = {borderTop:"1px solid #222",paddingTop:"20px",marginTop:"20px"};
  const sectionTitle = {color:"#00ccff",fontSize:"14px",fontWeight:"800",marginBottom:"16px"};
  const checkboxLabel = {display:"flex",alignItems:"center",gap:"8px",color:"#fff",fontSize:"14px",marginBottom:"10px",cursor:"pointer"};

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:"16px"}}>
      <a href="/my-work" style={{color:"#00ccff",fontSize:"14px"}}>← Back to My Work</a>
      <h1 style={{color:"#FFD700",fontWeight:"900",fontSize:"28px",margin:"16px 0 8px"}}>POST DEAL</h1>
      <p style={{opacity:0.7,fontSize:"14px",marginBottom:"24px"}}>AI will analyze and route to matching buyers instantly</p>
      
      <div style={{maxWidth:"700px"}}>
        <label style={label}>PROPERTY TYPE *</label>
        <select style={{...input,background:"#1a0f00"}} value={propertyType} onChange={e=>setPropertyType(e.target.value)}>
          <option>Residential</option>
          <option>Commercial</option>
          <option>Land</option>
          <option>Multi-Family</option>
        </select>

        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"12px"}}>
          <div>
            <label style={label}>CITY *</label>
            <input style={input} value={city} onChange={e=>setCity(e.target.value)} placeholder="Atlanta" />
          </div>
          <div>
            <label style={label}>STATE</label>
            <select style={input} value={state} onChange={e=>setState(e.target.value)}>
              <option>GA</option><option>FL</option><option>TX</option><option>CA</option><option>NY</option>
              <option>AL</option><option>AZ</option><option>NC</option><option>SC</option><option>TN</option>
            </select>
          </div>
          <div>
            <label style={label}>ZIP</label>
            <input style={input} value={zipcode} onChange={e=>setZipcode(e.target.value)} placeholder="30303" />
          </div>
        </div>

        <label style={label}>PROPERTY ADDRESS</label>
        <input style={input} value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St" />

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
          <div>
            <label style={label}>ASKING PRICE *</label>
            <input style={input} type="text" inputMode="numeric" value={askingPrice} onChange={e=>setAskingPrice(e.target.value)} placeholder="125000" />
          </div>
          <div>
            <label style={label}>ARV</label>
            <input style={input} type="text" inputMode="numeric" value={arv} onChange={e=>setArv(e.target.value)} placeholder="206000" />
          </div>
          <div>
            <label style={label}>DEAL TYPE</label>
            <select style={input} value={dealType} onChange={e=>setDealType(e.target.value)}>
              <option>Wholesale</option><option>Fix & Flip</option><option>Buy & Hold</option><option>Subject To</option><option>Seller Finance</option>
            </select>
          </div>
        </div>

        {propertyType === "Residential" && (
          <div style={section}>
            <div style={sectionTitle}>RESIDENTIAL DETAILS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"12px"}}>
              <div><label style={label}>BEDS</label><input style={input} type="text" inputMode="numeric" value={beds} onChange={e=>setBeds(e.target.value)} placeholder="3" /></div>
              <div><label style={label}>BATHS</label><input style={input} type="text" inputMode="decimal" value={baths} onChange={e=>setBaths(e.target.value)} placeholder="2" /></div>
              <div><label style={label}>SQFT</label><input style={input} type="text" inputMode="numeric" value={sqft} onChange={e=>setSqft(e.target.value)} placeholder="1800" /></div>
              <div><label style={label}>YEAR BUILT</label><input style={input} type="text" inputMode="numeric" value={yearBuilt} onChange={e=>setYearBuilt(e.target.value)} placeholder="1995" /></div>
            </div>
            <label style={label}>REPAIR ESTIMATE</label>
            <input style={input} type="text" inputMode="numeric" value={repairEstimate} onChange={e=>setRepairEstimate(e.target.value)} placeholder="25000" />
          </div>
        )}

        {propertyType === "Commercial" && (
          <div style={section}>
            <div style={sectionTitle}>COMMERCIAL DETAILS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div><label style={label}>TOTAL UNITS</label><input style={input} type="text" inputMode="numeric" value={units} onChange={e=>setUnits(e.target.value)} placeholder="12" /></div>
              <div><label style={label}>CAP RATE %</label><input style={input} type="text" inputMode="decimal" value={capRate} onChange={e=>setCapRate(e.target.value)} placeholder="8.5" /></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div><label style={label}>NOI (Annual)</label><input style={input} type="text" inputMode="numeric" value={noi} onChange={e=>setNoi(e.target.value)} placeholder="85000" /></div>
              <div><label style={label}>TENANT TYPE</label><input style={input} value={tenantType} onChange={e=>setTenantType(e.target.value)} placeholder="Retail/Office/Industrial" /></div>
            </div>
          </div>
        )}

        {propertyType === "Land" && (
          <div style={section}>
            <div style={sectionTitle}>LAND DETAILS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div><label style={label}>ACREAGE</label><input style={input} type="text" inputMode="decimal" value={acreage} onChange={e=>setAcreage(e.target.value)} placeholder="2.5" /></div>
              <div><label style={label}>ZONING</label><input style={input} value={zoning} onChange={e=>setZoning(e.target.value)} placeholder="R1, C2, Agricultural" /></div>
            </div>
            <label style={label}>UTILITIES</label>
            <input style={input} value={utilities} onChange={e=>setUtilities(e.target.value)} placeholder="Water, Sewer, Electric on site" />
          </div>
        )}

        <div style={section}>
          <div style={sectionTitle}>PROPERTY IMAGES</div>
          <label style={label}>UPLOAD UP TO 10 PHOTOS</label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageChange}
            style={{...input,padding:"10px",border:"2px dashed #FFD700"}}
          />
          {images.length > 0 && <p style={{color:"#00ccff",fontSize:"12px",marginTop:"-8px"}}>{images.length} image(s) selected</p>}
        </div>

        <div style={section}>
          <div style={sectionTitle}>BUYER BOX / TERMS</div>
          <label style={label}>TARGET BUYER TYPES - SELECT ALL THAT APPLY</label>
          <div style={{background:"#0a0f1a",border:"2px solid #FFD700",borderRadius:"8px",padding:"16px",marginBottom:"14px"}}>
            {BUYER_TYPES.map(buyer => (
              <label key={buyer} style={checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={targetBuyers.includes(buyer)}
                  onChange={() => toggleBuyer(buyer)}
                  style={{width:"18px",height:"18px"}}
                />
                {buyer}
              </label>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
            <div><label style={label}>MIN CASH REQUIRED</label><input style={input} type="text" inputMode="numeric" value={minCashRequired} onChange={e=>setMinCashRequired(e.target.value)} placeholder="50000" /></div>
            <div><label style={label}>TIMELINE</label><select style={input} value={timeline} onChange={e=>setTimeline(e.target.value)}><option>7 Days</option><option>14 Days</option><option>30 Days</option><option>60 Days</option></select></div>
            <div><label style={label}>ASSIGNMENT FEE</label><input style={input} type="text" inputMode="numeric" value={assignmentFee} onChange={e=>setAssignmentFee(e.target.value)} placeholder="10000" /></div>
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>LENDER / SELLER TERMS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <div>
              <label style={label}>SELLER FINANCING?</label>
              <select style={input} value={sellerFinancing} onChange={e=>setSellerFinancing(e.target.value)}>
                <option>No</option><option>Yes - Partial</option><option>Yes - Full</option>
              </select>
            </div>
            <div>
              <label style={label}>EXISTING MORTGAGE?</label>
              <select style={input} value={existingMortgage} onChange={e=>setExistingMortgage(e.target.value)}>
                <option>No</option><option>Yes - Assumable</option><option>Yes - Subject To</option><option>Yes - Must Payoff</option>
              </select>
            </div>
          </div>
          {existingMortgage !== "No" && (
            <div>
              <label style={label}>MORTGAGE BALANCE</label>
              <input style={input} type="text" inputMode="numeric" value={mortgageBalance} onChange={e=>setMortgageBalance(e.target.value)} placeholder="85000" />
            </div>
          )}
        </div>

        <div style={section}>
          <label style={label}>DEAL DESCRIPTION *</label>
          <textarea 
            style={{...input,height:"120px",resize:"none"}} 
            value={description} 
            onChange={e=>setDescription(e.target.value)} 
            placeholder="Motivation, access, repairs needed, comps, exit strategy, terms..." 
          />
        </div>

        <button 
          onClick={submitDeal} 
          disabled={loading}
          style={{width:"100%",padding:"18px",background:loading?"#333":"#FFD700",color:"#000",fontWeight:"900",fontSize:"18px",borderRadius:"8px",border:"none",cursor:loading?"not-allowed":"pointer",marginTop:"8px"}}
        >
          {uploading ? "UPLOADING IMAGES..." : loading ? "POSTING TO VAULTFORGE..." : "POST DEAL TO VAULTFORGE"}
        </button>
      </div>
    </main>
  );
}  
                    
              
