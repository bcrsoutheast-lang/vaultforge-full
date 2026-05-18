
"use client";

import { useState } from "react";

const STATES = ["GA","TN","AL","FL","NC","SC","TX"];
const MEMBER_TYPES = ["Investor","Lender","Operator","Wholesaler","Contractor","Broker"];
const ASSETS = ["SFR","Multifamily","Commercial","Land","Industrial","Retail"];
const DEALS = ["Flip","Buy Hold","Wholesale","JV","Development","Debt"];

function ChipGroup({label,items,selected,onToggle}:{label:string,items:string[],selected:string[],onToggle:(v:string)=>void}) {
  return (
    <section style={{marginBottom:18}}>
      <div style={{color:"#f5c84c",fontWeight:900,fontSize:12,letterSpacing:2,marginBottom:10}}>{label}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {items.map((item)=>(
          <button
            key={item}
            type="button"
            onClick={()=>onToggle(item)}
            style={{
              border:selected.includes(item)?"1px solid #f5c84c":"1px solid rgba(255,255,255,.15)",
              background:selected.includes(item)?"linear-gradient(135deg,#fde68a,#e8c46b)":"rgba(255,255,255,.05)",
              color:selected.includes(item)?"#111827":"#fff",
              borderRadius:999,
              padding:"10px 12px",
              fontWeight:900,
              cursor:"pointer"
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  )
}

export default function VaultForgeProfileBloomberg() {
  const [states,setStates]=useState<string[]>([]);
  const [contactStates,setContactStates]=useState<string[]>([]);
  const [memberTypes,setMemberTypes]=useState<string[]>([]);
  const [assets,setAssets]=useState<string[]>([]);
  const [deals,setDeals]=useState<string[]>([]);

  function toggle(setter:any,current:string[],value:string){
    setter(current.includes(value)?current.filter((x)=>x!==value):[...current,value]);
  }

  return (
    <div style={{display:"grid",gap:18}}>
      <section style={card}>
        <div style={eyebrow}>AI ROUTING PROFILE</div>
        <h2 style={h2}>Bloomberg-style routing setup.</h2>

        <ChipGroup
          label="Member Type"
          items={MEMBER_TYPES}
          selected={memberTypes}
          onToggle={(v)=>toggle(setMemberTypes,memberTypes,v)}
        />

        <ChipGroup
          label="States To Route Alerts/Deals"
          items={STATES}
          selected={states}
          onToggle={(v)=>toggle(setStates,states,v)}
        />

        <ChipGroup
          label="States Members Can Contact You From"
          items={STATES}
          selected={contactStates}
          onToggle={(v)=>toggle(setContactStates,contactStates,v)}
        />

        <ChipGroup
          label="Asset Types"
          items={ASSETS}
          selected={assets}
          onToggle={(v)=>toggle(setAssets,assets,v)}
        />

        <ChipGroup
          label="Deal Types"
          items={DEALS}
          selected={deals}
          onToggle={(v)=>toggle(setDeals,deals,v)}
        />

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
          <input placeholder="Full Name" style={input}/>
          <input placeholder="Company" style={input}/>
          <input placeholder="Email" style={input}/>
          <input placeholder="Phone" style={input}/>
        </div>
      </section>
    </div>
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

const h2: React.CSSProperties = {
  fontSize:42,
  margin:"0 0 18px",
  letterSpacing:"-.05em"
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
