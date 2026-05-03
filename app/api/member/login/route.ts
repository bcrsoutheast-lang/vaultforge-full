import { NextResponse } from "next/server";

export async function POST(req){
const {email} = await req.json();

const res = NextResponse.json({ok:true});
res.cookies.set("vf_user", email, {path:"/"});

return res;
}
