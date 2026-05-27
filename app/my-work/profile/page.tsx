"use client";

import { useEffect, useState } from "react";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    investorType: "wholesaler",
    states: ["GA"],
    propertyTypes: ["SFH"],
    dealTypes: ["wholesale"],
    buyBoxMin: "",
    buyBoxMax: "",
    dmaicSkills: [],
    bio: ""
  });
  const [saved, setSaved] = useState(false);

  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";

  useEffect(() => {
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const myProfile = profiles.find((p:any) => p.email === currentEmail);
    if (myProfile) {
      setProfile(myProfile);
    } else {
      // Set defaults from login
      const name = localStorage.getItem("vaultforge_current_name") || "";
      setProfile(prev => ({...prev, email: currentEmail, name}));
    }
  }, [currentEmail]);

  function handleSave() {
    if (!profile.name ||!profile.investorType) return alert("Name and Investor Type required");
    
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const existing = profiles.findIndex((p:any) => p.email === currentEmail);
    
    const updatedProfile = {
    ...profile,
      updatedAt: Date.now()
    };

    if (existing >= 0) {
      profiles[existing] = updatedProfile;
    } else {
      profiles.push(updatedProfile);
    }
    
    localStorage.setItem("vaultforge_profiles", JSON.stringify(profiles));
    localStorage.setItem("vaultforge_current_name", profile.name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleArrayItem(field: string, value: string) {
    setProfile(prev => {
      const arr = prev[field as keyof typeof prev] as string[];
      const exists = arr.includes(value);
      return {
      ...prev,
        [field]: exists? arr.filter(i => i!== value) : [...arr, value]
      };
    });
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h1 style={{color:"#FFD700",fontWeight:900}}>PROFILE</h1>
            <div style={{fontSize:11,opacity:0.7}}>Feeds VaultForge AI. Better profile = better alerts.</div>
          </div>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        <div style={{background:"#0a0f1a",border:"1px solid #00ff00",color:"#00ff00",padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:12,fontWeight:900}}>
          🤖 AI MATCHMAKER: VaultForge uses this data to route deals/pains to you. Complete it for alerts.
        </div>

        <div style={{border:"1px solid #333",borderRadius:12,padding:24,background:"#0a0f1a"}}>
          <div style={{display:"grid",gap:16}}>
            
            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>BASIC INFO</div>
              <div style={{display:"grid",gap:8}}>
                <input 
                  value={profile.name} 
                  onChange={e=>setProfile({...profile,name:e.target.value})} 
                  placeholder="Full Name" 
                  style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
                />
                <input 
                  value={profile.email} 
                  disabled
                  style={{padding:12,borderRadius:8,background:"#222",border:"1px solid #333",color:"#666"}} 
                />
                <input 
                  value={profile.phone} 
                  onChange={e=>setProfile({...profile,phone:e.target.value})} 
                  placeholder="Phone (optional)" 
                  style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
                />
              </div>
            </div>

            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>INVESTOR TYPE *</div>
              <select 
                value={profile.investorType} 
                onChange={e=>setProfile({...profile,investorType:e.target.value})} 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",width:"100%"}}
              >
                {["wholesaler","flipper","buy-hold","lender","contractor","agent","bird-dog","note-buyer"].map(t=>
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                )}
              </select>
            </div>

            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>STATES YOU WORK *</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["GA","FL","TN","AL","NC","SC","TX","NATIONAL"].map(s=>(
                  <button 
                    key={s}
                    onClick={()=>toggleArrayItem("states", s)}
                    style={{
                      padding:"6px 12px",
                      borderRadius:999,
                      border:"1px solid #333",
                      background:profile.states.includes(s)?"#FFD700":"#05070d",
                      color:profile.states.includes(s)?"#000":"#fff",
                      fontSize:11,
                      fontWeight:900
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>PROPERTY TYPES</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["SFH","Multi-Family","Land","Commercial","Mobile"].map(p=>(
                  <button 
                    key={p}
                    onClick={()=>toggleArrayItem("propertyTypes", p)}
                    style={{
                      padding:"6px 12px",
                      borderRadius:999,
                      border:"1px solid #333",
                      background:profile.propertyTypes.includes(p)?"#FFD700":"#05070d",
                      color:profile.propertyTypes.includes(p)?"#000":"#fff",
                      fontSize:11,
                      fontWeight:900
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>BUY BOX - PRICE RANGE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <input 
                  value={profile.buyBoxMin} 
                  onChange={e=>setProfile({...profile,buyBoxMin:e.target.value})} 
                  placeholder="Min (e.g. 50,000)" 
                  style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
                />
                <input 
                  value={profile.buyBoxMax} 
                  onChange={e=>setProfile({...profile,buyBoxMax:e.target.value})} 
                  placeholder="Max (e.g. 300,000)" 
                  style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
                />
              </div>
            </div>

            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#00ccff"}}>DMAIC SKILLS (For Pain Room)</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["HVAC","Plumbing","Electrical","Roof","Foundation","Pest","Cosmetic","GC"].map(s=>(
                  <button 
                    key={s}
                    onClick={()=>toggleArrayItem("dmaicSkills", s)}
                    style={{
                      padding:"6px 12px",
                      borderRadius:999,
                      border:"1px solid #333",
                      background:profile.dmaicSkills.includes(s)?"#00ccff":"#05070d",
                      color:profile.dmaicSkills.includes(s)?"#000":"#fff",
                      fontSize:11,
                      fontWeight:900
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>BIO / STRATEGY</div>
              <textarea 
                value={profile.bio} 
                onChange={e=>setProfile({...profile,bio:e.target.value})} 
                placeholder="Tell members your strategy, experience, what you're looking for..." 
                rows={3} 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",width:"100%"}} 
              />
            </div>

            <button 
              onClick={handleSave} 
              style={{padding:14,borderRadius:8,background:saved?"#00ff00":"#FFD700",color:"#000",border:"none",fontWeight:900,fontSize:14}}
            >
              {saved?"✓ SAVED" : "SAVE PROFILE"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
