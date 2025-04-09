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
  interface Vehiculo {
    id: string;
    numero_interno: string;
    marca: string;
    modelo: string;
    patente: string;
    color: string;
    ano: string;
  }

  const [vehiculo, setVehiculo] = useState<Omit<Vehiculo, "id">>({
    numero_interno: "",
    marca: "",
    modelo: "",
    patente: "",
    color: "",
    ano: "",
  });

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoEditando, setVehiculoEditando] = useState<Vehiculo | null>(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState<Vehiculo | null>(null);

  // 🔽 Nuevos estados para paginación y búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    const snapshot = await getDocs(collection(db, "vehiculos"));
    setVehiculos(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        numero_interno: doc.data().numero_interno || "",
        marca: doc.data().marca || "",
        modelo: doc.data().modelo || "",
        patente: doc.data().patente || "",
        color: doc.data().color || "",
        ano: doc.data().ano || "",
      }))
    );
  };

  const agregarVehiculo = async () => {
    await addDoc(collection(db, "vehiculos"), vehiculo);
    setVehiculo({
      numero_interno: "",
      marca: "",
      modelo: "",
      patente: "",
      color: "",
      ano: "",
    });
    await cargarVehiculos();
  };

  const actualizarVehiculo = async () => {
    if (!vehiculoEditando) return;
    await updateDoc(doc(db, "vehiculos", vehiculoEditando.id), {
      numero_interno: vehiculoEditando.numero_interno,
      marca: vehiculoEditando.marca,
      modelo: vehiculoEditando.modelo,
      patente: vehiculoEditando.patente,
      color: vehiculoEditando.color,
      ano: vehiculoEditando.ano,
    });
    setVehiculoEditando(null);
    setMostrarToast(true);
    await cargarVehiculos();
    setTimeout(() => setMostrarToast(false), 3000);
  };

  const eliminarVehiculo = async () => {
    if (!vehiculoAEliminar) return;
    await deleteDoc(doc(db, "vehiculos", vehiculoAEliminar.id));
    setVehiculoAEliminar(null);
    await cargarVehiculos();
  };
  

  // 🔎 Filtro de búsqueda
  const vehiculosFiltrados = vehiculos.filter((v) => {
    const texto = busqueda.toLowerCase();
    return (
      v.numero_interno.toLowerCase().includes(texto) ||
      v.patente.toLowerCase().includes(texto) ||
      v.marca.toLowerCase().includes(texto)
    );
  });

  // 📄 Paginación
  const totalPaginas = Math.ceil(vehiculosFiltrados.length / itemsPerPage);
  const vehiculosPagina = vehiculosFiltrados.slice(
    (paginaActual - 1) * itemsPerPage,
    paginaActual * itemsPerPage
  );

  return (
    <div className="container py-4">
      <h2 className="text-center">Gestión de Vehículos 🚗</h2>

      {/* Formulario de Agregar */}
      <div className="card p-4 mb-4">
        <h5>Agregar Vehículo</h5>
        {["numero_interno", "marca", "modelo", "patente", "color", "ano"].map((campo) => (
          <input
            key={campo}
            className="form-control mb-2"
            placeholder={campo.replace("_", " ").toUpperCase()}
            value={vehiculo[campo as keyof typeof vehiculo]}
            onChange={(e) => setVehiculo({ ...vehiculo, [campo]: e.target.value })}
          />
        ))}
        <button className="btn btn-primary" onClick={agregarVehiculo}>
          Agregar Vehículo
        </button>
      </div>

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Buscar por N° Interno, Patente o Marca"
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
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                Ver {n} por página
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Vehículos */}
      <div className="card p-4">
        <h5>Vehículos Registrados</h5>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>N° Interno</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Patente</th>
              <th>Color</th>
              <th>Año</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculosPagina.map((v) => (
              <tr key={v.id}>
                <td>{v.numero_interno}</td>
                <td>{v.marca}</td>
                <td>{v.modelo}</td>
                <td>{v.patente}</td>
                <td>{v.color}</td>
                <td>{v.ano}</td>
                <td>
                  <button className="btn btn-sm btn-warning me-2" onClick={() => setVehiculoEditando(v)}>
                    Modificar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => setVehiculoAEliminar(v)}>
  Eliminar
</button>

                </td>
              </tr>
            ))}
            {vehiculosPagina.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center">
                  No se encontraron resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="d-flex justify-content-between align-items-center">
          <span>
            Página {paginaActual} de {totalPaginas}
          </span>
          <div>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {vehiculoEditando && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Vehículo</h5>
                <button type="button" className="btn-close" onClick={() => setVehiculoEditando(null)}></button>
              </div>
              <div className="modal-body">
                {["numero_interno", "marca", "modelo", "patente", "color", "ano"].map((campo) => (
                  <input
                    key={campo}
                    className="form-control mb-2"
                    placeholder={campo.replace("_", " ").toUpperCase()}
                    value={vehiculoEditando[campo as keyof typeof vehiculoEditando]}
                    onChange={(e) =>
                      setVehiculoEditando({ ...vehiculoEditando, [campo]: e.target.value })
                    }
                  />
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setVehiculoEditando(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={actualizarVehiculo}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de éxito */}
      {mostrarToast && (
        <div className="toast-container position-fixed top-0 end-0 p-3">
          <div className="toast show bg-success text-white">
            <div className="toast-body">Vehículo actualizado correctamente ✅</div>
          </div>
        </div>
      )}
      {/* Modal de Confirmación de Eliminación */}
{vehiculoAEliminar && (
  <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title text-danger">¿Eliminar Vehículo?</h5>
          <button type="button" className="btn-close" onClick={() => setVehiculoAEliminar(null)}></button>
        </div>
        <div className="modal-body">
          <p>¿Estás seguro de que deseas eliminar el vehículo con N° interno <strong>{vehiculoAEliminar.numero_interno}</strong>?</p>
          <p className="text-muted small">Esta acción no se puede deshacer.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setVehiculoAEliminar(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={eliminarVehiculo}>Eliminar</button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
}
