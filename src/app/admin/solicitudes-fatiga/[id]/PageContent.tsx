"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase";
import useUserRole from "@/hooks/useUserRole";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation"; 
interface FormularioFatiga {
  id?: string;
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
  firma_img?: string;
}

const preguntas = [
  "¿Ha dormido lo suficiente para afirmar que se encuentra apto para cumplir sus funciones y sin cansancio?",
  "¿Se encuentra sin problemas de salud (física), para la correcta realización del trabajo?",
  "¿Se encuentra emocionalmente bien para ejecutar de buena forma su trabajo?",
  "¿Se encuentra en óptimas condiciones sin consumo o influencia del alcohol?",
  "¿Se encuentra en condiciones sin consumo o influencia de drogas ilícitas?",
  "¿Me encuentro tomando medicamentos que me impidan operar y/o alteren mi concentración? ¿Los declaré?",
  "¿Se encuentra libre de consumo de medicamentos que puedan afectar su capacidad mental y/o física para conducir?",
  "¿Ha consultado algún centro de asistencia de salud por alguna molestia que le dificulte la conducción?",
  "¿Me siento enfermo o fatigado?",
];

export default function PageContent() {
  const { role: userRole } = useUserRole();
const router = useRouter();

const aprobarFormulario = async () => {
  if (!form?.id) return;
  try {
    await updateDoc(doc(db, "fatiga_somnolencia", form.id), {
      estado: "aprobado",
      aprobado_por: form.creado_por || "Administrador"
    });
    alert("✅ Formulario aprobado");
    router.push("/admin/solicitudes-fatiga/pendientes");
  } catch (error) {
    console.error(error);
    alert("❌ Error al aprobar el formulario");
  }
};

const rechazarFormulario = async () => {
  if (!form?.id) return;
  try {
    await updateDoc(doc(db, "fatiga_somnolencia", form.id), {
      estado: "rechazado",
      aprobado_por: form.creado_por || "Administrador"
    });
    alert("❌ Formulario rechazado");
    router.push("/admin/solicitudes-fatiga/pendientes");
  } catch (error) {
    console.error(error);
    alert("❌ Error al rechazar el formulario");
  }
};

  const params = useParams();
  const [form, setForm] = useState<FormularioFatiga | null>(null);

  useEffect(() => {
    
    const fetchData = async () => {
      const docRef = doc(db, "fatiga_somnolencia", params.id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setForm({ id: docSnap.id, ...docSnap.data() } as FormularioFatiga);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (!form) return <p className="text-center mt-5">Cargando...</p>;

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white text-center">
          <h3>Formulario de Fatiga N° {form.id_correlativo}</h3>
          <span className={`badge bg-${form.estado === "aprobado" ? "success" : form.estado === "rechazado" ? "danger" : "warning"}`}>
            {form.estado.toUpperCase()}
          </span>
        </div>
        <div className="card-body">
          <h5 className="mb-3">🧍 Datos del Conductor</h5>
          <div className="row mb-2">
            <div className="col-md-6"><strong>Conductor:</strong> {form.conductor}</div>
            <div className="col-md-6"><strong>Vehículo N° Interno:</strong> {form.numero_interno}</div>
            <div className="col-md-6"><strong>Tipo Vehículo:</strong> {form.tipo_vehiculo}</div>
            <div className="col-md-6"><strong>Destino:</strong> {form.destino}</div>
            <div className="col-md-6"><strong>Hora de Salida:</strong> {form.hora_salida}</div>
            <div className="col-md-6"><strong>Fecha:</strong> {form.fecha}</div>
            <div className="col-md-6"><strong>Realizado por:</strong> {form.creado_por || "N/A"}</div>
            <div className="col-md-6"><strong>Revisado por:</strong> {form.aprobado_por || "Desconocido"}</div>
          </div>

          <hr className="my-4" />

          <h5 className="mb-3">📋 Cuestionario</h5>
          {preguntas.map((pregunta, index) => {
  const respuesta = form.respuestas[index];
  const negativasEsperadas = [5, 7, 8]; // índices donde se espera "NO"
  const esEsperada = negativasEsperadas.includes(index)
    ? respuesta === "NO"
    : respuesta === "SI";

  return (
    <div key={index} className="mb-3">
      <p className="fw-bold">
        {index + 1}. {pregunta}
      </p>
      <span className={`badge bg-${esEsperada ? "success" : "danger"} me-2`}>
        {respuesta}
      </span>
      {form.observaciones[index] && (
        <p className="mt-1"><strong>📝 Observación:</strong> {form.observaciones[index]}</p>
      )}
    </div>
  );
})}

          {form.firma_img && (
  <div className="mt-4 text-center">
    <h5 className="mb-2">✍️ Firma del Conductor</h5>
    <img
      src={form.firma_img}
      alt="Firma"
      style={{ maxWidth: "300px", border: "1px solid #ccc", padding: "4px", borderRadius: "8px" }}
    />
  </div>
)}

        </div>
      </div>
      {form.estado === "pendiente" && userRole && (
  <div style={{
    position: "fixed",
    bottom: "30px",
    right: "30px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  }}>
    <button
      onClick={aprobarFormulario}
      className="btn btn-success"
      style={{ minWidth: "160px" }}
    >
      ✅ Aprobar
    </button>
    <button
      onClick={rechazarFormulario}
      className="btn btn-danger"
      style={{ minWidth: "160px" }}
    >
      ❌ Rechazar
    </button>
  </div>
)}

    </div>
  );
}
