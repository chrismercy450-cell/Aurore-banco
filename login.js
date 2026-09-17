import bcrypt from "bcryptjs";
import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { identifiant, motDePasse } = req.body || {};
  if (!identifiant || !motDePasse) {
    return res.status(400).json({ erreur: "Champs manquants." });
  }

  const idPropre = identifiant.trim().toLowerCase();

  const { data: compte, error } = await supabase
    .from("comptes")
    .select("*")
    .eq("identifiant", idPropre)
    .maybeSingle();

  if (error) return res.status(500).json({ erreur: error.message });
  if (!compte) return res.status(401).json({ erreur: "Identifiant ou mot de passe incorrect." });

  const valide = await bcrypt.compare(motDePasse, compte.mot_de_passe_hash);
  if (!valide) return res.status(401).json({ erreur: "Identifiant ou mot de passe incorrect." });

  delete compte.mot_de_passe_hash;
  return res.status(200).json({ compte });
}
