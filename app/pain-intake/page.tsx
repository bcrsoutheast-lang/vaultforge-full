import Link from "next/link";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PainIntakePage() {
  return (
    <VaultForgeCleanShell
      active="pain-intake"
      eyebrow="PAIN INTAKE"
      title="Submit the pressure."
      subtitle="Pain Intake is the form. Pain Rooms are the execution system. No Pain Feed."
    >
      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>INTAKE FORM</div>
        <h2 className="vf-h2">Clean intake placeholder.</h2>
        <p className="vf-copy">
          Next build reconnects this to the existing Supabase pain submit logic only.
          It will create Pain Rooms, not Pain Feed or Pressure pages.
        </p>

        <form style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <input placeholder="Pain title" style={input} />
          <input placeholder="City / State" style={input} />
          <select style={input} defaultValue="">
            <option value="" disabled>Pain type</option>
            <option>Distressed seller</option>
            <option>Funding gap</option>
            <option>Stalled construction</option>
            <option>Operator needed</option>
            <option>Emergency exit</option>
          </select>
          <textarea placeholder="What is happening?" rows={5} style={input} />
        </form>

        <div className="vf-btns">
          <Link className="vf-btn" href="/pain-rooms">Open Pain Rooms</Link>
        </div>
      </section>
    </VaultForgeCleanShell>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(148,163,184,.22)",
  background: "rgba(2,6,23,.55)",
  color: "#fff",
  borderRadius: 16,
  padding: "14px 15px",
  fontSize: 16,
};