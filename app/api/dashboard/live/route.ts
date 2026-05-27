import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // For now this returns mock data from localStorage logic
    // Later you can swap this to pull from Supabase/Postgres
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "";

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // This runs server-side, so we can't access localStorage directly
    // For now return empty structure - client will populate from localStorage
    // TODO: Replace with Supabase queries when you migrate off localStorage
    
    const data = {
      user: {
        email,
        name: "VaultForge User"
      },
      stats: {
        deals: {
          drafts: 0,
          saved: 0,
          underContract: 0,
          sold: 0,
          totalProfit: 0
        },
        jobs: {
          assigned: 0,
          completed: 0
        },
        alerts: {
          unread: 0,
          total: 0
        }
      },
      recentActivity: []
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, data } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Handle dashboard actions here
    // For now just acknowledge - add Supabase logic later
    
    return NextResponse.json({ success: true, action, email });
  } catch (error) {
    console.error("Dashboard POST error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
