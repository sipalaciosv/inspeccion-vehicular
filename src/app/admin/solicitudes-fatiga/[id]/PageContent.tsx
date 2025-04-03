"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

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
            <div className="col-md-6"><strong>Creado por:</strong> {form.creado_por || "N/A"}</div>
            <div className="col-md-6"><strong>Revisado por:</strong> {form.aprobado_por || "Desconocido"}</div>
          </div>

          <hr className="my-4" />

          <h5 className="mb-3">📋 Cuestionario</h5>
          {preguntas.map((pregunta, index) => (
            <div key={index} className="mb-3">
              <p className="fw-bold">
                {index + 1}. {pregunta}
              </p>
              <span className={`badge bg-${form.respuestas[index] === "SI" ? "success" : "danger"} me-2`}>
                {form.respuestas[index]}
              </span>
              {form.observaciones[index] && (
                <p className="mt-1"><strong>📝 Observación:</strong> {form.observaciones[index]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
