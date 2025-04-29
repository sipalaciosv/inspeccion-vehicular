"use client";

import { useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: {
    startY?: number;
    head: (string[])[]; 
    body: RowInput[];
    [key: string]: unknown;
  }) => void;
  lastAutoTable?: { finalY: number };
}

interface ChecklistGeneral {
  id: string;
  numero_interno: string;
  fecha_inspeccion: string;
}

interface ChecklistDetalle {
  checklist: Record<string, string>;
}

// ⚡ NUEVO: Ítems que deben ser ignorados en el PDF
const accesoriosSeguridad = [
  "Conos de seguridad (3)", "Extintor (pasillo y cabina)", "Gata hidráulica",
  "Chaleco reflectante", "Cuñas de seguridad (2)", "Botiquín", "Llave de rueda",
  "Barrote de llave rueda", "Tubo de fuerza (1 metro)", "Multiplicador de fuerza", "Triangulos de seguridad (2)"
];

export default function PageContent() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);

  const buscarChecklist = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("⚠️ Debes seleccionar un rango de fechas válido.");
      return;
    }

    setLoading(true);

    try {
      
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);

      const snapshot = await getDocs(collection(db, "checklist_atendidos"));
      const formularios = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChecklistGeneral))
        .filter(f => f.fecha_inspeccion >= fechaDesde && f.fecha_inspeccion <= fechaHasta);

      if (formularios.length === 0) {
        alert("❌ No se encontraron formularios en el rango.");
        setLoading(false);
        return;
      }

      const buses: Record<string, {
        observaciones: Record<string, { texto: string; fecha: string }>,
        imagenes: Record<string, string>
      }> = {};

      for (const form of formularios) {
        const detalleSnap = await getDocs(
          query(collection(db, "checklist_detalle"), where("id_formulario", "==", form.id))
        );

        if (!detalleSnap.empty) {
          const data = detalleSnap.docs[0].data() as ChecklistDetalle;

          if (!buses[form.numero_interno]) {
            buses[form.numero_interno] = { observaciones: {}, imagenes: {} };
          }

          for (const [key, valor] of Object.entries(data.checklist)) {
            if (key.endsWith("_obs") && valor.trim() !== "") {
              const item = key.replace("_obs", "");
              const actual = buses[form.numero_interno].observaciones[item];

              if (!actual || form.fecha_inspeccion > actual.fecha) {
                buses[form.numero_interno].observaciones[item] = {
                  texto: valor,
                  fecha: form.fecha_inspeccion,
                };
              }
            }

            if (key.endsWith("_img") && valor.startsWith("https")) {
              const item = key.replace("_img", "");
              buses[form.numero_interno].imagenes[item] = valor;
            }
          }
        }
      }

      await generarPDF(buses);
    } catch (error) {
      console.error("Error buscando checklist:", error);
      alert("❌ Ocurrió un error buscando checklist.");
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async (buses: Record<string, {
    observaciones: Record<string, { texto: string; fecha: string }>,
    imagenes: Record<string, string>
  }>) => {
    const doc = new jsPDF("p", "mm", "a4") as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    const logo = await fetch("/tarapaca.png")
      .then(res => res.blob())
      .then(blob => new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }));

    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.text("Buses Tarapacá", 14, pageHeight - 8);
    };

    doc.addImage(logo, "PNG", 14, 10, 30, 20);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Consolidado de Hallazgos por Buses", pageWidth / 2, 20, { align: "center" });

    y = 35;
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString("es-CL")}`, 14, y);
    doc.text(`Desde: ${fechaDesde}   Hasta: ${fechaHasta}`, pageWidth - 100, y);
    y += 10;

    for (const [numeroInterno, { observaciones, imagenes }] of Object.entries(buses)) {
      if (y + 30 > pageHeight - 20) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`Bus número interno Nº ${numeroInterno}`, 14, y);
      y += 6;

      // ✨ Filtramos aquí los accesorios
      const data = Object.entries(observaciones)
        .filter(([item]) => !accesoriosSeguridad.includes(item))
        .map(([item, obs]) => [
          item,
          obs.texto,
          obs.fecha
        ]);

      if (data.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("✅ Este bus no presentó hallazgos en el rango de fechas.", 14, y);
        y += 10;
        continue;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Observaciones encontradas:", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Ítem", "Observación", "Última Fecha"]],
        body: data,
        styles: { fontSize: 10, cellPadding: 1.5 },
        headStyles: { fillColor: [255, 204, 0], textColor: 0 },
        bodyStyles: { halign: "left" },
        margin: { left: 14, right: 14 },
      });

      y = (doc.lastAutoTable?.finalY ?? y) + 8;

      for (const [item, url] of Object.entries(imagenes)) {
        if (!observaciones[item]) continue;
        if (item === "firma") continue;
        if (accesoriosSeguridad.includes(item)) continue; // ❗ También evitamos cargar su imagen

        if (y + 70 > pageHeight - 20) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Imagen del ítem: ${item}`, 14, y);

        try {
          const img = await fetch(url).then(res => res.blob()).then(blob => new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }));

          const imgWidth = pageWidth - 28;
          const imgHeight = (imgWidth * 9) / 16;
          y += 5;
          doc.addImage(img, "JPEG", 14, y, imgWidth, imgHeight);
          y += imgHeight + 8;
        } catch {
          doc.text("⚠️ Error al cargar imagen", 14, y + 10);
          y += 20;
        }
      }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
    }

    doc.save(`consolidado_hallazgos_buses.pdf`);
  };

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header text-center bg-primary text-white">
          <h3>Consolidado de Hallazgos por Buses 🚌</h3>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-5">
              <label className="form-label">Desde</label>
              <input type="date" className="form-control" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>
            <div className="col-md-5">
              <label className="form-label">Hasta</label>
              <input type="date" className="form-control" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={buscarChecklist} disabled={loading}>
                {loading ? "Generando..." : "Generar PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
