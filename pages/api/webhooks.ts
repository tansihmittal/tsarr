import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

// secure connection to firebase
function getServiceAccount() {
  try {
    // Try to read permissions.json file
    const permissionsPath = join(process.cwd(), 'permissions.json');
    const serviceAccountFile = readFileSync(permissionsPath, 'utf8');
    return JSON.parse(serviceAccountFile);
  } catch (error) {
    // Fallback to environment variables if permissions.json doesn't exist
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };
  }
}

function initializeFirebaseApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = getServiceAccount();
  
  return admin.initializeApp({
    credential: serviceAccount && serviceAccount.private_key 
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
  });
}

// stripe setups
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const app = initializeFirebaseApp();
    const requestBuffer = await buffer(req);

    // create a signature from buffer stream
    const payload = requestBuffer.toString();
    const signature = req.headers["stripe-signature"];

    let event;

    // verify the event is from stripe
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.WEBHOOK_SECRET
      );
    } catch (error: any) {
      return res.status(400).send(`webhook error: ${error.message}`);
    }

    // handle the chechout session completion methods

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      await app
        .firestore()
        .collection("users")
        .doc(session.metadata.uid)
        .collection("subscriptions")
        .doc(session.invoice)
        .set(
          {
            amount: session.amount_total / 100,
            session_id: session.id,
            subscribed_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        .then(() => {
          return res.status(200).send("SUCCESS: Order has been added to db");
        })
        .catch((err) => {
          return res.status(400).send(`WEBHOOK ERROR: ${err.message}`);
        });
    } else {
      return res.status(401).send("Canceled: Order has been cancelled");
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};

export const config = {
  api: {
    bodyParser: false,
    externalResources: false,
  },
};

export default handler;
