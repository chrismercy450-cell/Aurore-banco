import React, { useState, useEffect } from "react";

/*
  Aurora Banco — Versión en español conectada a la API (Vercel Functions + Supabase)
*/

const DEVISE = "$";

function formatearMonto(monto) {
  const n = Number(monto) || 0;
  return `${n.toLocaleString("es-ES")} ${DEVISE}`;
}

async function llamarApi(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "Ocurrió un error.");
  }
  return data;
}

export default function App() {
  const [vista, setVista] = useState("conexion");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState([]);

  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombre, setNombre] = useState("");

  const [pestanaCliente, setPestanaCliente] = useState("resumen");

  const [destinatario, setDestinatario] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [conceptoTransferencia, setConceptoTransferencia] = useState("");

  const [montoRetiro, setMontoRetiro] = useState("");
  const [cuentaReal, setCuentaReal] = useState("");
  const [retiroEnCurso, setRetiroEnCurso] = useState(null);
  const [codigoRetiro, setCodigoRetiro] = useState("");

  const [pestanaAdmin, setPestanaAdmin] = useState("cuentas");
  const [listaCuentas, setListaCuentas] = useState([]);
  const [listaRetiros, setListaRetiros] = useState([]);
  const [montosCredito, setMontosCredito] = useState({});

  const [imagenIndice, setImagenIndice] = useState(0);
  const imagenesFondo = [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  ];

  useEffect(() => {
    const guardado = localStorage.getItem("aurore_compte");
    if (guardado) {
      const c = JSON.parse(guardado);
      setCuenta(c);
      setVista(c.role === "admin" ? "admin" : "cliente");
    }
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setImagenIndice((i) => (i + 1) % imagenesFondo.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (cuenta && cuenta.role === "client") refrescarCuenta(cuenta.id);
    if (cuenta && cuenta.role === "admin") {
      cargarCuentasAdmin(cuenta.id);
      cargarRetirosAdmin(cuenta.id);
    }
    // eslint-disable-next-line
  }, [cuenta?.id]);

  function guardarSesion(c) {
    setCuenta(c);
    localStorage.setItem("aurore_compte", JSON.stringify(c));
  }

  function cerrarSesion() {
    setCuenta(null);
    setVista("conexion");
    localStorage.removeItem("aurore_compte");
    setIdentificador("");
    setContrasena("");
    setNombre("");
  }

  async function refrescarCuenta(id) {
    try {
      const data = await llamarApi(/api/compte?id=${id});
      setCuenta((prev) => {
        const maj = { ...prev, ...data.compte };
        localStorage.setItem("aurore_compte", JSON.stringify(maj));
        return maj;
      });
      setHistorial(data.historique || []);
    } catch (e) {}
  }

  async function cargarCuentasAdmin(adminId) {
    try {
      const data = await llamarApi(/api/admin-comptes?adminId=${adminId});
      setListaCuentas(data.comptes || []);
    } catch (e) {}
  }

  async function cargarRetirosAdmin(adminId) {
    try {
      const data = await llamarApi(/api/admin-retraits?adminId=${adminId});
      setListaRetiros(data.retraits || []);
    } catch (e) {}
  }

  async function manejarRegistro(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await llamarApi("/api/register", {
        method: "POST",
        body: JSON.stringify({ identifiant: identificador, motDePasse: contrasena, nom: nombre }),
      });
      guardarSesion(data.compte);
      setVista("cliente");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarConexion(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await llamarApi("/api/login", {
        method: "POST",
        body: JSON.stringify({ identifiant: identificador, motDePasse: contrasena }),
      });
      guardarSesion(data.compte);
      setVista(data.compte.role === "admin" ? "admin" : "cliente");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarTransferencia(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await llamarApi("/api/virement", {
        method: "POST",
        body: JSON.stringify({
          compteId: cuenta.id,
          destinataire: destinatario,
          montant: montoTransferencia,
          libelle: conceptoTransferencia,
        }),
      });
      setDestinatario("");
      setMontoTransferencia("");
      setConceptoTransferencia("");
      await refrescarCuenta(cuenta.id);
      setPestanaCliente("historial");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarSolicitudRetiro(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await llamarApi("/api/retrait-demander", {
        method: "POST",
        body: JSON.stringify({
          compteId: cuenta.id,
          montant: montoRetiro,
          compteReel: cuentaReal,
        }),
      });
      setRetiroEnCurso({ id: data.retraitId, monto: montoRetiro });
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarValidacionRetiro(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await llamarApi("/api/retrait-valider", {
        method: "POST",
        body: JSON.stringify({ retraitId: retiroEnCurso.id, code: codigoRetiro }),
      });
      setRetiroEnCurso(null);
      setCodigoRetiro("");
      setMontoRetiro("");
      setCuentaReal("");
      await refrescarCuenta(cuenta.id);
      setPestanaCliente("historial");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarAcreditar(compteId) {
    setError("");
    const monto = montosCredito[compteId];
    if (!monto) return;
    setCargando(true);
    try {
      await llamarApi("/api/admin-crediter", {
        method: "POST",
        body: JSON.stringify({ adminId: cuenta.id, compteId, montant: monto }),
      });
      setMontosCredito((m) => ({ ...m, [compteId]: "" }));
      await cargarCuentasAdmin(cuenta.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  if (vista === "conexion" || vista === "registro") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
          <div
            className="relative h-40 flex items-end p-6 text-white transition-all duration-1000"
            style={{
              backgroundImage: linear-gradient(to bottom, rgba(15,23,42,0.3), rgba(15,23,42,0.85)), url(${imagenesFondo[imagenIndice]}),
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div>
              <h1 className="text-xl font-bold">🏦 Aurora Banco</h1>
              <p className="text-slate-200 text-sm mt-1">
                {vista === "conexion" ? "Acceso a tu área de cliente" : "Crear una cuenta"}
              </p>
            </div>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => { setVista("conexion"); setError(""); }}
              className={flex-1 py-3 text-sm font-medium ${vista === "conexion" ? "bg-slate-900 text-white" : "text-slate-600"}}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setVista("registro"); setError(""); }}
              className={flex-1 py-3 text-sm font-medium ${vista === "registro" ? "bg-slate-900 text-white" : "text-slate-600"}}
            >
              Crear una cuenta
            </button>
          </div>

          <form onSubmit={vista === "conexion" ? manejarConexion : manejarRegistro} className="p-6 space-y-4">
            {vista === "registro" && (
              <div>
                <label className="text-sm text-slate-600">Nombre completo</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm text-slate-600">Usuario</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Contraseña</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              disabled={cargando}
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50"
            >
              {cargando ? "Por favor espera..." : vista === "conexion" ? "Iniciar sesión" : "Crear mi cuenta"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!cuenta) return null;

  if (vista === "admin") {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h1 className="font-bold">🏦 Aurora Banco — Panel de administrador</h1>
          <button onClick={cerrarSesion} className="text-sm text-slate-300 underline">Cerrar sesión</button>
        </div>

        <div className="flex gap-2 p-4">
          <button
            onClick={() => setPestanaAdmin("cuentas")}
            className={px-4 py-2 rounded-lg text-sm font-medium ${pestanaAdmin === "cuentas" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}}
          >
            Cuentas de clientes
          </button>
          <button
            onClick={() => setPestanaAdmin("retiros")}
            className={px-4 py-2 rounded-lg text-sm font-medium ${pestanaAdmin === "retiros" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}}
          >
            Solicitudes de retiro
          </button>
        </div>

        {error && <p className="text-red-600 text-sm px-4">{error}</p>}

        <div className="p-4 space-y-3">
          {pestanaAdmin === "cuentas" && listaCuentas.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-medium">{c.nom} <span className="text-slate-400 text-xs">({c.identifiant})</span></p>
                <p className="text-slate-500 text-sm">{c.numero_compte}</p>
                <p className="font-semibold">{formatearMonto(c.solde)}</p>
              </div>
              {c.role === "client" && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto"
                    className="border rounded-lg px-2 py-1 w-28 text-sm"
                    value={montosCredito[c.id] || ""}
                    onChange={(e) => setMontosCredito((m) => ({ ...m, [c.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => manejarAcreditar(c.id)}
                    className="bg-emerald-600 text-white text-sm rounded-lg px-3 py-1.5"
                  >
                    Acreditar
                  </button>
                </div>
              )}
            </div>
          ))}

          {pestanaAdmin === "retiros" && (
            listaRetiros.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay solicitudes de retiro pendientes.</p>
            ) : listaRetiros.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="font-medium">{r.comptes?.nom} <span className="text-slate-400 text-xs">({r.comptes?.identifiant})</span></p>
                <p className="text-sm text-slate-600">Monto: {formatearMonto(r.montant)}</p>
                <p className="text-sm text-slate-600">Hacia la cuenta real: {r.compte_reel}</p>
                <p className="text-sm mt-2">
                  Código para enviar al cliente:{" "}
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
          <h1 className="font-bold">🏦 Aurora Banco</h1>
          <p className="text-sm text-slate-300">{cuenta.nom}</p>
        </div>
        <button onClick={cerrarSesion} className="text-sm text-slate-300 underline">Cerrar sesión</button>
      </div>

      <div className="flex gap-2 p-4 flex-wrap">
        {[
          ["resumen", "Resumen"],
          ["transferencia", "Transferencia"],
          ["retiro", "Retiro a mi banco"],
          ["historial", "Historial"],
        ].map(([clave, etiqueta]) => (
          <button
            key={clave}
            onClick={() => { setPestanaCliente(clave); setError(""); }}
            className={px-4 py-2 rounded-lg text-sm font-medium ${pestanaCliente === clave ? "bg-slate-900 text-white" : "bg-white text-slate-700"}}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm px-4">{error}</p>}

      <div className="p-4 space-y-4">
        {pestanaCliente === "resumen" && (
          <div>
            <div className="bg-slate-900 text-white rounded-xl p-6">
              <p className="text-slate-300 text-sm">Cuenta corriente</p>
              <p className="text-3xl font-bold mt-2">{formatearMonto(cuenta.solde)}</p>
              <p className="text-slate-400 text-sm mt-2">{cuenta.numero_compte}</p>
            </div>
            {cuenta.solde === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 mt-4">
                Esta cuenta acaba de ser creada y aún no ha recibido dinero. En la aplicación real, serías tú (el banco) quien acreditaría esta cuenta — por ejemplo tras recibir un pago del cliente por otro medio.
              </div>
            )}
          </div>
        )}

        {pestanaCliente === "transferencia" && (
          <form onSubmit={manejarTransferencia} className="bg-white rounded-xl p-4 shadow-sm space-y-3 max-w-md">
            <div>
              <label className="text-sm text-slate-600">Destinatario</label>
              <input className="w-full border rounded-lg px-3 py-2 mt-1" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-slate-600">Monto</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={montoTransferencia} onChange={(e) => setMontoTransferencia(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-slate-600">Concepto (opcional)</label>
              <input className="w-full border rounded-lg px-3 py-2 mt-1" value={conceptoTransferencia} onChange={(e) => setConceptoTransferencia(e.target.value)} />
            </div>
            <button disabled={cargando} className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
              {cargando ? "Por favor espera..." : "Enviar transferencia"}
            </button>
          </form>
        )}

        {pestanaCliente === "retiro" && (
          retiroEnCurso ? (
            <form onSubmit={manejarValidacionRetiro} className="bg-white rounded-xl p-4 shadow-sm space-y-3 max-w-md">
              <p className="text-sm text-slate-600">
                Tu solicitud de retiro de {formatearMonto(retiroEnCurso.monto)} ha sido registrada. El administrador te dará un código — ingrésalo abajo para validarlo.
              </p>
              <div>
                <label className="text-sm text-slate-600">Código recibido</label>
                <input className="w-full border rounded-lg px-3 py-2 mt-1" value={codigoRetiro} onChange={(e) => setCodigoRetiro(e.target.value)} required />
              </div>
              <button disabled={cargando} className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {cargando ? "Por favor espera..." : "Validar el retiro"}
              </button>
            </form>
          ) : (
            <form onSubmit={manejarSolicitudRetiro} className="bg-white rounded-xl p-4 shadow-sm space-y-3 max-w-md">
              <div>
                <label className="text-sm text-slate-600">Monto a retirar</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-slate-600">Número de tu cuenta bancaria real</label>
                <input className="w-full border rounded-lg px-3 py-2 mt-1" value={cuentaReal} onChange={(e) => setCuentaReal(e.target.value)} required />
              </div>
              <button disabled={cargando} className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {cargando ? "Por favor espera..." : "Solicitar el retiro"}
              </button>
            </form>
          )
        )}

        {pestanaCliente === "historial" && (
          <div className="bg-white rounded-xl shadow-sm divide-y max-w-md">
            {historial.length === 0 ? (
              <p className="text-slate-500 text-sm p-4">Aún no hay operaciones.</p>
            ) : historial.map((t) => (
              <div key={t.id} className="p-4 flex justify-between">
                <div>
                  <p className="text-sm font-medium">{t.libelle}</p>
                  <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString("es-ES")}</p>
                </div>
                <p className={font-semibold ${t.montant < 0 ? "text-red-600" : "text-emerald-600"}}>
                  {t.montant < 0 ? "-" : "+"}{formatearMonto(Math.abs(t.montant))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
