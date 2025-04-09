"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function PageContent() {
  interface Conductor {
    id: string;
    nombre: string;
  }

  const [nombre, setNombre] = useState("");
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [conductorEdit, setConductorEdit] = useState<Conductor | null>(null);
  const [conductorEliminar, setConductorEliminar] = useState<Conductor | null>(null);
  const [toast, setToast] = useState("");

  // 🔽 Filtros y paginación
  const [busqueda, setBusqueda] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarConductores();
  }, []);

  const cargarConductores = async () => {
    const snapshot = await getDocs(collection(db, "conductores"));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre || ""
    }));
    setConductores(data);
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

  const eliminarConductor = async () => {
    if (!conductorEliminar) return;
    await deleteDoc(doc(db, "conductores", conductorEliminar.id));
    setConductorEliminar(null);
    cargarConductores();
  };

  // 🔍 Filtro
  const filtrados = conductores.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 📄 Paginación
  const totalPaginas = Math.ceil(filtrados.length / itemsPerPage);
  const datosPagina = filtrados.slice(
    (paginaActual - 1) * itemsPerPage,
    paginaActual * itemsPerPage
  );

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
        <button className="btn btn-primary" onClick={agregarConductor}>
          Agregar Conductor
        </button>
      </div>

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Buscar conductor por nombre"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setPaginaActual(1);
            }}
          >
            {[5, 10, 20, 50].map(n => (
              <option key={n} value={n}>Ver {n} por página</option>
            ))}
          </select>
        </div>
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
            {datosPagina.map(c => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>
                  <button className="btn btn-sm btn-warning me-2" onClick={() => setConductorEdit(c)}>Modificar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setConductorEliminar(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {datosPagina.length === 0 && (
              <tr><td colSpan={2} className="text-center">No se encontraron resultados</td></tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="d-flex justify-content-between align-items-center">
          <span>Página {paginaActual} de {totalPaginas}</span>
          <div>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual(p => p - 1)}
            >
              Anterior
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual(p => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal Edición */}
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

      {/* Modal Confirmación de Eliminación */}
      {conductorEliminar && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">¿Eliminar Conductor?</h5>
                <button className="btn-close" onClick={() => setConductorEliminar(null)}></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar a <strong>{conductorEliminar.nombre}</strong>?</p>
                <p className="text-muted small">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConductorEliminar(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={eliminarConductor}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
