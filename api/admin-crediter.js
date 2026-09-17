import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { adminId, compteId, montant } = req.body || {};
  const montantNum = Number(montant);

  const { data: admin } = await supabase.from("comptes").select("role").eq("id", adminId).maybeSingle();
  if (!admin || admin.role !== "admin") return res.status(403).json({ erreur: "Acces refuse." });

  if (!compteId || !montantNum || montantNum <= 0) {
    return res.status(400).json({ erreur: "Champs invalides." });
  }

  const { data: compte, error: err1 } = await supabase
    .from("comptes")
    .select("solde")
    .eq("id", compteId)
    .maybeSingle();
  if (err1) return res.status(500).json({ erreur: err1.message });
  if (!compte) return res.status(404).json({ erreur: "Compte introuvable." });

  await supabase.from("comptes").update({ solde: compte.solde + montantNum }).eq("id", compteId);
  await supabase.from("transactions").insert({
    compte_id: compteId,
    libelle: "Credit — Banque (depot manuel)",
    montant: montantNum,
  });

  return res.status(200).json({ succes: true });
}
