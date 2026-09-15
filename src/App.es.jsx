import React, { useState, useEffect } from "react";

/*
  DEMO PEDAGÓGICA — "Aurore Banque"
  ----------------------------------
  Esta es una maqueta funcional (solo front-end, datos en memoria)
  que ilustra los componentes de un banco en línea:
    1) Registro (el cliente crea su propia cuenta)
    2) Autenticación (aquí simulada, sin seguridad real)
    3) Panel principal (saldo, cuenta)
    4) Transferencia entre cuentas / a un tercero
    5) Retiro hacia una cuenta bancaria real, validado con un código enviado
       manualmente por el administrador (tú, "el banco")
    6) Historial de transacciones

  En un proyecto real, cada paso tendría un equivalente del lado del servidor:
    - Registro/Autenticación        -> backend + contraseña cifrada + tokens (JWT)
    - Cuentas/saldo                -> base de datos (PostgreSQL/MySQL)
    - Transferencia/Retiro          -> API segura + transacción atómica en la base
    - Código de validación          -> servicio SMS (ej. Twilio) a futuro,
                                        enviado manualmente por ti por ahora
    - Historial                     -> consultas a la base de datos, paginadas
*/

const HISTORIQUE_DEMO = [
  { id: 1, libelle: "Salario — Septiembre", montant: 180000, date: "2026-09-01" },
  { id: 2, libelle: "Alquiler", montant: -60000, date: "2026-09-03" },
  { id: 3, libelle: "Compra — Tienda en línea", montant: -15000, date: "2026-09-10" },
];

const UTILISATEURS_INITIAUX = [
  {
    identifiant: "cliente",
    motDePasse: "1234",
    nom: "Cliente Demo",
    compte: { nomCompte: "Cuenta corriente", numero: "BJ26 AURR 0001 2345 6789", solde: 250000 },
    historique: HISTORIQUE_DEMO,
  },
];

function formatMontant(valeur) {
  const signe = valeur >= 0 ? "+" : "";
  return `${signe}${valeur.toLocaleString("es-ES")} FCFA`;
}

// Credenciales del área de administrador ("el banco", eres tú).
// En un proyecto real, esta sería una cuenta aparte, protegida como cualquier
// cuenta de usuario (contraseña cifrada, etc.), nunca escrita en texto plano en el código.
const ADMIN = { identifiant: "banco", motDePasse: "admin2026" };

function genererNumeroCompte() {
  const suite = () => String(Math.floor(1000 + Math.random() * 9000));
  return `BJ26 AURR ${suite()} ${suite()}`;
}

function LogoMarque({ taille = 40 }) {
  return (
    <svg viewBox="0 0 64 64" style={{ width: taille, height: taille, flexShrink: 0 }}>
      <circle cx="32" cy="32" r="32" fill="#0F1A2E" />
      <path d="M12 38 a20 20 0 0 1 40 0 Z" fill="#C9A227" />
      <rect x="10" y="38" width="44" height="3.5" fill="#C9A227" />
      <rect x="10" y="44.5" width="44" height="2.5" fill="#C9A227" opacity="0.55" />
      <rect x="10" y="50" width="44" height="2" fill="#C9A227" opacity="0.3" />
    </svg>
  );
}

function LogoComplet({ tailleTexte = 20, tailleMarque = 34 }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMarque taille={tailleMarque} />
      <div className="ab-serif" style={{ fontSize: tailleTexte, fontWeight: 600, color: "#0F1A2E", letterSpacing: 0.2 }}>
        Aurore Banque
      </div>
    </div>
  );
}

// Ilustraciones dibujadas localmente (sin imágenes externas), para un renderizado fiable
// en cualquier lugar, incluso sin conexión. Reemplazar por fotos reales una vez que el
// sitio esté realmente alojado (ver la nota anterior sobre bancos de imágenes gratuitas).
function SceneGuichet() {
  return (
    <svg viewBox="0 0 320 180" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="0" y="0" width="320" height="180" fill="#132038" />
      <rect x="220" y="0" width="60" height="90" fill="#1C2C4A" />
      <rect x="0" y="128" width="320" height="52" fill="#0F1A2E" />
      <rect x="20" y="118" width="130" height="18" rx="4" fill="#0B1526" />
      <ellipse cx="245" cy="150" rx="26" ry="30" fill="#0B1526" />
      <circle cx="245" cy="104" r="14" fill="#EAD98F" />
      <path d="M220 148 q25 -46 50 0 Z" fill="#1C2C4A" />
      <ellipse cx="95" cy="150" rx="24" ry="28" fill="#0B1526" />
      <circle cx="95" cy="106" r="13" fill="#D9C7A8" />
      <path d="M72 148 q23 -42 46 0 Z" fill="#C9A227" />
      <rect x="60" y="150" width="70" height="6" rx="3" fill="#1B7F5C" />
      <circle cx="270" cy="34" r="4" fill="#C9A227" />
      <circle cx="255" cy="20" r="2.5" fill="#C9A227" />
    </svg>
  );
}

