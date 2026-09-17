import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ erreur: "id manquant." });

  const { data: compte, error: err1 } = await supabase
    .from("comptes")
    .select("id, identifiant, nom, numero_compte, solde, role")
    .eq("id", id)
    .maybeSingle();

  if (err1) return res.status(500).json({ erreur: err1.message });
  if (!compte) return res.status(404).json({ erreur: "Compte introuvable." });

  const { data: historique, error: err2 } = await supabase
    .from("transactions")
    .select("id, libelle, montant, created_at")
    .eq("compte_id", id)
    .order("created_at", { ascending: false });

  if (err2) return res.status(500).json({ erreur: err2.message });

  return res.status(200).json({ compte, historique });
}
