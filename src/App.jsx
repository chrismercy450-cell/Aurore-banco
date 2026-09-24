import React, { useState, useEffect } from "react";

/*
  Aurore Banco — Front-end conectado a la API (Vercel Functions + Supabase)
*/

const DEVISE = "USD";

function formaterMontant(montant) {
  const n = Number(montant) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEVISE,
    maximumFractionDigits: 0,
  }).format(n);
}

async function appelApi(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "Ha ocurrido un error.");
  }
  return data;
}

export default function App() {
  const [vue, setVue] = useState("connexion");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [compte, setCompte] = useState(null);
  const [historique, setHistorique] = useState([]);

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");

  const [ongletClient, setOngletClient] = useState("apercu");

  const [destinataire, setDestinataire] = useState("");
  const [montantVirement, setMontantVirement] = useState("");
  const [libelleVirement, setLibelleVirement] = useState("");

  const [montantRetrait, setMontantRetrait] = useState("");
  const [compteReel, setCompteReel] = useState("");
  const [retraitEnCours, setRetraitEnCours] = useState(null);
  const [codeRetrait, setCodeRetrait] = useState("");

  const [ongletAdmin, setOngletAdmin] = useState("comptes");
  const [listeComptes, setListeComptes] = useState([]);
  const [listeRetraits, setListeRetraits] = useState([]);
  const [montantsCredit, setMontantsCredit] = useState({});

  useEffect(() => {
    const sauvegarde = localStorage.getItem("aurore_compte");
    if (sauvegarde) {
      const c = JSON.parse(sauvegarde);
      setCompte(c);
      setVue(c.role === "admin" ? "admin" : "client");
    }
  }, []);

  useEffect(() => {
    if (compte && compte.role === "client") rafraichirCompte(compte.id);
    if (compte && compte.role === "admin") {
      chargerComptesAdmin(compte.id);
      chargerRetraitsAdmin(compte.id);
    }
    // eslint-disable-next-line
  }, [compte?.id]);

  function sauvegarderSession(c) {
    setCompte(c);
    localStorage.setItem("aurore_compte", JSON.stringify(c));
  }

  function seDeconnecter() {
    setCompte(null);
    setVue("connexion");
    localStorage.removeItem("aurore_compte");
    setIdentifiant("");
    setMotDePasse("");
    setNom("");
  }

  async function rafraichirCompte(id) {
    try {
      const data = await appelApi(`/api/compte?id=${id}`);
      setCompte((prev) => {
        const maj = { ...prev, ...data.compte };
        localStorage.setItem("aurore_compte", JSON.stringify(maj));
        return maj;
      });
      setHistorique(data.historique || []);
    } catch (e) {}
  }

  async function chargerComptesAdmin(adminId) {
    try {
      const data = await appelApi(`/api/admin-comptes?adminId=${adminId}`);
      setListeComptes(data.comptes || []);
    } catch (e) {}
  }

  async function chargerRetraitsAdmin(adminId) {
    try {
      const data = await appelApi(`/api/admin-retraits?adminId=${adminId}`);
      setListeRetraits(data.retraits || []);
    } catch (e) {}
  }

  async function gererInscription(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const data = await appelApi("/api/register", {
        method: "POST",
        body: JSON.stringify({ identifiant, motDePasse, nom }),
      });
      sauvegarderSession(data.compte);
      setVue("client");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererConnexion(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const data = await appelApi("/api/login", {
        method: "POST",
        body: JSON.stringify({ identifiant, motDePasse }),
      });
      sauvegarderSession(data.compte);
      setVue(data.compte.role === "admin" ? "admin" : "client");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererVirement(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await appelApi("/api/virement", {
        method: "POST",
        body: JSON.stringify({
          compteId: compte.id,
          destinataire,
          montant: montantVirement,
          libelle: libelleVirement,
        }),
      });
      setDestinataire("");
      setMontantVirement("");
      setLibelleVirement("");
      await rafraichirCompte(compte.id);
      setOngletClient("historique");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererDemandeRetrait(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const data = await appelApi("/api/retrait-demander", {
        method: "POST",
        body: JSON.stringify({
          compteId: compte.id,
          montant: montantRetrait,
          compteReel,
        }),
      });
      setRetraitEnCours({ id: data.retraitId, montant: montantRetrait });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererValidationRetrait(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await appelApi("/api/retrait-valider", {
        method: "POST",
        body: JSON.stringify({ retraitId: retraitEnCours.id, code: codeRetrait }),
      });
      setRetraitEnCours(null);
      setCodeRetrait("");
      setMontantRetrait("");
      setCompteReel("");
      await rafraichirCompte(compte.id);
      setOngletClient("historique");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererCrediter(compteId) {
    setErreur("");
    const montant = montantsCredit[compteId];
    if (!montant) return;
    setChargement(true);
    try {
      await appelApi("/api/admin-crediter", {
        method: "POST",
        body: JSON.stringify({ adminId: compte.id, compteId, montant }),
      });
      setMontantsCredit((m) => ({ ...m, [compteId]: "" }));
      await chargerComptesAdmin(compte.id);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  if (vue === "connexion" || vue === "inscription") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-slate-900 text-white p-6">
            <h1 className="text-xl font-bold">🏦 Aurore Banco</h1>
            <p className="text-slate-300 text-sm mt-1">
              {vue === "connexion" ? "Inicia sesión en tu cuenta" : "Crear una cuenta"}
            </p>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => { setVue("connexion"); setErreur(""); }}
              className={`flex-1 py-3 text-sm font-medium ${vue === "connexion" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setVue("inscription"); setErreur(""); }}
              className={`flex-1 py-3 text-sm font-medium ${vue === "inscription" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Crear una cuenta
            </button>
          </div>

          <form onSubmit={vue === "connexion" ? gererConnexion : gererInscription} className="p-6 space-y-4">
            {vue === "inscription" && (
              <div>
                <label className="text-sm text-slate-600">Nombre completo</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm text-slate-600">Usuario</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Contraseña</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
            </div>

            {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

            <button
              disabled={chargement}
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50"
            >
              {chargement ? "Espera un momento..." : vue === "connexion" ? "Iniciar sesión" : "Crear mi cuenta"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!compte) return null;

  if (vue === "admin") {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h1 className="font-bold">🏦 Aurore Banco — Panel de administración</h1>
          <button onClick={seDeconnecter} className="text-sm text-slate-300 underline">Cerrar sesión</button>
        </div>

        <div className="flex gap-2 p-4">
          <button
            onClick={() => setOngletAdmin("comptes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${ongletAdmin === "comptes" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          >
            Cuentas de clientes
          </button>
          <button
            onClick={() => setOngletAdmin("retraits")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${ongletAdmin === "retraits" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          >
            Solicitudes de retiro
          </button>
        </div>

        {erreur && <p className="text-red-600 text-sm px-4">{erreur}</p>}

        <div className="p-4 space-y-3">
          {ongletAdmin === "comptes" && listeComptes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-medium">{c.nom} <span className="text-slate-400 text-xs">({c.identifiant})</span></p>
                <p className="text-slate-500 text-sm">{c.numero_compte}</p>
                <p className="font-semibold">{formaterMontant(c.solde)}</p>
              </div>
              {c.role === "client" && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto"
                    className="border rounded-lg px-2 py-1 w-28 text-sm"
                    value={montantsCredit[c.id] || ""}
                    onChange={(e) => setMontantsCredit((m) => ({ ...m, [c.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => gererCrediter(c.id)}
                    className="bg-emerald-600 text-white text-sm rounded-lg px-3 py-1.5"
                  >
                    Acreditar
                  </button>
                </div>
              )}
            </div>
          ))}

          {ongletAdmin === "retraits" && (
            listeRetraits.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay solicitudes de retiro pendientes.</p>
            ) : listeRetraits.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="font-medium">{r.comptes?.nom} <span className="text-slate-400 text-xs">({r.comptes?.identifiant})</span></p>
                <p className="text-sm text-slate-600">Monto: {formaterMontant(r.montant)}</p>
                <p className="text-sm text-slate-600">Hacia la cuenta real: {r.compte_reel}</p>
                <p className="text-sm mt-2">
                  Código para entregar al cliente:{" "}
                  <span className="font-mono font-bold text-lg">{r.code_hash}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold">🏦 Aurore Banco</h1>
          <p className="text-sm text-slate-300">{compte.nom}</p>
        </div>
        <button onClick={seDeconnecter} className="text-sm text-slate-300 underline">Cerrar sesión</button>
      </div>

      <div className="flex gap-2 p-4 flex-wrap">
        {[
          ["apercu", "Resumen"],
          ["virement", "Transferencia"],
          ["retrait", "Retiro a mi banco"],
          ["historique", "Historial"],
        ].map(([cle, libelle]) => (
          <button
            key={cle}
            onClick={() => { setOngletClient(cle); setErreur(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${ongletClient === cle ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {erreur && <p className="text-red-600 text-sm px-4">{erreur}</p>}

      <div className="p-4 space-y-4">
        {ongletClient === "apercu" && (
          <div>
            <div className="bg-slate-900 text-white rounded-xl p-6">
              <p className="text-slate-300 text-sm">Cuenta corriente</p>
              <p className="text-3xl font-bold mt-2">{formaterMontant(compte.solde)}</p>
              <p className="text-slate-400 text-sm mt-2">{compte.numero_compte}</p>
            </div>
            {compte.solde === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 mt-4">
                Esta cuenta acaba de ser creada y todavía no ha recibido dinero. En la aplicación real, serías tú (el banco) quien acreditaría esta cuenta — por ejemplo, después de recibir un pago del cliente por otro medio.
              </div>
            )}
          </div>
        )}

        {ongletClient === "virement" && (
          <form onSubmit={gererVirement} className="bg-white rounded-xl p-4 shadow-sm space-y-3 max-w-md">
            <div>
              <label className="text-sm text-slate-600">Destinatario</label>
              <input className="w-full border rounded-lg px-3 py-2 mt-1" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-slate-600">Monto</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={montantVirement} onChange={(e) => setMontantVirement(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-slate-600">Concepto (opcional)</label>
              <input className="w-full border rounded-lg px-3 py-2 mt-1" value={libelleVirement} onChange={(e) => setLibelleVirement(e.target.value)} />
            </div>
            <button disabled={chargement} className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
              {chargement ? "Espera un momento..." : "Enviar la transferencia"}
            </button>
          </form>
        )}

        {ongletClient === "retrait" && (
          retraitEnCours ? (
            <form onSubmit={gererValidationRetrait} className="bg-white rounded-xl p-4 shadow-sm space-y-3 max-w-md">
              <p className="text-sm text-slate-600">
                Tu solicitud de retiro de {formaterMontant(retraitEnCours.montant)} ha sido registrada. El administrador te dará un código — ingrésalo abajo para validar.
              </p>
              <div>
                <label className="text-sm text-slate-600">Código recibido</label>
                <input className="w-full border rounded-lg px-3 py-2 mt-1" value={codeRetrait} onChange={(e) => setCodeRetrait(e.target.value)} required />
              </div>
              <button disabled={chargement} className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {chargement ? "Espera un momento..." : "Validar el retiro"}
              </button>
            </form>
          ) : (
            <form onSubmit={gererDemandeRetrait} className="bg-white rounded-xl p-4 shadow-sm space-y-3 max-w-md">
              <div>
                <label className="text-sm text-slate-600">Monto a retirar</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={montantRetrait} onChange={(e) => setMontantRetrait(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-slate-600">Número de tu cuenta bancaria real</label>
                <input className="w-full border rounded-lg px-3 py-2 mt-1" value={compteReel} onChange={(e) => setCompteReel(e.target.value)} required />
              </div>
              <button disabled={chargement} className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {chargement ? "Espera un momento..." : "Solicitar el retiro"}
              </button>
            </form>
          )
        )}

        {ongletClient === "historique" && (
          <div className="bg-white rounded-xl shadow-sm divide-y max-w-md">
            {historique.length === 0 ? (
              <p className="text-slate-500 text-sm p-4">No hay operaciones por el momento.</p>
            ) : historique.map((t) => (
              <div key={t.id} className="p-4 flex justify-between">
                <div>
                  <p className="text-sm font-medium">{t.libelle}</p>
                  <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString("es-ES")}</p>
                </div>
                <p className={`font-semibold ${t.montant < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {t.montant < 0 ? "-" : "+"}{formaterMontant(Math.abs(t.montant))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
