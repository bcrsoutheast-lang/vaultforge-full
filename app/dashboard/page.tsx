import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <main className="vf-page">
      <style>{`
        .vf-page{
          min-height:100vh;
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.12),transparent 30%),
            radial-gradient(circle at top right,rgba(239,68,68,.12),transparent 28%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a);
          color:#fff;
          padding:22px 14px 80px;
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
        }

        .vf-wrap{
          max-width:1180px;
          margin:0 auto;
          display:grid;
          gap:16px
        }

        .vf-hero,.vf-card{
          border:1px solid rgba(245,197,91,.24);
          background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));
          border-radius:24px;
          padding:20px;
          box-shadow:0 24px 70px rgba(0,0,0,.28)
        }

        .vf-kicker{
          color:#f5c55b;
          font-size:12px;
          font-weight:950;
          letter-spacing:.16em;
          text-transform:uppercase
        }

        h1{
          font-size:clamp(44px,9vw,88px);
          line-height:.9;
          letter-spacing:-.07em;
          margin:10px 0 12px
        }

        p{
          color:#cbd5e1;
          font-size:18px;
          line-height:1.5;
          max-width:920px
        }

        .vf-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
          gap:14px
        }

        .vf-card.pain{
          border-color:rgba(239,68,68,.28);
          background:linear-gradient(145deg,rgba(35,8,8,.94),rgba(2,6,23,.98))
        }

        .vf-card h2{
          font-size:clamp(34px,7vw,62px);
          line-height:.9;
          letter-spacing:-.07em;
          margin:10px 0
        }

        .vf-actions{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:16px
        }

        .vf-actions a{
          color:#f8fafc;
          text-decoration:none;
          border:1px solid rgba(245,197,91,.25);
          background:rgba(245,197,91,.07);
          border-radius:999px;
          padding:11px 14px;
          font-weight:900;
          font-size:13px
        }

        .vf-actions a.primary{
          background:linear-gradient(135deg,#fde68a,#e8c46b);
          color:#111827;
          border:0
        }
      `}</style>

      <div className="vf-wrap">
        <section className="vf-hero">
          <div className="vf-kicker">VaultForge Reset Dashboard</div>
          <h1>Clean Product Reset</h1>
          <p>
            One room system. Deal Rooms and Pain Rooms live together under Rooms.
            Pain stays as the intake form. Old Opportunity, Projects, Pain Feed, and Pressure screens are retired.
          </p>
          <div className="vf-actions">
            <Link href="/rooms" className="primary">Open Rooms</Link>
            <Link href="/pain">Submit Pain</Link>
            <Link href="/message-command">Messages</Link>
          </div>
        </section>

        <section className="vf-grid">
          <article className="vf-card">
            <div className="vf-kicker">Deal Rooms</div>
            <h2>Deals</h2>
            <p>All deals, projects, opportunities, properties, and investments feed into one room system.</p>
            <div className="vf-actions">
              <Link href="/rooms" className="primary">Open Rooms</Link>
              <Link href="/submit">Create Deal</Link>
            </div>
          </article>

          <article className="vf-card pain">
            <div className="vf-kicker" style={{color:"#fca5a5"}}>Pain Execution</div>
            <h2>Pain</h2>
            <p>Pain is intake. Pain Rooms are the execution lane for pressure, distress, funding gaps, and blockers.</p>
            <div className="vf-actions">
              <Link href="/pain" className="primary">Submit Pain</Link>
              <Link href="/rooms">Open Pain Rooms</Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}