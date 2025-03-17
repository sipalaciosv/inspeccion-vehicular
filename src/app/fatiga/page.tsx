"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";

export interface FatigaFormData {
  fecha: string;
  hora: string;
  conductor: string;
  nivel_fatiga: string;
  horas_sueño: number;
  sintoma_fatiga: boolean;
  observaciones: string;
}

export default function FatigaForm() {
  const [form, setForm] = useState<FatigaFormData>({
    fecha: "",
    hora: "",
    conductor: "",
    nivel_fatiga: "",
    horas_sueño: 0,
    sintoma_fatiga: false,
    observaciones: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "declaraciones_fatiga"), {
        ...form,
        fecha_creacion: new Date(),
      });

      alert("Declaración enviada correctamente");

      setForm({
        fecha: "",
        hora: "",
        conductor: "",
        nivel_fatiga: "",
        horas_sueño: 0,
        sintoma_fatiga: false,
        observaciones: "",
      });

    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Error al enviar la declaración");
    }
  };

  return (
    <main className="container py-4">
      <h2>Declaración de Fatiga 💤</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label>Fecha</label>
            <input
              type="date"
              className="form-control"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div className="col-md-4 mb-3">
            <label>Hora</label>
            <input
              type="time"
              className="form-control"
              required
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
            />
          </div>
          <div className="col-md-4 mb-3">
            <label>Conductor</label>
            <input
              type="text"
              className="form-control"
              required
              value={form.conductor}
              onChange={(e) => setForm({ ...form, conductor: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-3">
          <label>Nivel de Fatiga</label>
          <select
            className="form-control"
            required
            value={form.nivel_fatiga}
            onChange={(e) => setForm({ ...form, nivel_fatiga: e.target.value })}
          >
            <option value="">Seleccione una opción</option>
            <option value="Bajo">Bajo</option>
            <option value="Moderado">Moderado</option>
            <option value="Alto">Alto</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Horas de Sueño en las últimas 24 horas</label>
          <input
            type="number"
            className="form-control"
            min="0"
            required
            value={form.horas_sueño}
            onChange={(e) => setForm({ ...form, horas_sueño: parseInt(e.target.value) })}
          />
        </div>

        <div className="mb-3">
          <label>
            <input
              type="checkbox"
              checked={form.sintoma_fatiga}
              onChange={(e) => setForm({ ...form, sintoma_fatiga: e.target.checked })}
            />
            &nbsp; Presenta síntomas de fatiga (somnolencia, dificultad para concentrarse)
          </label>
        </div>

        <div className="mb-3">
          <label>Observaciones</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          />
        </div>

        <div className="text-center mt-3">
          <button type="submit" className="btn btn-primary">Enviar</button>
        </div>
      </form>
    </main>
  );
}
