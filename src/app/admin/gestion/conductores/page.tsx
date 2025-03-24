"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

export default function GestionConductores() {
  const [nombre, setNombre] = useState("");
  const [conductores, setConductores] = useState<any[]>([]);
  const [conductorEdit, setConductorEdit] = useState<{ id: string; nombre: string } | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    cargarConductores();
  }, []);

  const cargarConductores = async () => {
    const snapshot = await getDocs(collection(db, "conductores"));
    setConductores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const agregarConductor = async () => {
    if (!nombre.trim()) return alert("⚠️ Ingrese un nombre");
    await addDoc(collection(db, "conductores"), { nombre });
    setNombre("");
    cargarConductores();
  };

  const actualizarConductor = async () => {
    if (!conductorEdit) return;
    await updateDoc(doc(db, "conductores", conductorEdit.id), { nombre: conductorEdit.nombre });
    setConductorEdit(null);
    setToast("✅ Conductor actualizado");
    cargarConductores();
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="container py-4">
      <h2 className="text-center">Gestión de Conductores 👨‍✈️</h2>

      {toast && <div className="alert alert-success">{toast}</div>}

      <div className="card p-4 mb-4">
        <h5>Agregar Conductor</h5>
        <input
          className="form-control mb-2"
          placeholder="Nombre del Conductor"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button className="btn btn-primary" onClick={agregarConductor}>Agregar Conductor</button>
      </div>

      <div className="card p-4">
        <h5>Conductores Registrados</h5>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => setConductorEdit({ id: c.id, nombre: c.nombre })}
                  >
                    Modificar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      {conductorEdit && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modificar Conductor</h5>
                <button className="btn-close" onClick={() => setConductorEdit(null)}></button>
              </div>
              <div className="modal-body">
                <input
                  className="form-control"
                  value={conductorEdit.nombre}
                  onChange={(e) => setConductorEdit({ ...conductorEdit, nombre: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConductorEdit(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={actualizarConductor}>Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
