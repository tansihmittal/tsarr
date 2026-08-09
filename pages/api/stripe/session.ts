import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { isRateLimited } from "@/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }

  if (isRateLimited(req, res, { limit: 5, windowMs: 60_000, keyPrefix: "stripe-session" })) {
    return;
  }

  // Never trust identity from the request body — a client could set
  // metadata.uid to any value and have a real payment misattributed to it.
  // Derive it server-side from the caller's own session instead (same
  // pattern as /api/save.ts).
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1Mt74wSIAU32P2Le7cGOZ3vq",
          quantity: 1,
        },
      ],
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${req.headers.origin}/checkout/success`,
      cancel_url: `${req.headers.origin}/checkout/payment-failed`,
      metadata: {
        email: user.email || "",
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || "",
        uid: user.id,
      },
    });

    return res.status(201).json({ session });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message });
  }
};

export default handler;
