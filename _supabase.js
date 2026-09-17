import { createClient } from "@supabase/supabase-js";

// Client cote serveur uniquement (jamais expose au navigateur).
// SUPABASE_URL et SUPABASE_SECRET_KEY sont des variables d'environnement
// definies dans Vercel, jamais ecrites dans le code.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
