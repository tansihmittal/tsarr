import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://buvpbsheemxbwydyshza.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dnBic2hlZW14Ynd5ZHlzaHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTM4MjgsImV4cCI6MjA5Njk4OTgyOH0.fZUZZ8xyMYLMxRPdNCgcTG5KtYKc6CO_dXIE6Ey3LMs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
