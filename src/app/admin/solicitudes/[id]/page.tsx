"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

interface Formulario {
  id: string;
  conductor: string;
  numero_interno: string;
  fecha_inspeccion: string;
  hora_inspeccion: string;
  checklist: { [key: string]: string };
  observaciones: string;
  estado: "pendiente" | "aprobado" | "rechazado";
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

export default function DetalleSolicitud() {
  const { id } = useParams(); // Obtener el ID desde la URL
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormulario = async () => {
      if (!id) return;
      const docRef = doc(db, "formularios", id as string);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        setFormulario({ id: snapshot.id, ...snapshot.data() } as Formulario);
      } else {
        setFormulario(null);
      }
      setLoading(false);
    };

    fetchFormulario();
  }, [id]);

  if (loading) return <div className="text-center mt-5">🔄 Cargando...</div>;
  if (!formulario) return <div className="text-center mt-5 text-danger">❌ Formulario no encontrado</div>;

  return (
    <div className="container py-4">
      <h2>Detalles de la Inspección 🚍</h2>
      <div className="card">
        <div className="card-header bg-secondary text-white">Información del Conductor y Vehículo</div>
        <div className="card-body">
          <p><strong>Conductor:</strong> {formulario.conductor}</p>
          <p><strong>N° Vehículo:</strong> {formulario.numero_interno}</p>
          <p><strong>Fecha:</strong> {formulario.fecha_inspeccion}</p>
          <p><strong>Hora:</strong> {formulario.hora_inspeccion}</p>
          <p><strong>Estado:</strong> <span className={`badge bg-${formulario.estado === "pendiente" ? "warning" : formulario.estado === "aprobado" ? "success" : "danger"}`}>{formulario.estado}</span></p>
        </div>
      </div>

      {/* Información del Vehículo */}
      <div className="card mt-3">
        <div className="card-header bg-info text-white">Datos del Vehículo</div>
        <div className="card-body">
          <p><strong>Marca:</strong> {formulario.vehiculo.marca}</p>
          <p><strong>Modelo:</strong> {formulario.vehiculo.modelo}</p>
          <p><strong>Patente:</strong> {formulario.vehiculo.patente}</p>
          <p><strong>Año:</strong> {formulario.vehiculo.ano}</p>
          <p><strong>Color:</strong> {formulario.vehiculo.color}</p>
          <p><strong>Kms Inicial:</strong> {formulario.vehiculo.kms_inicial}</p>
          <p><strong>Kms Final:</strong> {formulario.vehiculo.kms_final}</p>
        </div>
      </div>

      {/* Observaciones */}
      <div className="card mt-3">
        <div className="card-header bg-primary text-white">Observaciones</div>
        <div className="card-body">
          <p>{formulario.observaciones || "No hay observaciones"}</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="card mt-3">
        <div className="card-header bg-warning text-dark">Checklist de la Inspección</div>
        <div className="card-body">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Ítem</th>
                <th>Estado</th>
                <th>Imagen</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(formulario.checklist).map(([item, estado]) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>
                    <span className={`badge bg-${estado === "B" ? "success" : estado === "M" ? "danger" : "secondary"}`}>
                      {estado}
                    </span>
                  </td>
                  <td>
  {estado.startsWith("https://") ? (
    <>
      <img
        src={estado}
        alt="Imagen del problema"
        className="img-thumbnail"
        width="100"
        data-bs-toggle="modal"
        data-bs-target={`#modal-${item.replace(/\s+/g, "-")}`}
        style={{ cursor: "pointer" }}
      />
      {/* Modal de Bootstrap */}
      <div className="modal fade" id={`modal-${item.replace(/\s+/g, "-")}`} tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{item}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body text-center">
              <img src={estado} alt="Imagen del problema" className="img-fluid" />
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    "Sin imagen"
  )}
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón para regresar */}
      <div className="text-center mt-4">
        <a href="/admin/solicitudes" className="btn btn-secondary">⬅ Volver</a>
      </div>
    </div>
  );
}
