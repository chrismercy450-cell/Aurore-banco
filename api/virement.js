import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { compteId, destinataire, montant, libelle } = req.body || {};
  const montantNum = Number(montant);

  if (!compteId || !destinataire || !montantNum || montantNum <= 0) {
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
    return res.status(400).json({ erreur: "Solde insuffisant pour ce virement." });
  }

  const { error: err2 } = await supabase
    .from("comptes")
    .update({ solde: compte.solde - montantNum })
    .eq("id", compteId);
  if (err2) return res.status(500).json({ erreur: err2.message });

  const texteLibelle = `Virement — ${destinataire}${libelle ? " (" + libelle + ")" : ""}`;
  const { error: err3 } = await supabase
    .from("transactions")
    .insert({ compte_id: compteId, libelle: texteLibelle, montant: -montantNum });
  if (err3) return res.status(500).json({ erreur: err3.message });

  return res.status(200).json({ succes: true });
}
