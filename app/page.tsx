import Link from "next/link";

export default function Home(){
  return (
    <div style={{padding:40}}>
      <h1>VaultForge</h1>
      <Link href="/login"><button>Login</button></Link>
    </div>
  );
}
