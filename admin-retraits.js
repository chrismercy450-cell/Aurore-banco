import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { adminId } = req.query;
  const { data: admin } = await supabase.from("comptes").select("role").eq("id", adminId).maybeSingle();
  if (!admin || admin.role !== "admin") return res.status(403).json({ erreur: "Acces refuse." });

  const { data: retraits, error } = await supabase
    .from("retraits")
    .select("id, montant, compte_reel, code_hash, statut, created_at, comptes(identifiant, nom)")
    .eq("statut", "en_attente")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ erreur: error.message });
  return res.status(200).json({ retraits });
}
