"use client";

import { useEffect, useState } from "react";

const STATES = ["GA", "FL", "TN", "AL", "NC", "SC", "TX"];

export default function Profile() {
  const [email, setEmail] = useState("");
  const [basedState, setBasedState] = useState("");
  const [statesServed, setStatesServed] = useState<string[]>([]);
  const [photo, setPhoto] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentEmail = localStorage.getItem("vaultforge_current_email") || "";
    setEmail(currentEmail);

    const stored = localStorage.getItem("vaultforge_profiles");
    const profiles = stored? JSON.parse(stored) : {};
    const userProfile = profiles[currentEmail] || {};
    
    setBasedState(userProfile.based_state || "");
    setStatesServed(userProfile.states_served || []);
    setPhoto(userProfile.photo || "");
  }, []);

  function toggleState(state: string) {
    if (statesServed.includes(state)) {
      setStatesServed(statesServed.filter(s => s!== state));
    } else {
      setStatesServed([...statesServed, state]);
    }
  }

  function handlePhotoUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    if (!email) {
      alert("No user logged in");
      return;
    }

    const stored = localStorage.getItem("vaultforge_profiles");
    const profiles = stored? JSON.parse(stored) : {};
    
    profiles[email] = {
      based_state: basedState,
      states_served: statesServed,
      photo: photo
    };
    
    localStorage.setItem("vaultforge_profiles", JSON.stringify(profiles));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main style={{minHeight:"100vh",background:"#05070d",color:"#fff",padding:16}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h1 style={{color:"#FFD700",fontWeight:900}}>MY PROFILE</h1>
          <a href="/dashboard" style={{color:"#FFD700"}}>Back to Dashboard</a>
        </div>

        <div style={{border:"1px solid #222",borderRadius:12,padding:24,background:"#0a0f1a",marginBottom:16}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            {photo? (
              <img src={photo} style={{width:100,height:100,borderRadius:"50%",objectFit:"cover",margin:"0 auto 12px"}} />
            ) : (
              <div style={{width:100,height:100,borderRadius:"50%",background:"#222",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>
                👤
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{fontSize:12}} />
          </div>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>Email</label>
            <input value={email} disabled style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff",opacity:0.5}} />
          </div>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>Based State</label>
            <select 
              value={basedState} 
              onChange={e=>setBasedState(e.target.value)}
              style={{width:"100%",padding:12,borderRadius:8,background:"#05070d",border:"1px solid #222",color:"#fff"}}
            >
              <option value="">Select State</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Your home state for Members count</div>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{display:"block",marginBottom:8,fontWeight:900}}>States Served</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:8}}>
              {STATES.map(state => (
                <button
                  key={state}
                  onClick={()=>toggleState(state)}
                  style={{
                    padding:"8px 12px",
                    borderRadius:8,
                    border:"1px solid #222",
                    background: statesServed.includes(state)? "#FFD700" : "#05070d",
                    color: statesServed.includes(state)? "#000" : "#fff",
                    fontWeight: statesServed.includes(state)? 900 : 400,
                    fontSize:14
                  }}
                >
                  {state}
                </button>
              ))}
            </div>
            <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Click to toggle states you work in</div>
          </div>

          <button
            onClick={saveProfile}
            style={{
              width:"100%",
              padding:"14px 22px",
              borderRadius:999,
              fontWeight:900,
              background: saved? "#00ff00" : "#FFD700",
              color:"#000"
            }}
          >
            {saved? "Saved!" : "Save Profile"}
          </button>
        </div>

        <div style={{border:"1px solid #222",borderRadius:12,padding:16,background:"#0a0f1a",opacity:0.7,fontSize:12}}>
          <div style={{fontWeight:900,marginBottom:8}}>How this works:</div>
          <div>• Based State: You count as a Member in this state</div>
          <div>• States Served: You count as a Member in all selected states</div>
          <div>• Photo: Shows next to your deals/pains</div>
        </div>
      </div>
    </main>
  );
}
