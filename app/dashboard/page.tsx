import Link from "next/link";
import { cookies } from "next/headers";

export default function Dashboard(){
  const user = cookies().get("vf_user");

  if(!user) return <div>Not logged in</div>;

  return (
    <div style={{padding:40}}>
      <h2>Dashboard</h2>

      <Link href="/submit"><button>Create Deal</button></Link>
      <Link href="/projects"><button>Projects</button></Link>
      <Link href="/network"><button>Network</button></Link>
    </div>
  );
}
