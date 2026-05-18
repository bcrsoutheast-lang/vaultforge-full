import Link from "next/link";
import VaultForgePainRoomsClient from "../components/VaultForgePainRoomsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page = { minHeight:"100vh", background:"#05070d", color:"#f7f7fb", padding:18, fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" } as const;
const wrap = { maxWidth:1180, margin:"0 auto", paddingBottom:70 } as const;
const card = { background:"linear-gradient(180deg,#080d19,#050816)", border:"1px solid rgba(239,68,68,.28)", borderRadius:26, padding:28, marginBottom:22 } as const;
const btn = { border:"1px solid rgba(207,216,230,.18)", background:"#171c29", color:"#f7f7fb", borderRadius:999, padding:"13px 18px", fontWeight:950, textDecoration:"none", display:"inline-block" } as const;
const redBtn = { ...btn, border:0, background:"#ef4444", color:"#fff" } as const;
export default function PainRoomsPage(){return <main style={page}><div style={wrap}><nav style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}><Link href="/command" style={btn}>Command</Link><Link href="/pain-intake" style={redBtn}>Create Pain Room</Link><Link href="/deal-rooms" style={btn}>Deal Rooms</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/" style={btn}>Exit</Link></nav><section style={card}><div style={{color:"#fca5a5",letterSpacing:7,fontWeight:900,textTransform:"uppercase",fontSize:14,marginBottom:14}}>Pain Rooms</div><h1 style={{fontSize:"clamp(42px,7vw,78px)",lineHeight:.92,letterSpacing:-4,margin:"0 0 18px",fontWeight:950}}>Solution command board.</h1><p style={{color:"#c9d0dc",fontSize:22,lineHeight:1.35,margin:0}}>Every Pain Room is a Lean/Six Sigma rescue room with pressure score, blockers, DMAIC read, routed profiles, owner message, and cleanup controls.</p></section><VaultForgePainRoomsClient/></div></main>}
