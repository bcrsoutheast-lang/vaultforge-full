import Link from "next/link";
import VaultForgeDealRoomsClient from "../components/VaultForgeDealRoomsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DealRoomsPage() {
  return (
    <main className="vf-shell">
      <style>{`
        .vf-shell{min-height:100vh;background:#05070d;color:#f7f7fb;padding:18px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.vf-wrap{max-width:1180px;margin:0 auto;padding-bottom:70px}.vf-nav{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}.vf-btn{border:1px solid rgba(207,216,230,.18);background:#171c29;color:#f7f7fb;border-radius:999px;padding:13px 18px;font-weight:950;text-decoration:none;display:inline-block}.vf-gold{border:0;background:#ffdc68;color:#10131a}.vf-red{background:#271016;border-color:rgba(255,70,70,.48);color:#ffaaaa}.vf-hero{background:linear-gradient(180deg,#080d19,#050816);border:1px solid rgba(245,197,66,.28);border-radius:26px;padding:28px;margin-bottom:22px}.vf-eyebrow{color:#ffd45a;text-transform:uppercase;letter-spacing:8px;font-weight:900;font-size:14px;margin-bottom:14px}.vf-title{font-size:clamp(44px,7vw,76px);line-height:.9;letter-spacing:-4px;margin:0 0 18px;font-weight:950}.vf-copy{color:#c9d0dc;font-size:20px;line-height:1.4;margin:0}.vf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-bottom:18px}.vf-metric{background:#0b1020;border:1px solid rgba(245,197,66,.18);border-radius:20px;padding:18px}.vf-metric span{display:block;color:#c9d0dc;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:900}.vf-metric strong{display:block;font-size:36px;color:#ffd45a;margin-top:8px}.vf-card{background:linear-gradient(180deg,#080d19,#050816);border:1px solid rgba(245,197,66,.24);border-radius:26px;padding:20px}`}</style>
      <div className="vf-wrap">
        <nav className="vf-nav">
          <Link href="/command" className="vf-btn">Command</Link>
          <Link href="/deal-create" className="vf-btn vf-gold">Create Deal</Link>
          <Link href="/pain-intake" className="vf-btn">Pain Intake</Link>
          <Link href="/profile" className="vf-btn">Profile</Link>
          <Link href="/" className="vf-btn vf-red">Exit</Link>
        </nav>
        <section className="vf-hero"><div className="vf-eyebrow">VaultForge Deal Rooms</div><h1 className="vf-title">Opportunity intelligence board.</h1><p className="vf-copy">Every submitted deal becomes a room with photo, signal summary, capital/risk read, AI routing, member-fit logic, and execution next steps.</p></section>
        <VaultForgeDealRoomsClient />
      </div>
    </main>
  );
}
