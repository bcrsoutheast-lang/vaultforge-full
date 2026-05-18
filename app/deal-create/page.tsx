
"use client";

import { useState } from "react";

const STATES = ["GA","TN","AL","FL","NC","SC","TX"];

export default function DealCreatePage() {
  const [type,setType]=useState("Residential");
  const [photo,setPhoto]=useState("");

  function photoUpload(event:any){
    const file = event.target.files?.[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if(typeof reader.result === "string"){
        setPhoto(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <main style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg,#02040a,#071018 55%,#02040a)",
      color:"#fff",
      padding:18,
      fontFamily:"Inter,Arial"
    }}>
      <div style={{maxWidth:1180,margin:"0 auto",display:"grid",gap:18}}>
        <section style={card}>
          <div style={eyebrow}>DEAL OPPORTUNITY</div>
          <h1 style={hero}>Bloomberg operator intake.</h1>

          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18}}>
            {["Residential","Commercial","Land"].map((item)=>(
              <button
                key={item}
                type="button"
                onClick={()=>setType(item)}
                style={{
                  border:type===item?"1px solid #f5c84c":"1px solid rgba(255,255,255,.15)",
                  background:type===item?"linear-gradient(135deg,#fde68a,#e8c46b)":"rgba(255,255,255,.05)",
                  color:type===item?"#111827":"#fff",
                  borderRadius:999,
                  padding:"12px 14px",
                  fontWeight:900,
                  cursor:"pointer"
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{type.toUpperCase()} FORM</div>

          <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:18}}>
            <div>
              <div style={photoBox}>
                {photo ? (
                  <img src={photo} alt="" style={{width:"100%",height:"100%",objectFit":"cover"}} />
                ) : (
                  <div>Upload property image</div>
                )}
              </div>

              <input type="file" accept="image/*" onChange={photoUpload} style={{marginTop:12,color:"#fff"}} />
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
              <input placeholder="Deal Title" style={input}/>
              <select style={input}>
                {STATES.map((s)=><option key={s}>{s}</option>)}
              </select>
              <input placeholder="City" style={input}/>
              <input placeholder="County" style={input}/>
              <input placeholder="Purchase Price" style={input}/>
              <input placeholder="ARV / Exit Value" style={input}/>
              <input placeholder="Repair Estimate" style={input}/>
              <input placeholder="Equity Spread" style={input}/>

              {type==="Residential" && (
                <>
                  <input placeholder="Beds" style={input}/>
                  <input placeholder="Baths" style={input}/>
                  <input placeholder="SQFT" style={input}/>
                </>
              )}

              {type==="Commercial" && (
                <>
                  <input placeholder="NOI" style={input}/>
                  <input placeholder="Cap Rate" style={input}/>
                  <input placeholder="Tenant Status" style={input}/>
                </>
              )}

              {type==="Land" && (
                <>
                  <input placeholder="Acres" style={input}/>
                  <input placeholder="Zoning" style={input}/>
                  <input placeholder="Utilities" style={input}/>
                </>
              )}

              <textarea placeholder="AI / Deal Notes" rows={5} style={{...input,minHeight:120,gridColumn:"1 / -1"}} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

const card: React.CSSProperties = {
  border:"1px solid rgba(245,200,76,.24)",
  background:"linear-gradient(145deg, rgba(16,24,36,.94), rgba(2,6,23,.98))",
  borderRadius:28,
  padding:24
};

const eyebrow: React.CSSProperties = {
  color:"#f5c84c",
  fontSize:12,
  fontWeight:900,
  letterSpacing:3,
  marginBottom:12
};

const hero: React.CSSProperties = {
  fontSize:"clamp(48px,8vw,88px)",
  lineHeight:.9,
  margin:0,
  letterSpacing:"-.08em"
};

const input: React.CSSProperties = {
  width:"100%",
  boxSizing:"border-box",
  border:"1px solid rgba(255,255,255,.15)",
  background:"rgba(255,255,255,.05)",
  color:"#fff",
  borderRadius:16,
  padding:"14px"
};

const photoBox: React.CSSProperties = {
  height:260,
  borderRadius:20,
  overflow:"hidden",
  border:"1px solid rgba(255,255,255,.14)",
  background:"rgba(255,255,255,.05)",
  display:"grid",
  placeItems:"center"
};
