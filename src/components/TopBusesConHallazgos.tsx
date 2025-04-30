"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

interface ChecklistGeneral {
  id: string;
  numero_interno: string;
  fecha_inspeccion: string; // YYYY-MM-DD
  hallazgos: number;
}

function getWeekRange(offset = 0) {
  const today = new Date();
  const currentDay = today.getDay();
  const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diffToMonday));
  monday.setDate(monday.getDate() + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return {
    from: monday.toISOString().split("T")[0],
    to: sunday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("es-CL")} - ${sunday.toLocaleDateString("es-CL")}`,
    isCurrentWeek: offset === 0,
    isFuture: sunday > new Date(),
  };
}

export default function TopBusesConHallazgos() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [allFormularios, setAllFormularios] = useState<ChecklistGeneral[]>([]);
  const week = getWeekRange(weekOffset);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "checklist_atendidos"));
      const datos = snapshot.docs.map(doc => doc.data() as ChecklistGeneral);
      setAllFormularios(datos);
    };
    fetchData();
  }, []);

  const filtered = allFormularios.filter(f =>
    f.fecha_inspeccion >= week.from && f.fecha_inspeccion <= week.to
  );

  const conteoPorBus: Record<string, number> = {};
  for (const form of filtered) {
    conteoPorBus[form.numero_interno] = (conteoPorBus[form.numero_interno] || 0) + form.hallazgos;
  }

  const topSorted = Object.entries(conteoPorBus)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([numero_interno, total_hallazgos]) => ({ numero_interno, total_hallazgos }));

  const maxHallazgos = Math.max(...topSorted.map(b => b.total_hallazgos), 1);

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header d-flex justify-content-between align-items-center text-white" style={{ backgroundColor: "var(--color-principal)" }}>
        <h5 className="mb-0">🚌 Top 5 Buses con Más Hallazgos</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light" onClick={() => setWeekOffset(prev => prev - 1)}>
            ◀ Anterior
          </button>
          <button className="btn btn-sm btn-light" onClick={() => setWeekOffset(prev => prev + 1)} disabled={week.isFuture}>
            Siguiente ▶
          </button>
        </div>
      </div>
      <div className="card-body">
        <p className="text-muted mb-3">Semana del <strong>{week.label}</strong></p>

        {topSorted.length === 0 ? (
          <div className="alert alert-info">No se registraron hallazgos en esta semana.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {topSorted.map((bus) => {
              const widthPercent = (bus.total_hallazgos / maxHallazgos) * 100;
              return (
                <div key={bus.numero_interno}>
                  <div className="d-flex justify-content-between mb-1">
                    <strong>Bus Nº {bus.numero_interno}</strong>
                    <span className="text-danger fw-semibold">{bus.total_hallazgos} hallazgos</span>
                  </div>
                  <div className="progress" style={{ height: "22px" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: `rgba(220, 53, 69, ${0.4 + widthPercent / 200})`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
