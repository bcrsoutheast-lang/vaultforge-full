"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type DealType = "Residential" | "Commercial" | "Land";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const BUCKET = "deal-photos";

const states = ["Georgia","Tennessee","Florida","North Carolina","South Carolina","Texas","Alabama","California","New York","Ohio","Pennsylvania","Other"];

const page: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#06100a,#102015,#06100a)", color: "white", padding: "28px 18px 90px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", background: "rgba(255,255,255,.045)", borderRadius: 30, padding: 22, marginBottom: 20 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 };
const btn: React.CSSProperties = { background: "#f5d978", color: "#06100a", border: "none", borderRadius: 999, padding: "13px 18px", fontWeight: 900, textDecoration: "none", display: "inline-block", margin: "6px 6px 0 0" };
const ghost: React.CSSProperties = { background: "rgba(255,255,255,.04)", color: "white", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "13px 18px", fontWeight: 900, textDecoration: "none", display: "inline-block", margin: "6px 6px 0 0" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.075)", color: "white", padding: 14, fontSize: 16 };
const label: React.CSSProperties = { display: "block", fontWeight: 900, margin: "0 0 8px" };
const eyebrow: React.CSSProperties = { color: "#f5d978", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.5 };

function getEmail() { if (typeof window === "undefined") return ""; return (localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || "text@text.com").trim().toLowerCase(); }
function cleanFileName(file: File) { return `${Date.now()}-${Math.random().toString(16).slice(2)}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`; }
async function upload(file: File, email: string) {
  const path = `${email}/${cleanFileName(file)}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type || "image/jpeg", "x-upsert": "true" }, body: file });
  if (!res.ok) throw new Error((await res.text()) || "Photo upload failed.");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

const empty = {
  title:"", property_type:"Residential" as DealType, strategy:"Fix & Flip", city:"", state:"Georgia", address:"", asking_price:"", arv:"", repair_estimate:"", description:"",
  bedrooms:"", bathrooms:"", building_sqft:"", year_built:"", occupancy:"", condition:"",
  commercial_type:"", units:"", noi:"", cap_rate:"", zoning:"", tenant_status:"",
  land_acres:"", frontage:"", utilities:"", road_access:"", topography:"", parcel_id:"",
  seller_situation:"", access_notes:"", private_notes:"",
  owner_name:"", owner_phone:"", owner_contact_email:"", preferred_contact:"Message inside VaultForge"
};

export default function SubmitPage() {
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [form, setForm] = useState<Record<string,string>>(empty as any);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [savedId, setSavedId] = useState("");

  function set(k: string, v: string) { setForm(x => ({...x, [k]: v})); }
  function pick(list: FileList|null) {
    const chosen = Array.from(list || []).filter(f => f.type.startsWith("image/")).slice(0,10);
    setFiles(chosen); setPreviews(chosen.map(f => URL.createObjectURL(f)));
  }
  async function submit() {
    if (busy) return;
    setBusy(true); setMsg(""); setSavedId("");
    try {
      const email = getEmail();
      if (!form.title || !form.city) throw new Error("Title and city are required.");
      if (files.length < 1) throw new Error("Upload at least one photo.");
      const urls: string[] = [];
      for (const f of files) urls.push(await upload(f, email));
      const payload = { ...form, owner_email: email, member_email: email, photo_urls: urls, main_photo_url: urls[0] || "" };
      const res = await fetch("/api/deal/create", { method: "POST", headers: { "Content-Type": "application/json", "x-vf-email": email }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Save failed.");
      setSavedId(data?.deal?.id || ""); setMsg("Deal saved. Form cleared.");
      setForm(empty as any); setFiles([]); setPreviews([]); if (fileRef.current) fileRef.current.value = ""; window.scrollTo({ top: 0, behavior: "smooth" });
    } catch(e:any) { setMsg(e?.message || "Could not save."); }
    finally { setBusy(false); }
  }

  return <main style={page}><div style={wrap}>
    <section style={card}>
      <div style={eyebrow}>VAULTFORGE CREATE</div>
      <h1 style={{fontSize:"clamp(52px,12vw,96px)",lineHeight:.9,margin:"0 0 14px"}}>Submit a real deal room.</h1>
      <Link href="/dashboard" style={ghost}>Dashboard</Link><Link href="/projects" style={btn}>Projects</Link><Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
    </section>

    {msg && <section style={card}><p style={{color: msg.includes("saved") ? "#9df3bf" : "#ffd0d0", fontWeight:900, fontSize:20}}>{msg}</p>{savedId && <Link href={`/deal/${savedId}`} style={btn}>Open Deal Room</Link>}<button style={ghost} onClick={()=>setMsg("")}>Create Another</button></section>}

    <section style={card}><div style={eyebrow}>DEAL TYPE</div>
      {(["Residential","Commercial","Land"] as DealType[]).map(t => <button key={t} style={form.property_type===t?btn:ghost} onClick={()=>set("property_type",t)}>{t}</button>)}
    </section>

    <section style={card}><div style={eyebrow}>BASICS</div><div style={grid}>
      <Field label="Deal Title" value={form.title} onChange={v=>set("title",v)} />
      <Select label="Strategy" value={form.strategy} onChange={v=>set("strategy",v)} options={["Fix & Flip","Rental","Wholesale","Creative Finance","Buy & Hold","Development","JV Needed","Lender Needed","Buyer Needed"]} />
      <Field label="City" value={form.city} onChange={v=>set("city",v)} />
      <Select label="State" value={form.state} onChange={v=>set("state",v)} options={states} />
      <Field label="Address / Area" value={form.address} onChange={v=>set("address",v)} />
      <Field label="Asking Price" value={form.asking_price} onChange={v=>set("asking_price",v)} />
      <Field label="ARV / Value" value={form.arv} onChange={v=>set("arv",v)} />
      <Field label="Repair Estimate" value={form.repair_estimate} onChange={v=>set("repair_estimate",v)} />
    </div></section>

    <section style={card}><div style={eyebrow}>OWNER / CONTACT INFO</div><div style={grid}>
      <Field label="Owner / Contact Name" value={form.owner_name} onChange={v=>set("owner_name",v)} />
      <Field label="Owner Phone" value={form.owner_phone} onChange={v=>set("owner_phone",v)} />
      <Field label="Owner Email" value={form.owner_contact_email} onChange={v=>set("owner_contact_email",v)} />
      <Select label="Preferred Contact" value={form.preferred_contact} onChange={v=>set("preferred_contact",v)} options={["Message inside VaultForge","Phone","Text","Email","Any"]} />
    </div></section>

    {form.property_type === "Residential" && <section style={card}><div style={eyebrow}>RESIDENTIAL</div><div style={grid}>
      <Field label="Bedrooms" value={form.bedrooms} onChange={v=>set("bedrooms",v)} /><Field label="Bathrooms" value={form.bathrooms} onChange={v=>set("bathrooms",v)} /><Field label="Building Sqft" value={form.building_sqft} onChange={v=>set("building_sqft",v)} /><Field label="Year Built" value={form.year_built} onChange={v=>set("year_built",v)} /><Field label="Occupancy" value={form.occupancy} onChange={v=>set("occupancy",v)} /><Field label="Condition" value={form.condition} onChange={v=>set("condition",v)} />
    </div></section>}

    {form.property_type === "Commercial" && <section style={card}><div style={eyebrow}>COMMERCIAL</div><div style={grid}>
      <Field label="Commercial Type" value={form.commercial_type} onChange={v=>set("commercial_type",v)} /><Field label="Units / Suites" value={form.units} onChange={v=>set("units",v)} /><Field label="NOI" value={form.noi} onChange={v=>set("noi",v)} /><Field label="Cap Rate" value={form.cap_rate} onChange={v=>set("cap_rate",v)} /><Field label="Zoning" value={form.zoning} onChange={v=>set("zoning",v)} /><Field label="Tenant Status" value={form.tenant_status} onChange={v=>set("tenant_status",v)} />
    </div></section>}

    {form.property_type === "Land" && <section style={card}><div style={eyebrow}>LAND</div><div style={grid}>
      <Field label="Acres" value={form.land_acres} onChange={v=>set("land_acres",v)} /><Field label="Parcel ID" value={form.parcel_id} onChange={v=>set("parcel_id",v)} /><Field label="Zoning" value={form.zoning} onChange={v=>set("zoning",v)} /><Field label="Road Frontage" value={form.frontage} onChange={v=>set("frontage",v)} /><Field label="Utilities" value={form.utilities} onChange={v=>set("utilities",v)} /><Field label="Road Access" value={form.road_access} onChange={v=>set("road_access",v)} /><Field label="Topography" value={form.topography} onChange={v=>set("topography",v)} />
    </div></section>}

    <section style={card}><div style={eyebrow}>PHOTOS</div><input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>pick(e.target.files)} /><button style={btn} onClick={()=>fileRef.current?.click()}>Tap to choose photos ({files.length}/10)</button><div style={{...grid,marginTop:16}}>{previews.map(src=><img key={src} src={src} style={{width:"100%",height:180,objectFit:"cover",borderRadius:20}} />)}</div></section>

    <section style={card}><div style={eyebrow}>CONTEXT</div>
      <Text label="Description / Deal Summary" value={form.description} onChange={v=>set("description",v)} />
      <Text label="Seller Situation" value={form.seller_situation} onChange={v=>set("seller_situation",v)} />
      <Text label="Access Notes" value={form.access_notes} onChange={v=>set("access_notes",v)} />
      <Text label="Private Notes" value={form.private_notes} onChange={v=>set("private_notes",v)} />
    </section>

    <button onClick={submit} disabled={busy} style={{...btn,width:"100%",fontSize:22,padding:18,opacity:busy?.65:1}}>{busy ? "Saving..." : "Submit Deal"}</button>
  </div></main>;
}

function Field({label: l, value, onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <div><label style={label}>{l}</label><input style={input} value={value} onChange={e=>onChange(e.target.value)} /></div>; }
function Select({label: l, value, onChange, options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}) { return <div><label style={label}>{l}</label><select style={input} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o} value={o} style={{color:"#111"}}>{o}</option>)}</select></div>; }
function Text({label: l, value, onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <div style={{marginBottom:14}}><label style={label}>{l}</label><textarea style={{...input,minHeight:120}} value={value} onChange={e=>onChange(e.target.value)} /></div>; }
