"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import VehicleInfo from "./components/VehicleInfo";
import ChecklistSection from "./components/ChecklistSection";

export interface FormData {
  fecha_inspeccion: string;
  hora_inspeccion: string;
  conductor: string;
  numero_interno: string;
  vehiculo: {
    marca: string;
    modelo: string;
    patente: string;
    ano: string;
    color: string;
    kms_inicial: string;
    kms_final: string;
  };
  checklist: { [key: string]: string };
  observaciones: string;
}

export default function ChecklistForm() {
  const [form, setForm] = useState<FormData>({
    fecha_inspeccion: "",
    hora_inspeccion: "",
    conductor: "",
    numero_interno: "",
    vehiculo: { marca: "", modelo: "", patente: "", ano: "", color: "", kms_inicial: "", kms_final: "" },
    checklist: {},
    observaciones: "",
  });

  const [conductores, setConductores] = useState<string[]>([]);
  const [numerosInternos, setNumerosInternos] = useState<string[]>([]);

  useEffect(() => {
    const cargarConductores = async () => {
      const snapshot = await getDocs(collection(db, "conductores"));
      setConductores(snapshot.docs.map(doc => doc.data().nombre));
    };

    const cargarNumerosInternos = async () => {
      const snapshot = await getDocs(collection(db, "vehiculos"));
      setNumerosInternos(snapshot.docs.map(doc => doc.data().numero_interno));
    };

    cargarConductores();
    cargarNumerosInternos();
  }, []);

  const cargarDatosVehiculo = async (numeroInterno: string) => {
    const snapshot = await getDocs(collection(db, "vehiculos"));
    const vehiculo = snapshot.docs.find(doc => doc.data().numero_interno === numeroInterno)?.data();

    if (vehiculo) {
      setForm(prevForm => ({
        ...prevForm,
        numero_interno: numeroInterno,
        vehiculo: {
          marca: vehiculo.marca || "",
          modelo: vehiculo.modelo || "",
          patente: vehiculo.patente || "",
          ano: vehiculo.ano || "",
          color: vehiculo.color || "",
          kms_inicial: "",
          kms_final: ""
        }
      }));
    }
  };

  /** ✅ Función para manejar el envío del formulario a Firebase */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ❗ Previene la recarga de la página
    console.log("✅ Enviando formulario a Firebase...");
    try {
      await addDoc(collection(db, "formularios"), {
        ...form,
        fecha_creacion: new Date(),
        estado: "pendiente",
        aprobado_por: null,
      });

      alert("Formulario enviado exitosamente");
      setForm({
        fecha_inspeccion: "",
        hora_inspeccion: "",
        conductor: "",
        numero_interno: "",
        vehiculo: { marca: "", modelo: "", patente: "", ano: "", color: "", kms_inicial: "", kms_final: "" },
        checklist: {},
        observaciones: "",
      });
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Error al enviar formulario");
    }
  };

  return (
    <main className="container py-4">
      <h2>Checklist Pre Uso Buses 🚌</h2>
      <form onSubmit={handleSubmit} method="POST"> {/* ✅ Agregar onSubmit aquí */}
        {/* Información del vehículo y conductor */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">Información del Vehículo y Conductor</div>
          <div className="card-body row">
            <div className="col-md-3 mb-3">
              <label>Fecha de Inspección</label>
              <input
                required type="date" className="form-control"
                onChange={(e) => setForm({ ...form, fecha_inspeccion: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label>Hora de Inspección</label>
              <input
                required type="time" className="form-control"
                onChange={(e) => setForm({ ...form, hora_inspeccion: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label>Conductor</label>
              <select
                required className="form-control"
                onChange={(e) => setForm({ ...form, conductor: e.target.value })}
              >
                <option value="">Seleccione un conductor</option>
                {conductores.map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label>Número Interno</label>
              <select
                required className="form-control"
                onChange={(e) => cargarDatosVehiculo(e.target.value)}
              >
                <option value="">Seleccione un número interno</option>
                {numerosInternos.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
          <VehicleInfo vehiculo={form.vehiculo} />
        </div>

        {/* Sección de Checklist */}
        <ChecklistSection form={form} setForm={setForm} />

        {/* Observaciones */}
        <div className="mb-3">
          <label>Observaciones</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          />
        </div>

        {/* Botón de Enviar */}
        <div className="text-center mt-3">
          <button type="submit" className="btn btn-success">Enviar</button>
        </div>
      </form>
    </main>
  );
}
