"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link"; 

// ✅ Extendemos `jsPDF` para incluir autoTable correctamente
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: {
    startY?: number;
    head: (string[])[];
    body: (string | number)[][];
  }) => void;
}

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

export default function Solicitudes() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);

  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "formularios"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Formulario));
      setFormularios(data);
    };

    fetchFormularios();
  }, []);

  const handleAprobar = async (id: string) => {
    await updateDoc(doc(db, "formularios", id), { estado: "aprobado" });
    setFormularios(formularios.map(f => (f.id === id ? { ...f, estado: "aprobado" } : f)));
  };

  const handleRechazar = async (id: string) => {
    await updateDoc(doc(db, "formularios", id), { estado: "rechazado" });
    setFormularios(formularios.map(f => (f.id === id ? { ...f, estado: "rechazado" } : f)));
  };

  const contarHallazgos = (checklist: { [key: string]: string }) => {
    return Object.values(checklist).filter(value => value === "M").length;
  };

  const handleDownloadPDF = (form: Formulario) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(16);
    doc.text("Reporte de Inspección", 14, 20);
    doc.setFontSize(12);
    doc.text(`Conductor: ${form.conductor}`, 14, 30);
    doc.text(`Número Interno: ${form.numero_interno}`, 14, 40);
    doc.text(`Fecha: ${form.fecha_inspeccion}`, 14, 50);
    doc.text(`Hora: ${form.hora_inspeccion}`, 14, 60);
    doc.text(`Número de Hallazgos: ${contarHallazgos(form.checklist)}`, 14, 70);
    doc.text("Observaciones:", 14, 80);
    doc.text(form.observaciones || "Ninguna", 14, 90);

    // ✅ Agregar información del vehículo al PDF
    doc.text("Información del Vehículo:", 14, 100);
    doc.text(`Marca: ${form.vehiculo.marca}`, 14, 110);
    doc.text(`Modelo: ${form.vehiculo.modelo}`, 14, 120);
    doc.text(`Patente: ${form.vehiculo.patente}`, 14, 130);
    doc.text(`Año: ${form.vehiculo.ano}`, 14, 140);
    doc.text(`Color: ${form.vehiculo.color}`, 14, 150);
    doc.text(`Kilómetros Iniciales: ${form.vehiculo.kms_inicial}`, 14, 160);
    doc.text(`Kilómetros Finales: ${form.vehiculo.kms_final}`, 14, 170);

    // ✅ Agregar tabla del checklist
    autoTable(doc, {
      startY: 180,
      head: [["Ítem", "Estado"]],
      body: Object.entries(form.checklist).map(([item, estado]) => [item, estado]),
    });

    // ✅ Agregar imágenes si hay hallazgos con "M"
    let yPosition = doc.internal.pageSize.height - 60;
    Object.entries(form.checklist).forEach(([item, estado]) => {
      if (estado.startsWith("https://")) {
        if (yPosition + 50 > doc.internal.pageSize.height) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`Imagen: ${item}`, 14, yPosition);
        doc.addImage(estado, "JPEG", 14, yPosition + 10, 60, 40);
        yPosition += 50;
      }
    });

    doc.save(`reporte_${form.conductor}_${form.fecha_inspeccion}.pdf`);
  };

  return (
    <div className="container py-5">
      <h2 className="text-center">Solicitudes Pendientes 📋</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Conductor</th>
            <th>N° Vehículo</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th> No Conformidades</th>
            <th>Estado</th>
            <th>Acciones</th>
            <th>Visualizar</th>
          </tr>
        </thead>
        <tbody>
          {formularios.map(f => (
            <tr key={f.id}>
              <td>{f.conductor}</td>
              <td>{f.numero_interno}</td>
              <td>{f.fecha_inspeccion}</td>
              <td>{f.hora_inspeccion}</td>
              <td>
                <span className="badge bg-warning">{contarHallazgos(f.checklist)}</span>
              </td>
              <td>
                <span className={`badge bg-${f.estado === "pendiente" ? "warning" : f.estado === "aprobado" ? "success" : "danger"}`}>
                  {f.estado}
                </span>
              </td>
              {/* ✅ Columna de Acciones */}
              <td>
                {f.estado === "pendiente" && (
                  <>
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleAprobar(f.id)}>Aprobar</button>
                    <button className="btn btn-danger btn-sm me-2" onClick={() => handleRechazar(f.id)}>Rechazar</button>
                  </>
                )}
              </td>
              {/* ✅ Columna de Visualización */}
              <td>
              <Link href={`/admin/solicitudes/${f.id}`} className="btn btn-primary btn-sm me-2">
  Ver Detalles
</Link>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPDF(f)}>
                  Descargar PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
