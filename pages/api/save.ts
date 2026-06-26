import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
}

type Data = { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  // Authenticate via JWT from Authorization header — never trust user ID from body
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Create a per-request client scoped to the user's JWT so RLS applies correctly
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { presetName, ...settings } = req.body;
  if (!presetName?.trim()) {
    return res.status(400).json({ message: "Missing preset name" });
  }

  // Enforce 20-preset limit per user (RLS already scopes this to the current user)
  const { count, error: countError } = await supabase
    .from("presets")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return res.status(500).json({ message: "Can't save data at the moment" });
  }

  if (count !== null && count >= 20) {
    return res.status(400).json({ message: "You can only save 20 presets" });
  }

  const { error } = await supabase.from("presets").insert({
    preset_name: presetName.trim(),
    data: settings,
  });

  if (error) {
    return res.status(500).json({ message: "Can't save data at the moment" });
  }

  return res.status(200).json({ message: "Saved preset successfully" });
}
