import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }

  if (!firestore) {
    return res.status(500).send("Firebase not configured");
  }

  const requestBuffer = await buffer(req);
  const payload = requestBuffer.toString();
  const signature = req.headers["stripe-signature"];

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature as string,
      process.env.WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    return res.status(400).send(`webhook error: ${error.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).send("Ignored: event type not handled");
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const uid = session.metadata?.uid;
  if (!uid) {
    return res.status(400).send("Missing uid in session metadata");
  }

  try {
    await firestore
      .collection("users")
      .doc(uid)
      .collection("subscriptions")
      .doc(String(session.invoice))
      .set(
        {
          amount: (session.amount_total || 0) / 100,
          session_id: session.id,
          subscribed_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    return res.status(200).send("SUCCESS: Order has been added to db");
  } catch (err: any) {
    return res.status(500).send(`WEBHOOK ERROR: ${err.message}`);
  }
};

export const config = {
  api: {
    bodyParser: false,
    externalResources: false,
  },
};

export default handler;