function ScenePoigneeDeMain() {
  return (
    <svg viewBox="0 0 320 180" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="0" y="0" width="320" height="180" fill="#132038" />
      <rect x="0" y="0" width="70" height="180" fill="#1C2C4A" />
      <ellipse cx="110" cy="150" rx="26" ry="30" fill="#0B1526" />
      <circle cx="110" cy="102" r="15" fill="#EAD98F" />
      <path d="M84 146 q26 -48 52 0 Z" fill="#1B7F5C" />
      <ellipse cx="210" cy="150" rx="26" ry="30" fill="#0B1526" />
      <circle cx="210" cy="102" r="15" fill="#D9C7A8" />
      <path d="M184 146 q26 -48 52 0 Z" fill="#3C4454" />
      <rect x="150" y="118" width="20" height="8" rx="4" fill="#C9A227" />
      <rect x="60" y="66" width="30" height="4" rx="2" fill="#C9A227" />
      <rect x="230" y="60" width="34" height="4" rx="2" fill="#C9A227" />
    </svg>
  );
}

function SceneReunion() {
  return (
    <svg viewBox="0 0 320 180" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="0" y="0" width="320" height="180" fill="#132038" />
      <rect x="40" y="128" width="240" height="10" rx="4" fill="#0F1A2E" />
      <rect x="60" y="138" width="200" height="42" fill="#0B1526" />
      <ellipse cx="90" cy="128" rx="22" ry="26" fill="#0B1526" />
      <circle cx="90" cy="84" r="13" fill="#D9C7A8" />
      <path d="M68 122 q22 -40 44 0 Z" fill="#C9A227" />
      <ellipse cx="160" cy="128" rx="22" ry="26" fill="#0B1526" />
      <circle cx="160" cy="84" r="13" fill="#EAD98F" />
      <path d="M138 122 q22 -40 44 0 Z" fill="#1B7F5C" />
      <ellipse cx="230" cy="128" rx="22" ry="26" fill="#0B1526" />
      <circle cx="230" cy="84" r="13" fill="#B98D5E" />
      <path d="M208 122 q22 -40 44 0 Z" fill="#3C4454" />
      <rect x="120" y="150" width="80" height="5" rx="2.5" fill="#8A93A3" />
      <rect x="140" y="160" width="40" height="4" rx="2" fill="#C9A227" />
    </svg>
  );
}

