"use client";

import { useEffect, useState } from "react";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [dealTypes, setDealTypes] = useState<string[]>([]);
  const [dmaicSkills, setDmaicSkills] = useState<string[]>([]);
  const [investorType, setInvestorType] = useState("wholesaler");
  const [profilePic, setProfilePic] = useState("");
  const [bio, setBio] = useState("");
  
  const currentEmail = typeof window!== "undefined"? localStorage.getItem("vaultforge_current_email") || "" : "";
  const isAdmin = currentEmail === "admin@vaultforge.com"; // Change to your admin email

  useEffect(() => {
    loadProfile();
  }, [currentEmail]);

  function loadProfile() {
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const profile = profiles.find((p:any) => p.email === currentEmail);
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setStates(profile.states || []);
      setPropertyTypes(profile.propertyTypes || []);
      setDealTypes(profile.dealTypes || []);
      setDmaicSkills(profile.dmaicSkills || []);
      setInvestorType(profile.investorType || "wholesaler");
      setProfilePic(profile.profilePic || "");
      setBio(profile.bio || "");
    }
  }

  function handleSave() {
    const profiles = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
    const existingIdx = profiles.findIndex((p:any) => p.email === currentEmail);
    
    const updatedProfile = {
      email: currentEmail,
      name,
      phone,
      states,
      propertyTypes,
      dealTypes,
      dmaicSkills,
      investorType,
      profilePic,
      bio,
      updatedAt: Date.now()
    };

    if (existingIdx >= 0) {
      profiles[existingIdx] = {...profiles[existingIdx],...updatedProfile};
    } else {
      profiles.push(updatedProfile);
    }
    
    localStorage.setItem("vaultforge_profiles", JSON.stringify(profiles));
    alert("Profile saved");
  }

  function handlePicUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event:any) => {
      setProfilePic(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  function toggleArrayItem(arr: string[], setArr: any, item: string) {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i!== item));
    } else {
      setArr([...arr, item]);
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        {/* VAULTFORGE LOGO LOCKED FRONT AND CENTER - NEVER REMOVED */}
        <div style={{textAlign:"center",marginBottom:24,padding:"20px 0",borderBottom:"2px solid #FFD700"}}>
          <img 
            src="/vaultforge-logo.png" 
            alt="VaultForge" 
            style={{height:60,margin:"0 auto 12px",filter:"drop-shadow(0 0 15px #FFD700)"}}
            onError={(e:any)=>{e.target.style.display='none'}}
          />
          <h1 style={{color:"#FFD700",fontWeight:900,fontSize:24,letterSpacing:1}}>MEMBER PROFILE</h1>
          <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Your buy box. Your skills. Your network.</div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={()=>window.location.href="/my-work"} style={{padding:"8px 16px",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",background:"none",fontSize:12}}>← My Work</button>
        </div>

        {/* MEMBER PROFILE PIC UPLOAD - BELOW LOGO */}
        <div style={{border:"1px solid #FFD700",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:900,marginBottom:16,color:"#FFD700"}}>YOUR PROFILE</div>
          
          <div style={{display:"flex",gap:24,alignItems:"start",marginBottom:24}}>
            <div style={{textAlign:"center"}}>
              {profilePic? (
                <img src={profilePic} alt="Profile" style={{width:120,height:120,borderRadius:"50%",border:"3px solid #FFD700",objectFit:"cover"}} />
              ) : (
                <div style={{width:120,height:120,borderRadius:"50%",border:"3px dashed #666",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,opacity:0.5}}>
                  👤
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePicUpload} 
                style={{display:"none"}} 
                id="picUpload" 
              />
              <label 
                htmlFor="picUpload" 
                style={{display:"block",marginTop:12,padding:"8px 16px",background:"#222",border:"1px solid #FFD700",borderRadius:8,color:"#FFD700",fontSize:11,fontWeight:900,cursor:"pointer"}}
              >
                Upload Photo
              </label>
            </div>

            <div style={{flex:1,display:"grid",gap:12}}>
              <input 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="Full Name" 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
              />
              <input 
                value={email} 
                disabled 
                style={{padding:12,borderRadius:8,background:"#1a1f2a",border:"1px solid #333",color:"#999"}} 
              />
              <input 
                value={phone} 
                onChange={e=>setPhone(e.target.value)} 
                placeholder="Phone (optional)" 
                style={{padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff"}} 
              />
            </div>
          </div>

          <textarea 
            value={bio} 
            onChange={e=>setBio(e.target.value)} 
            placeholder="Bio - Tell members about your experience, what you bring to deals..." 
            rows={3} 
            style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",marginBottom:16}} 
          />

          <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>INVESTOR TYPE</div>
          <select 
            value={investorType} 
            onChange={e=>setInvestorType(e.target.value)} 
            style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #333",color:"#fff",marginBottom:16}}
          >
            {["wholesaler","fix-flip","buy-hold","contractor","lender","realtor","other"].map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>

          <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>STATES YOU WORK</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {["GA","FL","TN","AL","NC","SC","TX","NATIONAL"].map(s=>(
              <button 
                key={s} 
                onClick={()=>toggleArrayItem(states,setStates,s)} 
                style={{
                  padding:"6px 12px",
                  borderRadius:6,
                  border:"1px solid #333",
                  background:states.includes(s)?"#FFD700":"#05070d",
                  color:states.includes(s)?"#000":"#fff",
                  fontSize:11,
                  fontWeight:900
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#FFD700"}}>PROPERTY TYPES</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {["SFH","Multi-Family","Land","Commercial","Mobile"].map(p=>(
              <button 
                key={p} 
                onClick={()=>toggleArrayItem(propertyTypes,setPropertyTypes,p)} 
                style={{
                  padding:"6px 12px",
                  borderRadius:6,
                  border:"1px solid #333",
                  background:propertyTypes.includes(p)?"#FFD700":"#05070d",
                  color:propertyTypes.includes(p)?"#000":"#fff",
                  fontSize:11,
                  fontWeight:900
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{fontSize:12,fontWeight:900,marginBottom:8,color:"#00ccff"}}>DMAIC SKILLS (For Pain Room Matching)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
            {["HVAC","Plumbing","Electrical","Roof","Foundation","Pest","Cosmetic","Other"].map(p=>(
              <button 
                key={p} 
                onClick={()=>toggleArrayItem(dmaicSkills,setDmaicSkills,p)} 
                style={{
                  padding:"6px 12px",
                  borderRadius:6,
                  border:"1px solid #333",
                  background:dmaicSkills.includes(p)?"#00ccff":"#05070d",
                  color:dmaicSkills.includes(p)?"#000":"#fff",
                  fontSize:11,
                  fontWeight:900
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button 
            onClick={handleSave} 
            style={{width:"100%",padding:14,borderRadius:8,background:"#FFD700",color:"#000",border:"none",fontWeight:900,fontSize:14}}
          >
            SAVE PROFILE
          </button>
        </div>
      </div>
    </main>
  );
}
