"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const secciones: { [key: string]: string[] } = {
  "Sistema de Luces": [
    "Luz delantera alta", "Luz delantera baja", "Luces de emergencia",
    "Luces neblineros", "Luces direccionales delanteras", "Luces direccionales traseras", "Luces de salón"
  ],
  "Estado de Llantas y Neumáticos": [
    "Llanta y neumático pos. 1", "Llanta y neumático pos. 2", "Llanta y neumático pos. 3",
    "Llanta y neumático pos. 4", "Llanta y neumático pos. 5", "Llanta y neumático pos. 6",
    "Llanta y neumático pos. 7", "Llanta y neumático pos. 8", "Llanta de repuesto"
  ],
  "Parte Exterior": [
    "Parabrisas delantero", "Parabrisas trasero", "Limpia parabrisas",
    "Vidrio de ventanas", "Espejos laterales", "Tapa de estanque combustible"
  ],
  "Parte Interna": [
    "Estado de tablero/indicadores operativos", "Maxi brake", "Freno de servicio",
    "Cinturón de seguridad conductor", "Cinturón de pasajeros", "Orden, limpieza y baño",
    "Dirección", "Bocina", "Asientos", "Luces del salón de pasajeros"
  ],
  "Accesorios de Seguridad": [
    "Conos de seguridad (3)", "Extintor (pasillo y cabina)", "Gata hidráulica",
    "Chaleco reflectante", "Cuñas de seguridad (2)", "Botiquín", "Llave de rueda",
    "Barrote de llave rueda", "Tubo de fuerza (1 metro)", "Multiplicador de fuerza", "Triangulos de seguridad (2)"
  ],
  "Documentación": [
    "Revisión técnica", "Certificado de gases", "Permiso de Circulación",
    "SOAP (seguro obligatorio)", "Padrón (inscripción)", "Cartolas de recorrido",
    "Licencia de conducir", "Tarjeta SiB"
  ],
};

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
  };
  kilometraje: string;
  danios_img?: string;
}

export default function PageContent() {
  const { id } = useParams();
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
      <h2 className="text-center mb-4">🧾 Detalles de la Inspección</h2>

      <div className="card mb-3">
        <div className="card-header bg-secondary text-white">Información General</div>
        <div className="card-body">
          <p><strong>Conductor:</strong> {formulario.conductor}</p>
          <p><strong>N° Vehículo:</strong> {formulario.numero_interno}</p>
          <p><strong>Fecha:</strong> {formulario.fecha_inspeccion}</p>
          <p><strong>Hora:</strong> {formulario.hora_inspeccion}</p>
          <p><strong>Estado:</strong>{" "}
            <span className={`badge bg-${formulario.estado === "aprobado" ? "success" : formulario.estado === "rechazado" ? "danger" : "warning"}`}>
              {formulario.estado}
            </span>
          </p>
          <p><strong>Kilometraje:</strong> {formulario.kilometraje}</p>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header bg-info text-white">Datos del Vehículo</div>
        <div className="card-body">
          <p><strong>Marca:</strong> {formulario.vehiculo.marca}</p>
          <p><strong>Modelo:</strong> {formulario.vehiculo.modelo}</p>
          <p><strong>Patente:</strong> {formulario.vehiculo.patente}</p>
          <p><strong>Año:</strong> {formulario.vehiculo.ano}</p>
          <p><strong>Color:</strong> {formulario.vehiculo.color}</p>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header bg-primary text-white">Observaciones</div>
        <div className="card-body">
          <p>{formulario.observaciones || "Sin observaciones registradas."}</p>
        </div>
      </div>

      {/* Dibujo de daños si existe */}
      {formulario.checklist["danios_img"] && (
        <div className="card mb-3">
          <div className="card-header bg-danger text-white">Dibujo de Daños</div>
          <div className="card-body text-center">
            <Image src={formulario.checklist["danios_img"]} alt="Dibujo de daños" width={600} height={400} className="img-thumbnail" />
          </div>
        </div>
      )}

      {/* Checklist agrupado */}
      {Object.entries(secciones).map(([seccion, items]) => (
        <div className="card mb-3" key={seccion}>
          <div className="card-header bg-dark text-white">{seccion}</div>
          <div className="card-body p-0">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th>Estado</th>
                  <th>Imagen</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const estado = formulario.checklist[item];
                  const img = formulario.checklist[`${item}_img`];
                  return (
                    <tr key={item}>
                      <td>{item}</td>
                      <td>
                        <span className={`badge bg-${estado === "B" ? "success" : estado === "M" ? "danger" : "secondary"}`}>
                          {estado || "NA"}
                        </span>
                      </td>
                      <td>
                        {img ? (
                          <Image
                            src={img}
                            alt={`Imagen de ${item}`}
                            width={100}
                            height={100}
                            className="img-thumbnail"
                          />
                        ) : "Sin imagen"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="text-center mt-4">
        <Link href="/admin/solicitudes/pendientes" className="btn btn-secondary">⬅ Volver</Link>
      </div>
    </div>
  );
}
