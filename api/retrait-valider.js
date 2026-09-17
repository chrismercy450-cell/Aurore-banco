import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { retraitId, code } = req.body || {};
  if (!retraitId || !code) return res.status(400).json({ erreur: "Champs manquants." });

  const { data: retrait, error: err1 } = await supabase
    .from("retraits")
    .select("*")
    .eq("id", retraitId)
    .maybeSingle();

  if (err1) return res.status(500).json({ erreur: err1.message });
  if (!retrait) return res.status(404).json({ erreur: "Demande introuvable." });
  if (retrait.statut === "valide") return res.status(400).json({ erreur: "Deja valide." });

  if (String(code).trim() !== String(retrait.code_hash).trim()) {
    return res.status(401).json({ erreur: "Code incorrect." });
  }

  const { data: compte, error: err2 } = await supabase
    .from("comptes")
    .select("solde")
    .eq("id", retrait.compte_id)
    .maybeSingle();
  if (err2) return res.status(500).json({ erreur: err2.message });

  await supabase
    .from("comptes")
    .update({ solde: compte.solde - retrait.montant })
    .eq("id", retrait.compte_id);

  await supabase
    .from("transactions")
    .insert({
      compte_id: retrait.compte_id,
      libelle: `Retrait vers compte reel (${retrait.compte_reel})`,
      montant: -retrait.montant,
    });

  await supabase.from("retraits").update({ statut: "valide" }).eq("id", retraitId);

  return res.status(200).json({ succes: true });
}
