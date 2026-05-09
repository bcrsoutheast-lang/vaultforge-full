
import BuyBucketClient from "./BuyBucketClient";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(178,24,24,.22), transparent 28%), radial-gradient(circle at 85% 10%, rgba(232,196,107,.16), transparent 24%), linear-gradient(180deg,#020202 0%,#070707 55%,#020202 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "24px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
};

export default function BuyBucketPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <VaultForgeMemberNav
          title="Buy Bucket"
          subtitle="Saved targets, acquisition interest, and opportunity tracking"
        />

        <BuyBucketClient />
      </div>
    </main>
  );
}
