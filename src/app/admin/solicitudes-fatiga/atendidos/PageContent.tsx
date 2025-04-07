"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FormularioFatiga {
  id: string;
  id_correlativo: number;
  conductor: string;
  tipo_vehiculo: string;
  numero_interno: string;
  destino: string;
  hora_salida: string;
  fecha: string;
  respuestas: Record<number, string>;
  observaciones: Record<number, string>;
  estado: "aprobado" | "rechazado" | "pendiente";
  aprobado_por?: string;
  creado_por?: string;
  firma_img?: string; 
}

export default function PageContent() {
  const [formularios, setFormularios] = useState<FormularioFatiga[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Se mueven fuera de la función para evitar cambios durante renderizado
  const desde = fechaDesde ? new Date(fechaDesde) : null;
  const hasta = fechaHasta ? new Date(fechaHasta) : null;

  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "fatiga_somnolencia"));
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FormularioFatiga))
        .filter(f => f.estado === "aprobado" || f.estado === "rechazado") // ✅ solo los atendidos
        .sort((a, b) => b.id_correlativo - a.id_correlativo);

      setFormularios(data);
    };

    fetchFormularios();
  }, []);

  const handleDownloadPDF = async (form: FormularioFatiga) => {
    const doc = new jsPDF("p", "mm", "a4") as jsPDF & { lastAutoTable?: { finalY: number } };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;
  
    const logo = await fetch("/tarapaca.png").then(res => res.blob()).then(blob => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }));
  
    doc.addImage(logo, "PNG", 14, 10, 30, 20);
  
    const estadoIcon = form.estado === "aprobado" ? "/aprobado.png" : "/rechazado.png";
    const iconBase64 = await fetch(estadoIcon).then(res => res.blob()).then(blob => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }));
  
    doc.addImage(iconBase64, "PNG", pageWidth - 30, 10, 12, 12);
  
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Control de Fatiga y Somnolencia", pageWidth / 2, 20, { align: "center" });
  
    y = 35;
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;
  
    const datos = [
      ["Conductor", form.conductor],
      ["N° Interno", form.numero_interno],
      ["Destino", form.destino],
      ["Fecha", form.fecha],
      ["Hora salida", form.hora_salida],
      ["Tipo vehículo", form.tipo_vehiculo],
      ["Estado", form.estado],
      ["Revisado por", form.aprobado_por || "Desconocido"],
      ["Generador por", form.creado_por || "N/A"]
    ];
  
    autoTable(doc, {
      startY: y,
      head: [["Datos del Formulario", ""]],
      body: datos,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: "bold",
        halign: "center"
      },
      margin: { left: 14, right: 14 }
    });
  
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  
    const preguntas = [
      "¿Ha dormido lo suficiente?",
      "¿Sin problemas de salud?",
      "¿Está emocionalmente bien?",
      "¿Sin influencia del alcohol?",
      "¿Sin drogas ilícitas?",
      "¿Toma medicamentos que afectan?",
      "¿Libre de medicamentos perjudiciales?",
      "¿Consultó por molestias?",
      "¿Se siente fatigado?"
    ];
  
    const respuestas = Object.entries(form.respuestas).map(([idx, val]) => {
      return [`${+idx + 1}. ${preguntas[+idx]}`, val];
    });
  
    autoTable(doc, {
      startY: y,
      head: [["Pregunta", "Respuesta"]],
      body: respuestas,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        halign: "left"
      },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 1) {
          const idx = data.row.index;
          const respuesta = data.cell.text[0];
  
          // Preguntas donde "NO" es lo esperable
          const negativasEsperadas = [5, 7, 8];
  
          const esEsperada = negativasEsperadas.includes(idx)
            ? respuesta === "NO"
            : respuesta === "SI";
  
          data.cell.styles.textColor = esEsperada ? [0, 140, 0] : [200, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 }
    });
  
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  
    if (form.firma_img) {
      if (y + 45 > pageHeight - 20) {
        addFooter();
        doc.addPage();
        y = 20;
      }
  
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Firma del Conductor", 14, y);
      y += 6;
  
      try {
        doc.addImage(form.firma_img, "PNG", 14, y, 80, 40);
        y += 45;
      } catch {
        doc.text("⚠️ No se pudo cargar la firma.", 14, y + 10);
        y += 20;
      }
    }
  
    addFooter();
    doc.save(`fatiga_${form.conductor}_${form.fecha}.pdf`);
  
    function addFooter() {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.text("Buses Tarapacá", 14, pageHeight - 10);
      }
    }
  };
  
  
  
  const limpiarFiltros = () => {
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const filtrar = (f: FormularioFatiga) => {
    const texto = busqueda.toLowerCase();
    const coincide =
      f.id_correlativo.toString().includes(texto) ||
      f.conductor.toLowerCase().includes(texto) ||
      f.numero_interno.toLowerCase().includes(texto);

    const fechaForm = new Date(f.fecha);

    return (
      coincide &&
      (!desde || fechaForm >= desde) &&
      (!hasta || fechaForm <= hasta)
    );
  };

  return (
    <div className="container py-4">
      <h2 className="text-center">Formularios de Fatiga Atendidos ✅❌</h2>

      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            className="form-control"
            placeholder="Buscar por ID, conductor, N° interno"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <label>Desde</label>
          <input
            type="date"
            className="form-control"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <label>Hasta</label>
          <input
            type="date"
            className="form-control"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className="col-md-2 mb-2">
          <button className="btn btn-secondary w-100" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Conductor</th>
              <th>Realizado por</th>
              <th>Vehículo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Revisado por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {formularios.filter(filtrar).map((f) => (
              <tr key={f.id}>
                <td>{f.id_correlativo}</td>
                <td>{f.conductor}</td>
                <td>{f.creado_por || "N/A"}</td>
                <td>{f.numero_interno}</td>
                <td>{f.fecha}</td>
                <td>{f.hora_salida}</td>
                <td>
                  <span className={`badge bg-${f.estado === "aprobado" ? "success" : "danger"}`}>
                    {f.estado}
                  </span>
                </td>
                <td>{f.aprobado_por || "Desconocido"}</td>
                <td>
                  <Link href={`/admin/solicitudes-fatiga/${f.id}`} className="btn btn-primary btn-sm me-2">Ver</Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPDF(f)}>PDF</button>
                </td>
              </tr>
            ))}
            {formularios.filter(filtrar).length === 0 && (
              <tr>
                <td colSpan={9} className="text-center">No hay resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
