import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizeMember(row: any) {
  if (!row) return null;

  const name =
    row.name ||
    row.full_name ||
    row.fullName ||
    row.company ||
    row.email ||
    row.member_email ||
    "VaultForge Member";

  const email = String(row.email || row.member_email || row.user_email || "").trim().toLowerCase();

  const role =
    row.role ||
    row.member_role ||
    (Array.isArray(row.member_types) ? row.member_types[0] : "") ||
    row.type ||
    "Member";

  const state =
    row.state ||
    (Array.isArray(row.buy_box_states) ? row.buy_box_states[0] : "") ||
    row.home_state ||
    "Not listed";

  const status = String(row.member_status || row.status || "active").trim().toLowerCase();

  const isDeleted = row.is_deleted === true || status === "deleted" || status === "removed";
  const isSuspended = row.is_suspended === true || status === "suspended";

  return {
    ...row,
    id: row.id,
    name,
    email,
    role,
    state,
    company: row.company || "",
    bio: row.bio || row.strategy || row.buy_box || "",
    status,
    member_status: row.member_status || row.status || "active",
    payment_status: row.payment_status || "unpaid",
    is_active: row.is_active !== false,
    is_deleted: isDeleted,
    is_suspended: isSuspended,
    profile_photo_url: row.profile_photo_url || row.profilePhotoUrl || "",
    buy_box_states: row.buy_box_states || row.markets || [],
    buy_box_types: row.buy_box_types || row.property_types || [],
    buy_box_strategies: row.buy_box_strategies || row.strategies || [],
    member_types: row.member_types || [role].filter(Boolean),
    needs: row.needs || row.deal_needs || row.what_i_need || [],
    can_provide: row.can_provide || row.what_i_provide || [],
    funding_capacity: row.funding_capacity || row.fundingCapacity || "",
    alert_frequency: row.alert_frequency || "",
    max_alerts_per_day: row.max_alerts_per_day || "",
    created_at: row.created_at || row.updated_at || null,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const { searchParams } = new URL(request.url);

    const state = clean(searchParams.get("state"));
    const role = clean(searchParams.get("role"));
    const includeInactive = clean(searchParams.get("includeInactive")) === "1";

    const { data, error } = await supabase
      .from("vf_members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load network.",
          details: error.message,
          members: [],
        },
        { status: 500 }
      );
    }

    let members = (data || [])
      .map(normalizeMember)
      .filter(Boolean) as any[];

    if (!includeInactive) {
      members = members.filter((member) => !member.is_deleted && !member.is_suspended);
    }

    if (state && state !== "All") {
      const wanted = state.toLowerCase();

      members = members.filter((member) => {
        const homeState = String(member.state || "").toLowerCase();
        const states = Array.isArray(member.buy_box_states)
          ? member.buy_box_states.map((x: any) => String(x || "").toLowerCase())
          : String(member.buy_box_states || "")
              .split(",")
              .map((x) => x.trim().toLowerCase());

        return homeState === wanted || states.includes(wanted) || states.includes("national");
      });
    }

    if (role && role !== "All") {
      const wanted = role.toLowerCase();

      members = members.filter((member) => {
        const primary = String(member.role || "").toLowerCase();
        const types = Array.isArray(member.member_types)
          ? member.member_types.map((x: any) => String(x || "").toLowerCase())
          : String(member.member_types || "")
              .split(",")
              .map((x) => x.trim().toLowerCase());

        return primary === wanted || types.includes(wanted);
      });
    }

    return NextResponse.json({
      ok: true,
      source: "vf_members",
      members,
      counts: {
        returned: members.length,
        raw: data?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Network route failed.",
        details: error?.message || String(error),
        members: [],
      },
      { status: 500 }
    );
  }
}
