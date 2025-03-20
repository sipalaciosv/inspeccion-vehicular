"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

interface FormularioFatiga {
  conductor: string;
  tipo_vehiculo: string;
  numero_interno: string;
  destino: string;
  hora_salida: string;
  hora_llegada: string;
  respuestas: Record<number, string>;
  observaciones: Record<number, string>;
}

export default function FatigueTest() {
  const [form, setForm] = useState<FormularioFatiga>({
    conductor: "",
    tipo_vehiculo: "",
    numero_interno: "",
    destino: "",
    hora_salida: "",
    hora_llegada: "",
    respuestas: {},
    observaciones: {},
  });
  const [conductores, setConductores] = useState<string[]>([]);
  const [vehiculos, setVehiculos] = useState<string[]>([]);

  useEffect(() => {
    const fetchConductores = async () => {
      const snapshot = await getDocs(collection(db, "conductores"));
      setConductores(snapshot.docs.map((doc) => doc.data().nombre));
    };

    const fetchVehiculos = async () => {
      const snapshot = await getDocs(collection(db, "vehiculos"));
      setVehiculos(snapshot.docs.map((doc) => doc.data().numero_interno));
    };

    fetchConductores();
    fetchVehiculos();
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRespuesta = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      respuestas: { ...prev.respuestas, [index]: value },
    }));
  };

  const handleObservacion = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      observaciones: { ...prev.observaciones, [index]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "fatiga_somnolencia"), { ...form, fecha: new Date() });
      alert("✅ Formulario enviado exitosamente");
      setForm({
        conductor: "",
        tipo_vehiculo: "",
        numero_interno: "",
        destino: "",
        hora_salida: "",
        hora_llegada: "",
        respuestas: {},
        observaciones: {},
      });
    } catch (error) {
      alert("❌ Error al enviar el formulario");
      console.error(error);
    }
  };

  return (
    <main className="container py-4">
      <h2 className="text-center">Control de Fatiga y Somnolencia 🚛</h2>
      <form onSubmit={handleSubmit}>
        <div className="card p-4">
          <h5>Datos del Conductor</h5>
          <select className="form-control mb-2" name="conductor" value={form.conductor} onChange={handleChange} required>
            <option value="">Seleccione un Conductor</option>
            {conductores.map((nombre) => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
          <input className="form-control mb-2" name="tipo_vehiculo" placeholder="Tipo de Vehículo" value={form.tipo_vehiculo} onChange={handleChange} required />
          <select className="form-control mb-2" name="numero_interno" value={form.numero_interno} onChange={handleChange} required>
            <option value="">Seleccione un Vehículo</option>
            {vehiculos.map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <input className="form-control mb-2" name="destino" placeholder="Destino de Tránsito" value={form.destino} onChange={handleChange} required />
          <input className="form-control mb-2" type="time" name="hora_salida" value={form.hora_salida} onChange={handleChange} required />
          <input className="form-control mb-2" type="time" name="hora_llegada" value={form.hora_llegada} onChange={handleChange} required />
        </div>

        <div className="card p-4 mt-3">
          <h5>Cuestionario</h5>
          {preguntas.map((pregunta, index) => (
            <div key={index} className="mb-3">
              <p>{index + 1}. {pregunta}</p>
              <label>
                <input type="radio" name={`respuesta_${index}`} value="SI" onChange={() => handleRespuesta(index, "SI")} required /> Sí
              </label>
              <label>
                <input type="radio" name={`respuesta_${index}`} value="NO" onChange={() => handleRespuesta(index, "NO")} required /> No
              </label>
              <input className="form-control mt-2" placeholder="Observaciones" onChange={(e) => handleObservacion(index, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="text-center mt-3">
          <button type="submit" className="btn btn-primary">Enviar</button>
        </div>
      </form>
    </main>
  );
}
