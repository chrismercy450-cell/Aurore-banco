import bcrypt from "bcryptjs";
import { supabase } from "./_supabase.js";

function genererNumeroCompte() {
  const suite = () => String(Math.floor(1000 + Math.random() * 9000));
  return `BJ26 AURR ${suite()} ${suite()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Methode non autorisee" });

  const { identifiant, motDePasse, nom } = req.body || {};
  if (!identifiant || !motDePasse || !nom) {
    return res.status(400).json({ erreur: "Champs manquants." });
  }
  if (motDePasse.length < 4) {
    return res.status(400).json({ erreur: "Le mot de passe doit contenir au moins 4 caracteres." });
  }

  const idPropre = identifiant.trim().toLowerCase();

  const { data: existant } = await supabase
    .from("comptes")
    .select("id")
    .eq("identifiant", idPropre)
    .maybeSingle();

  if (existant) {
    return res.status(409).json({ erreur: "Cet identifiant est deja utilise." });
  }

  const hash = await bcrypt.hash(motDePasse, 10);

  const { data, error } = await supabase
    .from("comptes")
    .insert({
      identifiant: idPropre,
      mot_de_passe_hash: hash,
      nom,
      numero_compte: genererNumeroCompte(),
      solde: 0,
      role: "client",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ erreur: error.message });

  delete data.mot_de_passe_hash;
  return res.status(200).json({ compte: data });
}