const DIAPOSITIVES = [
  {
    titre: "Una bienvenida cálida, como en la sucursal",
    sousTitre: "Una cuenta simple, con un servicio real detrás.",
    Scene: SceneGuichet,
    image: "https://images.pexels.com/photos/38815862/pexels-photo-38815862.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  },
  {
    titre: "Relaciones de confianza",
    sousTitre: "Cada cliente cuenta, en cada paso.",
    Scene: ScenePoigneeDeMain,
    image: "https://images.pexels.com/photos/8439704/pexels-photo-8439704.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  },
  {
    titre: "Un acompañamiento personalizado",
    sousTitre: "Nos tomamos el tiempo de responder tus preguntas.",
    Scene: SceneReunion,
    image: "https://images.pexels.com/photos/8441861/pexels-photo-8441861.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  },
];

export default function AuroreBanque() {
  const [utilisateurs, setUtilisateurs] = useState(UTILISATEURS_INITIAUX);
  const [utilisateurActifId, setUtilisateurActifId] = useState(null);

  const [modeAuth, setModeAuth] = useState("connexion"); // "connexion" | "inscription" | "admin"
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreurConnexion, setErreurConnexion] = useState("");

  const [estAdmin, setEstAdmin] = useState(false);
  const [idAdminSaisi, setIdAdminSaisi] = useState("");
  const [motDePasseAdminSaisi, setMotDePasseAdminSaisi] = useState("");
  const [erreurAdmin, setErreurAdmin] = useState("");
  const [clientSelectionne, setClientSelectionne] = useState("");
  const [montantCredit, setMontantCredit] = useState("");
  const [messageCredit, setMessageCredit] = useState(null);

  const [diapositiveActuelle, setDiapositiveActuelle] = useState(0);

  useEffect(() => {
    const minuteur = setInterval(() => {
      setDiapositiveActuelle((i) => (i + 1) % DIAPOSITIVES.length);
    }, 4000);
    return () => clearInterval(minuteur);
  }, []);

  const [nomInscription, setNomInscription] = useState("");
  const [identifiantInscription, setIdentifiantInscription] = useState("");
  const [motDePasseInscription, setMotDePasseInscription] = useState("");
  const [erreurInscription, setErreurInscription] = useState("");

  const [ongletActif, setOngletActif] = useState("apercu");

  const [destinataire, setDestinataire] = useState("");
  const [montantVirement, setMontantVirement] = useState("");
  const [libelleVirement, setLibelleVirement] = useState("");
  const [messageVirement, setMessageVirement] = useState(null);

  const [montantRetrait, setMontantRetrait] = useState("");
  const [compteReelRetrait, setCompteReelRetrait] = useState("");
  const [statutRetrait, setStatutRetrait] = useState(null); // null | "en_attente" | "valide"
  const [codeGenere, setCodeGenere] = useState("");
  const [codeSaisi, setCodeSaisi] = useState("");
  const [messageRetrait, setMessageRetrait] = useState(null);

  const utilisateurActif = utilisateurs.find((u) => u.identifiant === utilisateurActifId);
  const compte = utilisateurActif?.compte;
  const historique = utilisateurActif?.historique || [];

  function majUtilisateurActif(fonctionMaj) {
    setUtilisateurs((liste) =>
      liste.map((u) => (u.identifiant === utilisateurActifId ? fonctionMaj(u) : u))
    );
  }

  function reinitialiserFormulaires() {
    setIdentifiant("");
    setMotDePasse("");
    setErreurConnexion("");
    setNomInscription("");
    setIdentifiantInscription("");
    setMotDePasseInscription("");
    setErreurInscription("");
    setOngletActif("apercu");
  }

  function gererConnexion(e) {
    e.preventDefault();
    const idSaisi = identifiant.trim().toLowerCase();
    const trouve = utilisateurs.find((u) => u.identifiant === idSaisi && u.motDePasse === motDePasse);
    if (trouve) {
      setErreurConnexion("");
      setUtilisateurActifId(trouve.identifiant);
    } else {
      setErreurConnexion("Usuario o contraseña incorrectos.");
    }
  }

  function gererInscription(e) {
    e.preventDefault();
    const idPropre = identifiantInscription.trim().toLowerCase();

    if (!nomInscription.trim()) {
      setErreurInscription("Indica tu nombre.");
      return;
    }
    if (!idPropre) {
      setErreurInscription("Elige un usuario.");
      return;
    }
    if (motDePasseInscription.length < 4) {
      setErreurInscription("La contraseña debe contener al menos 4 caracteres.");
      return;
    }
    if (utilisateurs.some((u) => u.identifiant === idPropre)) {
      setErreurInscription("Este usuario ya está en uso.");
      return;
    }

    const nouveauCompte = {
      identifiant: idPropre,
      motDePasse: motDePasseInscription,
      nom: nomInscription.trim(),
      compte: { nomCompte: "Cuenta corriente", numero: genererNumeroCompte(), solde: 0 },
      historique: [],
    };

    setUtilisateurs((liste) => [...liste, nouveauCompte]);
    setErreurInscription("");
    // Inicio de sesión automático tras el registro, como lo haría una app real.
    setUtilisateurActifId(idPropre);
  }

  function gererConnexionAdmin(e) {
    e.preventDefault();
    if (idAdminSaisi.trim().toLowerCase() === ADMIN.identifiant && motDePasseAdminSaisi === ADMIN.motDePasse) {
      setErreurAdmin("");
      setEstAdmin(true);
    } else {
      setErreurAdmin("Usuario o contraseña de administrador incorrectos.");
    }
  }

  function gererCredit(e) {
    e.preventDefault();
    const montant = parseInt(montantCredit, 10);

    if (!clientSelectionne) {
      setMessageCredit({ type: "erreur", texte: "Elige una cuenta de cliente." });
      return;
    }
    if (!montant || montant <= 0) {
      setMessageCredit({ type: "erreur", texte: "Monto inválido." });
      return;
    }

    setUtilisateurs((liste) =>
      liste.map((u) =>
        u.identifiant === clientSelectionne
          ? {
              ...u,
              compte: { ...u.compte, solde: u.compte.solde + montant },
              historique: [
                {
                  id: u.historique.length + 1,
                  libelle: "Crédito — Banco (depósito manual)",
                  montant: montant,
                  date: new Date().toISOString().slice(0, 10),
                },
                ...u.historique,
              ],
            }
          : u
      )
    );

    setMessageCredit({ type: "succes", texte: `${montant.toLocaleString("es-ES")} FCFA acreditados en la cuenta de ${clientSelectionne}.` });
    setMontantCredit("");
  }

  function gererVirement(e) {
    e.preventDefault();
    const montant = parseInt(montantVirement, 10);

    if (!destinataire.trim()) {
      setMessageVirement({ type: "erreur", texte: "Indica un destinatario." });
      return;
    }
    if (!montant || montant <= 0) {
      setMessageVirement({ type: "erreur", texte: "Monto inválido." });
      return;
    }
    if (montant > compte.solde) {
      setMessageVirement({ type: "erreur", texte: "Saldo insuficiente para esta transferencia." });
      return;
    }

    majUtilisateurActif((u) => ({
      ...u,
      compte: { ...u.compte, solde: u.compte.solde - montant },
      historique: [
        {
          id: u.historique.length + 1,
          libelle: `Transferencia — ${destinataire}${libelleVirement ? " (" + libelleVirement + ")" : ""}`,
          montant: -montant,
          date: new Date().toISOString().slice(0, 10),
        },
        ...u.historique,
      ],
    }));

    setMessageVirement({ type: "succes", texte: `Transferencia de ${montant.toLocaleString("es-ES")} FCFA enviada a ${destinataire}.` });
    setDestinataire("");
    setMontantVirement("");
    setLibelleVirement("");
  }

  function demanderRetrait(e) {
    e.preventDefault();
    const montant = parseInt(montantRetrait, 10);

    if (!compteReelRetrait.trim()) {
      setMessageRetrait({ type: "erreur", texte: "Indica el número de la cuenta bancaria real." });
      return;
    }
    if (!montant || montant <= 0) {
      setMessageRetrait({ type: "erreur", texte: "Monto inválido." });
      return;
    }
    if (montant > compte.solde) {
      setMessageRetrait({ type: "erreur", texte: "Saldo insuficiente para este retiro." });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setCodeGenere(code);
    setStatutRetrait("en_attente");
    setMessageRetrait(null);
  }

  function validerRetrait(e) {
    e.preventDefault();
    const codeSaisiPropre = codeSaisi.replace(/\D/g, "");
    if (codeSaisiPropre !== codeGenere) {
      setMessageRetrait({ type: "erreur", texte: `Código incorrecto (recibido: "${codeSaisi}"). Vuelve a pedir el código al administrador.` });
      return;
    }

    const montant = parseInt(montantRetrait, 10);
    majUtilisateurActif((u) => ({
      ...u,
      compte: { ...u.compte, solde: u.compte.solde - montant },
      historique: [
        {
          id: u.historique.length + 1,
          libelle: `Retiro hacia cuenta real (${compteReelRetrait})`,
          montant: -montant,
          date: new Date().toISOString().slice(0, 10),
        },
        ...u.historique,
      ],
    }));
    setStatutRetrait("valide");
    setMessageRetrait({ type: "succes", texte: "Retiro validado y enviado a la cuenta real." });
  }

  function reinitialiserRetrait() {
    setMontantRetrait("");
    setCompteReelRetrait("");
    setStatutRetrait(null);
    setCodeGenere("");
    setCodeSaisi("");
    setMessageRetrait(null);
  }

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
    .ab-root { font-family: 'Inter', sans-serif; background: #F5F6F8; color: #1B2434; min-height: 480px; }
    .ab-serif { font-family: 'Fraunces', serif; }
  `;

  const champInput = { border: "1px solid #D6DAE1", fontSize: 14 };
  const label = { fontSize: 13, color: "#3C4454", display: "block", marginBottom: 4 };
  const boutonPrincipal = { background: "#0F1A2E", color: "#fff", fontSize: 14, fontWeight: 500 };

  if (estAdmin) {
    return (
      <div className="ab-root p-6">
        <style>{style}</style>

        <div className="flex items-center justify-between mb-6">
          <div>
            <LogoComplet />
            <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 4 }}>Área de administrador</div>
          </div>
          <button
            onClick={() => {
              setEstAdmin(false);
              setIdAdminSaisi("");
              setMotDePasseAdminSaisi("");
              setClientSelectionne("");
              setMontantCredit("");
              setMessageCredit(null);
            }}
            style={{ fontSize: 13, color: "#5B6472", background: "none", border: "none", cursor: "pointer" }}
          >
            Cerrar sesión
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6" style={{ border: "1px solid #E4E7EC", maxWidth: 460 }}>
          <div className="ab-serif" style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Acreditar una cuenta de cliente</div>
          <div style={{ fontSize: 13, color: "#5B6472", marginBottom: 16 }}>
            Úsalo cuando un cliente te haya pagado por otro medio (Mobile Money, efectivo...)
            y quieras reflejar ese dinero (ficticio en la app) en su cuenta.
          </div>

          <form onSubmit={gererCredit}>
            <label style={label}>Cuenta del cliente</label>
            <select
              value={clientSelectionne}
              onChange={(e) => setClientSelectionne(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded"
              style={champInput}
            >
              <option value="">— Elegir un cliente —</option>
              {utilisateurs.map((u) => (
                <option key={u.identifiant} value={u.identifiant}>
                  {u.nom} ({u.identifiant}) — {u.compte.solde.toLocaleString("es-ES")} FCFA
                </option>
              ))}
            </select>

            <label style={label}>Monto a acreditar (FCFA)</label>
            <input
              value={montantCredit}
              onChange={(e) => setMontantCredit(e.target.value)}
              placeholder="50000"
              className="w-full mb-4 px-3 py-2 rounded"
              style={champInput}
            />

            {messageCredit && (
              <div style={{ fontSize: 13, marginBottom: 12, color: messageCredit.type === "erreur" ? "#B23B2E" : "#1B7F5C" }}>
                {messageCredit.texte}
              </div>
            )}

            <button type="submit" className="w-full py-2 rounded" style={{ background: "#1B7F5C", color: "#fff", fontSize: 14, fontWeight: 500 }}>
              Acreditar la cuenta
            </button>
          </form>
        </div>

        <div style={{ fontSize: 13, color: "#5B6472", marginBottom: 8 }}>Todas las cuentas de clientes</div>
        <div className="bg-white rounded-lg p-4" style={{ border: "1px solid #E4E7EC" }}>
          {utilisateurs.map((u) => (
            <div key={u.identifiant} className="flex justify-between py-3" style={{ borderBottom: "1px solid #EEF0F3", fontSize: 14 }}>
              <div>
                <div>{u.nom} <span style={{ color: "#8A93A3" }}>({u.identifiant})</span></div>
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{u.compte.numero}</div>
              </div>
              <span style={{ fontWeight: 500 }}>{u.compte.solde.toLocaleString("es-ES")} FCFA</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!utilisateurActif) {
    return (
      <div
        className="ab-root flex flex-col items-center p-6"
        style={{
          minHeight: 480,
          background:
            "radial-gradient(circle at 15% 10%, rgba(201,162,39,0.20), transparent 40%), " +
            "radial-gradient(circle at 85% 85%, rgba(27,127,92,0.18), transparent 45%), " +
            "linear-gradient(180deg, #0B1526 0%, #14223B 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>{style}</style>

        <div
          className="w-full max-w-sm rounded-lg mb-4"
          style={{ height: 170, overflow: "hidden", position: "relative" }}
        >
          {DIAPOSITIVES.map((diapo, i) => (
            <div
              key={diapo.titre}
              style={{
                position: "absolute",
                inset: 0,
                opacity: i === diapositiveActuelle ? 1 : 0,
                transition: "opacity 0.6s ease",
              }}
            >
              <diapo.Scene />
              <img
                src={diapo.image}
                alt=""
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(11,21,38,0.85), rgba(11,21,38,0.05) 60%)",
                }}
              />
              <div style={{ position: "absolute", left: 16, bottom: 14, right: 16, color: "#fff" }}>
                <div className="ab-serif" style={{ fontSize: 16, fontWeight: 600 }}>{diapo.titre}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{diapo.sousTitre}</div>
              </div>
            </div>
          ))}

          <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 5 }}>
            {DIAPOSITIVES.map((_, i) => (
              <div
                key={i}
                onClick={() => setDiapositiveActuelle(i)}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  cursor: "pointer",
                  background: i === diapositiveActuelle ? "#C9A227" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm bg-white rounded-lg p-8" style={{ boxShadow: "0 1px 3px rgba(15,26,46,0.08)", border: "1px solid #E4E7EC" }}>
          <div className="mb-6">
            <LogoComplet tailleTexte={22} tailleMarque={40} />
            <div style={{ fontSize: 13, color: "#5B6472", marginTop: 8 }}>
              {modeAuth === "connexion" && "Acceso a tu área de cliente"}
              {modeAuth === "inscription" && "Crea tu cuenta"}
              {modeAuth === "admin" && "Acceso al área del banco"}
            </div>
          </div>

          <div className="flex gap-2 mb-6" style={{ flexWrap: "wrap" }}>
            <button
              onClick={() => setModeAuth("connexion")}
              className="flex-1 py-2 rounded"
              style={{
                fontSize: 13,
                fontWeight: 500,
                background: modeAuth === "connexion" ? "#0F1A2E" : "#fff",
                color: modeAuth === "connexion" ? "#fff" : "#3C4454",
                border: "1px solid " + (modeAuth === "connexion" ? "#0F1A2E" : "#E4E7EC"),
              }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setModeAuth("inscription")}
              className="flex-1 py-2 rounded"
              style={{
                fontSize: 13,
                fontWeight: 500,
                background: modeAuth === "inscription" ? "#0F1A2E" : "#fff",
                color: modeAuth === "inscription" ? "#fff" : "#3C4454",
                border: "1px solid " + (modeAuth === "inscription" ? "#0F1A2E" : "#E4E7EC"),
              }}
            >
              Crear una cuenta
            </button>
            <button
              onClick={() => setModeAuth("admin")}
              className="flex-1 py-2 rounded"
              style={{
                fontSize: 13,
                fontWeight: 500,
                background: modeAuth === "admin" ? "#0F1A2E" : "#fff",
                color: modeAuth === "admin" ? "#fff" : "#3C4454",
                border: "1px solid " + (modeAuth === "admin" ? "#0F1A2E" : "#E4E7EC"),
              }}
            >
              Área del banco
            </button>
          </div>

          {modeAuth === "connexion" && (
            <form onSubmit={gererConnexion}>
              <label style={label}>Usuario</label>
              <input
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                placeholder="cliente"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full mb-4 px-3 py-2 rounded"
                style={champInput}
              />

              <label style={label}>Contraseña</label>
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••"
                className="w-full mb-2 px-3 py-2 rounded"
                style={champInput}
              />

              {erreurConnexion && (
                <div style={{ color: "#B23B2E", fontSize: 13, marginBottom: 8 }}>{erreurConnexion}</div>
              )}

              <button type="submit" className="w-full py-2 rounded mt-4" style={boutonPrincipal}>
                Iniciar sesión
              </button>

              <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 14, textAlign: "center" }}>
                Demo — usuario: <b>cliente</b> / contraseña: <b>1234</b>
              </div>
            </form>
          )}

          {modeAuth === "inscription" && (
            <form onSubmit={gererInscription}>
              <label style={label}>Nombre completo</label>
              <input
                value={nomInscription}
                onChange={(e) => setNomInscription(e.target.value)}
                placeholder="Ej: María Torres"
                className="w-full mb-4 px-3 py-2 rounded"
                style={champInput}
              />

              <label style={label}>Usuario deseado</label>
              <input
                value={identifiantInscription}
                onChange={(e) => setIdentifiantInscription(e.target.value)}
                placeholder="Ej: maria"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full mb-4 px-3 py-2 rounded"
                style={champInput}
              />

              <label style={label}>Contraseña</label>
              <input
                type="password"
                value={motDePasseInscription}
                onChange={(e) => setMotDePasseInscription(e.target.value)}
                placeholder="Al menos 4 caracteres"
                className="w-full mb-2 px-3 py-2 rounded"
                style={champInput}
              />

              {erreurInscription && (
                <div style={{ color: "#B23B2E", fontSize: 13, marginBottom: 8 }}>{erreurInscription}</div>
              )}

              <button type="submit" className="w-full py-2 rounded mt-4" style={boutonPrincipal}>
                Crear mi cuenta
              </button>

              <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 14, textAlign: "center" }}>
                La cuenta se crea con un saldo de 0 FCFA. En la app real, sería el
                banco (el administrador) quien acreditaría dinero en esta cuenta.
              </div>
            </form>
          )}

          {modeAuth === "admin" && (
            <form onSubmit={gererConnexionAdmin}>
              <label style={label}>Identifiant administrateur</label>
              <input
                value={idAdminSaisi}
                onChange={(e) => setIdAdminSaisi(e.target.value)}
                placeholder="banco"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full mb-4 px-3 py-2 rounded"
                style={champInput}
              />

              <label style={label}>Contraseña</label>
              <input
                type="password"
                value={motDePasseAdminSaisi}
                onChange={(e) => setMotDePasseAdminSaisi(e.target.value)}
                placeholder="••••"
                className="w-full mb-2 px-3 py-2 rounded"
                style={champInput}
              />

              {erreurAdmin && (
                <div style={{ color: "#B23B2E", fontSize: 13, marginBottom: 8 }}>{erreurAdmin}</div>
              )}

              <button type="submit" className="w-full py-2 rounded mt-4" style={boutonPrincipal}>
                Entrar al área del banco
              </button>

              
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ab-root p-6">
      <style>{style}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <LogoComplet />
          <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 4 }}>{utilisateurActif.nom}</div>
        </div>
        <button
          onClick={() => {
            setUtilisateurActifId(null);
            reinitialiserFormulaires();
            reinitialiserRetrait();
          }}
          style={{ fontSize: 13, color: "#5B6472", background: "none", border: "none", cursor: "pointer" }}
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex gap-2 mb-6" style={{ flexWrap: "wrap" }}>
        {[
          { id: "apercu", label: "Resumen" },
          { id: "virement", label: "Transferencia" },
          { id: "retrait", label: "Retiro a mi banco" },
          { id: "historique", label: "Historial" },
        ].map((onglet) => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            className="px-4 py-2 rounded"
            style={{
              fontSize: 13,
              fontWeight: 500,
              background: ongletActif === onglet.id ? "#0F1A2E" : "#fff",
              color: ongletActif === onglet.id ? "#fff" : "#3C4454",
              border: "1px solid " + (ongletActif === onglet.id ? "#0F1A2E" : "#E4E7EC"),
            }}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {ongletActif === "apercu" && (
        <div>
          <div className="rounded-lg p-6 mb-4" style={{ background: "#0F1A2E", color: "#fff" }}>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{compte.nomCompte}</div>
            <div className="ab-serif" style={{ fontSize: 32, fontWeight: 600, marginTop: 6 }}>
              {compte.solde.toLocaleString("es-ES")} FCFA
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{compte.numero}</div>
          </div>

          {compte.solde === 0 && historique.length === 0 && (
            <div
              className="rounded p-3 mb-4"
              style={{ background: "#FBF6E8", border: "1px solid #EAD98F", fontSize: 13, color: "#6B5A16" }}
            >
              Esta cuenta se acaba de crear y aún no ha recibido dinero. En la app
              real, serías tú (el banco) quien acreditaría esta cuenta — por ejemplo
              tras recibir un pago del cliente por otro medio.
            </div>
          )}

          <div style={{ fontSize: 13, color: "#5B6472", marginBottom: 8 }}>Últimas operaciones</div>
          {historique.slice(0, 3).map((op) => (
            <div key={op.id} className="flex justify-between py-2" style={{ borderBottom: "1px solid #E4E7EC", fontSize: 14 }}>
              <span>{op.libelle}</span>
              <span style={{ color: op.montant >= 0 ? "#1B7F5C" : "#B23B2E", fontWeight: 500 }}>
                {formatMontant(op.montant)}
              </span>
            </div>
          ))}
        </div>
      )}

      {ongletActif === "virement" && (
        <form onSubmit={gererVirement} className="bg-white rounded-lg p-6" style={{ border: "1px solid #E4E7EC", maxWidth: 420 }}>
          <label style={label}>Destinatario</label>
          <input
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
            placeholder="Nombre o número de cuenta"
            className="w-full mb-4 px-3 py-2 rounded"
            style={champInput}
          />

          <label style={label}>Monto (FCFA)</label>
          <input
            value={montantVirement}
            onChange={(e) => setMontantVirement(e.target.value)}
            placeholder="10000"
            className="w-full mb-4 px-3 py-2 rounded"
            style={champInput}
          />

          <label style={label}>Motivo (opcional)</label>
          <input
            value={libelleVirement}
            onChange={(e) => setLibelleVirement(e.target.value)}
            placeholder="Ej: reembolso"
            className="w-full mb-4 px-3 py-2 rounded"
            style={champInput}
          />

          {messageVirement && (
            <div style={{ fontSize: 13, marginBottom: 12, color: messageVirement.type === "erreur" ? "#B23B2E" : "#1B7F5C" }}>
              {messageVirement.texte}
            </div>
          )}

          <button type="submit" className="w-full py-2 rounded" style={boutonPrincipal}>
            Enviar la transferencia
          </button>
        </form>
      )}

      {ongletActif === "retrait" && (
        <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E4E7EC", maxWidth: 460 }}>
          {statutRetrait === null && (
            <form onSubmit={demanderRetrait}>
              <div style={{ fontSize: 13, color: "#5B6472", marginBottom: 16 }}>
                Convierte parte de tu saldo ficticio en una transferencia real a tu banco.
                Una vez enviada la solicitud, el administrador (tú) debe transmitir un código
                de validación al cliente, fuera de la aplicación.
              </div>

              <label style={label}>Número de la cuenta bancaria real</label>
              <input
                value={compteReelRetrait}
                onChange={(e) => setCompteReelRetrait(e.target.value)}
                placeholder="Ej: BJ26 XXXX 0000 1111 2222"
                className="w-full mb-4 px-3 py-2 rounded"
                style={champInput}
              />

              <label style={label}>Monto (FCFA)</label>
              <input
                value={montantRetrait}
                onChange={(e) => setMontantRetrait(e.target.value)}
                placeholder="50000"
                className="w-full mb-4 px-3 py-2 rounded"
                style={champInput}
              />

              {messageRetrait && (
                <div style={{ fontSize: 13, marginBottom: 12, color: "#B23B2E" }}>{messageRetrait.texte}</div>
              )}

              <button type="submit" className="w-full py-2 rounded" style={boutonPrincipal}>
                Solicitar el retiro
              </button>
            </form>
          )}

          {statutRetrait === "en_attente" && (
            <div>
              <div style={{ fontSize: 13, color: "#5B6472", marginBottom: 12 }}>
                Solicitud registrada: <b>{parseInt(montantRetrait, 10).toLocaleString("es-ES")} FCFA</b> hacia{" "}
                <b>{compteReelRetrait}</b>. Esperando el código enviado por el administrador.
              </div>

              <div
                className="rounded p-3 mb-4"
                style={{ background: "#FBF6E8", border: "1px solid #EAD98F", fontSize: 13, color: "#6B5A16" }}
              >
                Vista admin (solo demo — nunca sería visible para el cliente en la realidad):
                código a transmitir al cliente → <b style={{ fontSize: 16 }}>{codeGenere}</b>
              </div>

              <form onSubmit={validerRetrait}>
                <label style={label}>Código recibido del administrador</label>
                <input
                  value={codeSaisi}
                  onChange={(e) => setCodeSaisi(e.target.value)}
                  placeholder="6 dígitos"
                  className="w-full mb-4 px-3 py-2 rounded"
                  style={champInput}
                />

                {messageRetrait && (
                  <div style={{ fontSize: 13, marginBottom: 12, color: "#B23B2E" }}>{messageRetrait.texte}</div>
                )}

                <button type="submit" className="w-full py-2 rounded" style={{ background: "#1B7F5C", color: "#fff", fontSize: 14, fontWeight: 500 }}>
                  Validar el retiro
                </button>
              </form>
            </div>
          )}

          {statutRetrait === "valide" && (
            <div>
              <div style={{ fontSize: 14, color: "#1B7F5C", marginBottom: 12 }}>{messageRetrait?.texte}</div>
              <button onClick={reinitialiserRetrait} className="w-full py-2 rounded" style={boutonPrincipal}>
                Hacer un nuevo retiro
              </button>
            </div>
          )}
        </div>
      )}

      {ongletActif === "historique" && (
        <div className="bg-white rounded-lg p-4" style={{ border: "1px solid #E4E7EC" }}>
          {historique.length === 0 && (
            <div style={{ fontSize: 13, color: "#8A93A3", padding: 8 }}>Sin operaciones por el momento.</div>
          )}
          {historique.map((op) => (
            <div key={op.id} className="flex justify-between py-3" style={{ borderBottom: "1px solid #EEF0F3", fontSize: 14 }}>
              <div>
                <div>{op.libelle}</div>
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{op.date}</div>
              </div>
              <span style={{ color: op.montant >= 0 ? "#1B7F5C" : "#B23B2E", fontWeight: 500 }}>
                {formatMontant(op.montant)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
