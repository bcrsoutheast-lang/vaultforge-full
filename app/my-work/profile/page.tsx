"use client";

import { useEffect, useState } from "react";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [homeState, setHomeState] = useState("GA");
  const [investorType, setInvestorType] = useState("investor");
  const [states, setStates] = useState<string[]>(["GA"]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>(["Single Family"]);
  const [minArv, setMinArv] = useState("");
  const [maxAsk, setMaxAsk] = useState("");
  const [dmaicSkills, setDmaicSkills] = useState<string[]>([]);
  const [photo, setPhoto] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentEmail = localStorage.getItem("vaultforge_current_email") || "";
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const profile = profiles.find((p:any) => p.email === currentEmail);
    
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || currentEmail);
      setPhone(profile.phone || "");
      setHomeState(profile.homeState || "GA");
      setInvestorType(profile.investorType || "investor");
      setStates(profile.states || ["GA"]);
      setPropertyTypes(profile.propertyTypes || ["Single Family"]);
      setMinArv(profile.minArv || "");
      setMaxAsk(profile.maxAsk || "");
      setDmaicSkills(profile.dmaicSkills || []);
      setPhoto(profile.photo || "");
    } else {
      setEmail(currentEmail);
    }
  }, []);

  function handleSave() {
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const currentEmail = localStorage.getItem("vaultforge_current_email") || "";
    
    const updatedProfile = {
      email: currentEmail,
      name,
      phone,
      homeState,
      investorType,
      states,
      propertyTypes,
      minArv: minArv? parseInt(minArv) : null,
      maxAsk: maxAsk? parseInt(maxAsk) : null,
      dmaicSkills,
      photo,
      updatedAt: Date.now()
    };

    const existingIndex = profiles.findIndex((p:any) => p.email === currentEmail);
    if (existingIndex >= 0) {
      profiles[existingIndex] = updatedProfile;
    } else {
      profiles.push(updatedProfile);
    }

    localStorage.setItem("vaultforge_profiles", JSON.stringify(profiles));
    localStorage.setItem("vaultforge_current_name", name);
    
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  function toggleArrayItem(array: string[], setArray: any, item: string) {
    if (array.includes(item)) {
      setArray(array.filter(i => i!== item));
    } else {
      setArray([...array, item]);
    }
  }

  const allStates = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
  const allPropTypes = ["Single Family","Multi-Family","Condo","Townhouse","Land","Commercial","Mobile Home"];
  const allDmaic = ["Foundation","Roof","HVAC","Plumbing","Electrical","Framing","Drywall","Flooring","Paint","Landscaping","General","Kitchen","Bathroom","Windows","Siding","Demo"];

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>PROFILE</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Buy box, DMAIC skills, and member directory settings</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{display:"grid",gap:24}}>
          {/* BASIC INFO */}
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a"}}>
            <div style={{fontSize:14,fontWeight:900,color:"#FFD700",marginBottom:16}}>BASIC INFO</div>
            <div style={{display:"grid",gap:16}}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
              <input value={email} disabled style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#666"}} />
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone - for deal alerts" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
              <div>
                <div style={{fontSize:12,opacity:0.7,marginBottom:8}}>HOME STATE - Shows in Members directory</div>
                <select value={homeState} onChange={e=>setHomeState(e.target.value)} style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}}>
                  {allStates.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input value={photo} onChange={e=>setPhoto(e.target.value)} placeholder="Photo URL - optional" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
            </div>
          </div>

          {/* MEMBER TYPE */}
          <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a"}}>
            <div style={{fontSize:14,fontWeight:900,color:"#FFD700",marginBottom:16}}>MEMBER TYPE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <button 
                onClick={()=>setInvestorType("investor")}
                style={{
                  padding:16,
                  borderRadius:8,
                  border: investorType==="investor"? "2px solid #FFD700" : "1px solid #333",
                  background: investorType==="investor"? "#FFD70020" : "#05070d",
                  color:"#fff",
                  fontWeight: investorType==="investor"? 900 : 400
                }}
              >
                <div style={{fontSize:24,marginBottom:8}}>💰</div>
                <div style={{fontSize:14}}>INVESTOR</div>
                <div style={{fontSize:10,opacity:0.7}}>Buy deals, post pains</div>
              </button>
              <button 
                onClick={()=>setInvestorType("contractor")}
                style={{
                  padding:16,
                  borderRadius:8,
                  border: investorType==="contractor"? "2px solid #00ccff" : "1px solid #333",
                  background: investorType==="contractor"? "#00ccff20" : "#05070d",
                  color:"#fff",
                  fontWeight: investorType==="contractor"? 900 : 400
                }}
              >
                <div style={{fontSize:24,marginBottom:8}}>🔨</div>
                <div style={{fontSize:14}}>CONTRACTOR</div>
                <div style={{fontSize:10,opacity:0.7}}>Solve pains, find jobs</div>
              </button>
            </div>
          </div>

          {/* BUY BOX - INVESTORS */}
          {investorType === "investor" && (
            <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a"}}>
              <div style={{fontSize:14,fontWeight:900,color:"#FFD700",marginBottom:16}}>BUY BOX - Deal Matching</div>
              <div style={{display:"grid",gap:16}}>
                <div>
                  <div style={{fontSize:12,opacity:0.7,marginBottom:8}}>TARGET STATES</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {allStates.map(s=>(
                      <button 
                        key={s}
                        onClick={()=>toggleArrayItem(states,setStates,s)}
                        style={{
                          padding:"6px 12px",
                          borderRadius:6,
                          border: states.includes(s)? "1px solid #FFD700" : "1px solid #333",
                          background: states.includes(s)? "#FFD70020" : "#05070d",
                          color:"#fff",
                          fontSize:11,
                          fontWeight: states.includes(s)? 900 : 400
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{fontSize:12,opacity:0.7,marginBottom:8}}>PROPERTY TYPES</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {allPropTypes.map(p=>(
                      <button 
                        key={p}
                        onClick={()=>toggleArrayItem(propertyTypes,setPropertyTypes,p)}
                        style={{
                          padding:"6px 12px",
                          borderRadius:6,
                          border: propertyTypes.includes(p)? "1px solid #FFD700" : "1px solid #333",
                          background: propertyTypes.includes(p)? "#FFD70020" : "#05070d",
                          color:"#fff",
                          fontSize:11,
                          fontWeight: propertyTypes.includes(p)? 900 : 400
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <input value={minArv} onChange={e=>setMinArv(e.target.value)} placeholder="Min ARV - e.g. 100000" type="number" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
                  <input value={maxAsk} onChange={e=>setMaxAsk(e.target.value)} placeholder="Max Ask - e.g. 80000" type="number" style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} />
                </div>
              </div>
            </div>
          )}

          {/* DMAIC SKILLS - CONTRACTORS */}
          {investorType === "contractor" && (
            <div style={{border:"1px solid #00ccff",borderRadius:12,padding:24,background:"#0a0f1a"}}>
              <div style={{fontSize:14,fontWeight:900,color:"#00ccff",marginBottom:16}}>DMAIC SKILLS - Pain Matching</div>
              <div style={{display:"grid",gap:16}}>
                <div>
                  <div style={{fontSize:12,opacity:0.7,marginBottom:8}}>SERVICE AREAS</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {allStates.map(s=>(
                      <button 
                        key={s}
                        onClick={()=>toggleArrayItem(states,setStates,s)}
                        style={{
                          padding:"6px 12px",
                          borderRadius:6,
                          border: states.includes(s)? "1px solid #00ccff" : "1px solid #333",
                          background: states.includes(s)? "#00ccff20" : "#05070d",
                          color:"#fff",
                          fontSize:11,
                          fontWeight: states.includes(s)? 900 : 400
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{fontSize:12,opacity:0.7,marginBottom:8}}>DMAIC TRADES - What you solve</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {allDmaic.map(d=>(
                      <button 
                        key={d}
                        onClick={()=>toggleArrayItem(dmaicSkills,setDmaicSkills,d)}
                        style={{
                          padding:"6px 12px",
                          borderRadius:6,
                          border: dmaicSkills.includes(d)? "1px solid #00ccff" : "1px solid #333",
                          background: dmaicSkills.includes(d)? "#00ccff20" : "#05070d",
                          color:"#fff",
                          fontSize:11,
                          fontWeight: dmaicSkills.includes(d)? 900 : 400
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={handleSave} 
            style={{
              padding:16,
              borderRadius:8,
              background: saved? "#00ff00" : "#FFD700",
              color:"#000",
              border:"none",
              fontWeight:900,
              fontSize:16
            }}
          >
            {saved? "✓ SAVED" : "SAVE PROFILE"}
          </button>
        </div>
      </div>
    </main>
  );
}
