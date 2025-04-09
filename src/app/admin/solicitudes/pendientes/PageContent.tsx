"use client";

import useUserRole from "@/hooks/useUserRole";
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  where,
  setDoc,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";

interface Formulario {
  id: string;
  id_correlativo: number;
  conductor: string;
  numero_interno: string;
  fecha_inspeccion: string;
  hora_inspeccion: string;
  kilometraje?: string;
  checklist: { [key: string]: string };
  observaciones: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  aprobado_por?: string;
  creado_por?: string;
  hallazgos?: number;
  vehiculo: {
    marca: string;
    modelo: string;
    patente: string;
    ano: string;
    color: string;
    kms_inicial: string;
    kms_final: string;
  };
}

export default function PageContent() {
  const { role, loading } = useUserRole();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [adminNombre, setAdminNombre] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "checklist_pendientes"));
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Formulario))
        .sort((a, b) => b.id_correlativo - a.id_correlativo);
      setFormularios(data);

      // ✅ Obtener nombre del admin con tu lógica original
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          setAdminNombre(userDoc.data().nombre);
        }
      }
    };
    fetchFormularios();
  }, []);
  const handleActualizarEstado = async (
    id: string,
    nuevoEstado: "aprobado" | "rechazado"
  ) => {
    try {
      const refPendiente = doc(db, "checklist_pendientes", id);
      const snapshot = await getDoc(refPendiente);
      if (!snapshot.exists()) return alert("❌ El formulario no existe.");
  
      const data = snapshot.data();
  
      // ✅ Guardar en checklist_atendidos con el mismo ID
      await setDoc(doc(db, "checklist_atendidos", id), {
        ...data,
        estado: nuevoEstado,
        aprobado_por: adminNombre || "Desconocido",
      });
  
      // ✅ Verificar si ya existe detalle
      const q = query(
        collection(db, "checklist_detalle"),
        where("id_formulario", "==", id)
      );
      const detalleSnap = await getDocs(q);
      if (detalleSnap.empty) {
        console.warn("⚠️ No hay detalle para este formulario.");
      } else {
        console.log("✅ Detalle ya creado, no se duplica.");
      }
  
      // ✅ Eliminar de pendientes
      await deleteDoc(refPendiente);
      setFormularios((prev) => prev.filter((f) => f.id !== id));
      alert(`✅ Formulario ${nuevoEstado}`);
    } catch (err) {
      console.error(`❌ Error al actualizar (${nuevoEstado}):`, err);
      alert("❌ No se pudo actualizar el estado del formulario.");
    }
  };
  
  const handleAprobar = (id: string) => handleActualizarEstado(id, "aprobado");
  const handleRechazar = (id: string) => handleActualizarEstado(id, "rechazado");
  
  const limpiarFiltros = () => {
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const filtrar = (f: Formulario) => {
    const texto = busqueda.toLowerCase();
    const coincide =
      f.id_correlativo?.toString().includes(texto) ||
      f.conductor?.toLowerCase().includes(texto) ||
      f.numero_interno?.toLowerCase().includes(texto);

    const fechaForm = new Date(f.fecha_inspeccion);
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
  } = usePagination<Formulario>({
    items: filtrados,
    itemsPerPage,
  });

  if (loading) return null;

  return (
    <div className="container py-4 modulo-checklist">
      <div className="card shadow rounded-3">
        {/* Título */}
        <div className="card-header text-center bg-white">
          <h4 className="mb-0">
            Formularios Checklist Pendientes <span role="img" aria-label="lista">📋</span>
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
              <button className="btn btn-limpiar w-100" onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
  
          {/* Fila: Buscador y selector */}
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
                  <th>Generado por</th>
                  <th>N° Vehículo</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>No Conformidades</th>
                  <th>Estado</th>
                  {(role === "admin" || role === "controlador") && <th>Acciones</th>}
                  <th>Visualizar</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id_correlativo}</td>
                    <td>{f.conductor}</td>
                    <td>{f.creado_por || "Desconocido"}</td>
                    <td>{f.numero_interno}</td>
                    <td>{f.fecha_inspeccion}</td>
                    <td>{f.hora_inspeccion}</td>
                    <td>
                      <span className="badge badge-pendiente">{f.hallazgos ?? 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-pendiente">{f.estado}</span>
                    </td>
                    {(role === "admin" || role === "controlador") && (
                      <td>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleAprobar(f.id)}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRechazar(f.id)}
                        >
                          Rechazar
                        </button>
                      </td>
                    )}
                    <td>
                      <Link
                        href={`/admin/solicitudes/${f.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center">
                      No hay resultados
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
