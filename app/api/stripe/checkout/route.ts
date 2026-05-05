import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.email);

    /*
      SAFE MODE:
      This route intentionally does not hard-fail the app if Stripe env values are not ready.
      When Stripe is finalized, add STRIPE_SECRET_KEY and price IDs, then replace the
      placeholder response with real checkout session creation.
    */

    const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
    const founderPriceId =
      process.env.STRIPE_FOUNDER_PRICE_ID ||
      process.env.STRIPE_PRICE_ID ||
      "";

    if (!stripeSecret || !founderPriceId) {
      return NextResponse.json({
        ok: true,
        mode: "setup_required",
        email,
        message:
          "Stripe checkout is not connected yet. Add STRIPE_SECRET_KEY and STRIPE_FOUNDER_PRICE_ID in Vercel when ready.",
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "ready_for_stripe_connection",
      email,
      message:
        "Stripe environment values are present. Final checkout-session code can be enabled in the next Stripe step.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not start checkout.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
