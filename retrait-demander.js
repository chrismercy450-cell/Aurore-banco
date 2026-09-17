import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { compteId, montant, compteReel } = req.body || {};
  const montantNum = Number(montant);

  if (!compteId || !compteReel || !montantNum || montantNum <= 0) {
    return res.status(400).json({ erreur: "Champs invalides." });
  }

  const { data: compte, error: err1 } = await supabase
    .from("comptes")
    .select("solde")
    .eq("id", compteId)
    .maybeSingle();

  if (err1) return res.status(500).json({ erreur: err1.message });
  if (!compte) return res.status(404).json({ erreur: "Compte introuvable." });
  if (compte.solde < montantNum) {
    return res.status(400).json({ erreur: "Solde insuffisant pour ce retrait." });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Remarque : le code est garde en clair (pas hache) dans la colonne
  // code_hash, car l'administrateur doit pouvoir le lire pour le
  // transmettre manuellement au client (SMS, WhatsApp...).
  const { data, error: err2 } = await supabase
    .from("retraits")
    .insert({
      compte_id: compteId,
      montant: montantNum,
      compte_reel: compteReel,
      code_hash: code,
      statut: "en_attente",
    })
    .select()
    .single();

  if (err2) return res.status(500).json({ erreur: err2.message });

  return res.status(200).json({ retraitId: data.id });
}
