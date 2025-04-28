"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import useUserRole from "@/hooks/useUserRole";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";

interface FormularioFatiga {
  id: string;
  id_correlativo: number;
  conductor: string;
  tipo_vehiculo: string;
  numero_interno: string;
  destino: string;
  hora_salida: string;
  fecha: string;
  respuestas: Record<number, string>;
  observaciones: Record<number, string>;
  estado: "pendiente" | "aprobado" | "rechazado";
  creado_por?: string;
  aprobado_por?: string;
  errores: number;
}

export default function PageContent() {
  const [formularios, setFormularios] = useState<FormularioFatiga[]>([]);
  const { role: userRole } = useUserRole();
  const [usuarioNombre, setUsuarioNombre] = useState("Desconocido");

  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "fatiga_somnolencia"));
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as FormularioFatiga))
        .filter((f) => f.estado === "pendiente")
        .sort((a, b) => b.id_correlativo - a.id_correlativo);
      setFormularios(data);
    };

    const obtenerNombreUsuario = async () => {
      const auth = await import("@/firebase").then((mod) => mod.auth);
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsuarioNombre(userData.nombre || user.email || "Desconocido");
        }
      }
    };

    fetchData();
    obtenerNombreUsuario();
  }, []);

  const aprobarFormulario = async (formulario: FormularioFatiga) => {
    await updateDoc(doc(db, "fatiga_somnolencia", formulario.id), {
      estado: "aprobado",
      aprobado_por: usuarioNombre,
    });
    setFormularios((prev) => prev.filter((f) => f.id !== formulario.id));
  };

  const rechazarFormulario = async (formulario: FormularioFatiga) => {
    await updateDoc(doc(db, "fatiga_somnolencia", formulario.id), {
      estado: "rechazado",
      aprobado_por: usuarioNombre,
    });
    setFormularios((prev) => prev.filter((f) => f.id !== formulario.id));
  };

  const filtrar = (f: FormularioFatiga) => {
    const texto = busqueda.toLowerCase();
    const coincide =
      f.id_correlativo.toString().includes(texto) ||
      f.conductor.toLowerCase().includes(texto) ||
      f.numero_interno.toLowerCase().includes(texto);

    const fechaForm = new Date(f.fecha);
    const desde = fechaDesde ? new Date(fechaDesde) : null;
    const hasta = fechaHasta ? new Date(fechaHasta) : null;

    const dentroRango =
      (!desde || fechaForm >= desde) && (!hasta || fechaForm <= hasta);

    return coincide && dentroRango;
  };

  const filtrados = formularios.filter(filtrar);

  const {
    currentPage,
    totalPages,
    paginatedItems,
    handlePageChange,
  } = usePagination<FormularioFatiga>({
    items: filtrados,
    itemsPerPage,
  });

  useEffect(() => {
    handlePageChange(1);
  }, [busqueda, fechaDesde, fechaHasta, itemsPerPage, handlePageChange]);

  return (
    <div className="container py-4 modulo-fatiga-pendientes">
      <div className="card shadow rounded-3">
        {/* Título */}
        <div className="card-header text-center bg-white">
          <h4 className="mb-0">
            Formularios de Fatiga Pendientes <span role="img" aria-label="reloj">⏳</span>
          </h4>
        </div>
  
        <div className="card-body">
          {/* Filtros por fecha */}
          <div className="row mb-3">
            <div className="col-md-5">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-limpiar w-100"
                onClick={() => {
                  setBusqueda("");
                  setFechaDesde("");
                  setFechaHasta("");
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
  
          {/* Buscador y selector de filas */}
          <div className="row align-items-center mb-3">
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Buscar por ID, conductor, N° interno"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="col-md-3 ms-auto">
              <select
                className="form-select"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>
                    Ver {num} por página
                  </option>
                ))}
              </select>
            </div>
          </div>
  
          {/* Tabla */}
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Conductor</th>
                  <th>N° Vehículo</th>
                  <th>Destino</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Errores</th>
                  <th>Realizado por</th>
                  {(userRole === "admin" || userRole === "controlador") && (
                    <th>Acciones</th>
                  )}
                  <th>Visualizar</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id_correlativo}</td>
                    <td>{f.conductor}</td>
                    <td>{f.numero_interno}</td>
                    <td>{f.destino}</td>
                    <td>{f.fecha}</td>
                    <td>{f.hora_salida}</td>
                    <td>
        <span className={`badge bg-${f.errores > 0 ? "danger" : "success"}`}>
          {f.errores ?? 0} {/* ✅ muestra 0 si no existiera */}
        </span>
      </td>
                    <td>{f.creado_por || "N/A"}</td>
                    {(userRole === "admin" || userRole === "controlador") && (
                      <td>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => aprobarFormulario(f)}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => rechazarFormulario(f)}
                        >
                          Rechazar
                        </button>
                      </td>
                    )}
                    <td>
                      <Link
                        href={`/admin/solicitudes-fatiga/${f.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center">
                      No hay formularios pendientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
  
          {/* Paginación */}
          <div className="mt-3 d-flex justify-content-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
  
}
