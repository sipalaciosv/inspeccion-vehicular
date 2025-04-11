"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";



interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: {
    startY?: number;
    head: (string[])[]; 
    body: RowInput[];
    [key: string]: unknown;
  }) => void;
  lastAutoTable?: {
    finalY: number;
  };
}


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
  id_correlativo: number;
  conductor: string;
  numero_interno: string;
  fecha_inspeccion: string;
  hora_inspeccion: string;
  kilometraje?: string;
  checklist: { [key: string]: string };
  observaciones: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  aprobado_por?: string; // ✅ Agregado aquí
  creado_por?: string;
  hallazgos: number; 
  danios_img?: string; 
  firma_img?: string;
  vehiculo: {
    marca: string;
    modelo: string;
    patente: string;
    ano: string;
    color: string;
   
  };
}

export default function PageContent() {
  
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);


  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "checklist_atendidos"));

      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Formulario))
        .filter(f => f.estado !== "pendiente")
        .sort((a, b) => b.id_correlativo - a.id_correlativo); // 🆕 Ordenar
      setFormularios(data);
    };

    fetchFormularios();
  }, []);

  const handleDownloadPDF = async (form: Formulario) => {
     // 🧠 Si el checklist no viene embebido, lo traemos desde checklist_detalle
  if (!form.checklist || Object.keys(form.checklist).length === 0) {
    const q = query(
      collection(db, "checklist_detalle"),
      where("id_formulario", "==", form.id)
    );
    const detalleSnap = await getDocs(q);

    if (!detalleSnap.empty) {
      const data = detalleSnap.docs[0].data();
      form.checklist = data.checklist;
    } else {
      alert("❌ No se encontró el detalle del checklist para este formulario.");
      return;
    }
  }
    const doc = new jsPDF("p", "mm", "a4") as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;
  
    const logo = await fetch("/tarapaca.png").then(res => res.blob()).then(blob => new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }));
  
    doc.addImage(logo, "PNG", 14, 10, 30, 20);
  
    const estadoIcon = form.estado === "aprobado" ? "/aprobado.png" : "/rechazado.png";
    const iconBase64 = await fetch(estadoIcon).then(res => res.blob()).then(blob => new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }));
  
    doc.addImage(iconBase64, "PNG", pageWidth - 26, 12, 10, 10);
  
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Checklist Buses Tarapacá", pageWidth / 2, 20, { align: "center" });
  
    y = 35;
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
  
    // Datos del formulario y vehículo
    const datosFormulario = [
      ["Conductor", form.conductor],
      ["N° Interno", form.numero_interno],
      ["Fecha", form.fecha_inspeccion],
      ["Hora", form.hora_inspeccion],
      ["Kilometraje", form.kilometraje || "N/A"],
      ["Estado", form.estado],
      ["Revisado por", form.aprobado_por || "Desconocido"],
      ["Realizado por", form.creado_por || "N/A"],
      ["Observaciones", form.observaciones || "Ninguna"]
    ];
    const datosVehiculo = [
      ["Marca", form.vehiculo.marca],
      ["Modelo", form.vehiculo.modelo],
      ["Patente", form.vehiculo.patente],
      ["Año", form.vehiculo.ano || "N/A"],
      ["Color", form.vehiculo.color || "N/A"]
    ];
    const mergedBody = datosFormulario.map((fila, index) => {
      const vehiculoFila = datosVehiculo[index];
      return [fila[0], fila[1], vehiculoFila?.[0] || "", vehiculoFila?.[1] || ""];
    });
  
    autoTable(doc, {
      startY: y,
      head: [[
        { content: "Datos del Formulario", colSpan: 2, styles: { halign: "center", fillColor: [240, 240, 240] } },
        { content: "Información del Vehículo", colSpan: 2, styles: { halign: "center", fillColor: [240, 240, 240] } }
      ]],
      body: mergedBody,
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { textColor: 0, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 30 }, 1: { cellWidth: 50 },
        2: { cellWidth: 30 }, 3: { cellWidth: 50 }
      },
      margin: { left: 14, right: 14 }
    });
  
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  
    // Secciones checklist
    for (const [titulo, items] of Object.entries(secciones)) {
      if (y + 30 > pageHeight - 20) { addFooter(); doc.addPage(); y = 20; }
  
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(titulo, 14, y);
      y += 4;
  
      const body = [];
      for (let i = 0; i < items.length; i += 2) {
        const row = [];
        for (let j = 0; j < 2; j++) {
          const item = items[i + j];
          if (item) row.push(item, form.checklist[item] || "N/A");
          else row.push("", "");
        }
        body.push(row);
      }
  
      autoTable(doc, {
        startY: y,
        head: [["Ítem", "Estado", "Ítem", "Estado"]],
        body,
        styles: { fontSize: 9, cellPadding: 1.5 },
        headStyles: {
          fillColor: [52, 58, 64],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { halign: 'left' },
        didParseCell: (data) => {
          if (data.section === 'body' && (data.column.index === 1 || data.column.index === 3)) {
            const value = data.cell.text[0];
            data.cell.styles.textColor =
              value === "B" ? [0, 150, 0] :
              value === "M" ? [200, 0, 0] :
              [100, 100, 100];
          }
        },
        margin: { left: 14, right: 14 }
      });
  
      y = (doc.lastAutoTable?.finalY ?? y) + 6;
    }
  // ✅ Tabla de observaciones por ítem (solo si existen)
const observacionesItems = Object.entries(form.checklist)
.filter(([k, v]) => k.endsWith("_obs") && v.trim().length > 0)
.map(([k, v]) => [k.replace("_obs", ""), v]);

if (observacionesItems.length > 0) {
if (y + 30 > pageHeight - 20) { addFooter(); doc.addPage(); y = 20; }

doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Observaciones de las No Conformidades", 14, y);
y += 4;

autoTable(doc, {
  startY: y,
  head: [["Ítem", "Observación"]],
  body: observacionesItems,
  styles: { fontSize: 9, cellPadding: 1.5 },
  headStyles: {
    fillColor: [255, 204, 0],
    textColor: 0,
    fontStyle: 'bold',
    halign: 'center'
  },
  bodyStyles: {
    halign: 'left',
    valign: 'top'
  },
  columnStyles: {
    0: { cellWidth: 60 },
    1: { cellWidth: pageWidth - 60 - 28 }
  },
  margin: { left: 14, right: 14 }
});

y = (doc.lastAutoTable?.finalY ?? y) + 6;
}

    // 🚌 Dibujo del bus
    // 🚌 Dibujo del bus
const daniosImg = form.checklist?.danios_img;
if (daniosImg) {
  if (y + 100 > pageHeight - 20) { addFooter(); doc.addPage(); y = 20; }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Dibujo de daños en el bus", 14, y);
  y += 6;

  try {
    const maxImageWidth = pageWidth - 28;
    const maxImageHeight = 100;
    doc.addImage(daniosImg, "PNG", 14, y, maxImageWidth, maxImageHeight);
    y += maxImageHeight + 5;
  } catch {
    doc.text("⚠️ No se pudo cargar la imagen de daños.", 14, y);
    y += 20;
  }
}

  
    // 📸 Imágenes de ítems en mal estado (M)
    const imagenesMalEstado = Object.entries(form.checklist)
      .filter(([item, estado]) => estado === "M" && form.checklist[`${item}_img`]?.startsWith("https"));
  
    for (const [item] of imagenesMalEstado) {
      const url = form.checklist[`${item}_img`];
      if (!url) continue;
  
      if (y + 50 > pageHeight - 20) { addFooter(); doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Ítem con estado "M": ${item}`, 14, y);
  
      try {
        doc.addImage(url, "JPEG", 14, y + 5, 60, 40);
      } catch {
        doc.text("⚠️ Error al cargar imagen", 14, y + 10);
      }
  
      y += 50;
    }
  
    // 📎 Otras imágenes
    const otrasImagenes = Object.entries(form.checklist)
    .filter(([k, v]) =>
      k.endsWith("_img") &&
      v.startsWith("https") &&
      !imagenesMalEstado.some(([malKey]) => `${malKey}_img` === k) &&
      k !== "danios_img" &&
      k !== "firma_img"
    );
  
  
    if (otrasImagenes.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Otras Imágenes Adjuntas", 14, y);
      y += 6;
  
      for (const [item, url] of otrasImagenes) {
        if (y + 50 > pageHeight - 20) { addFooter(); doc.addPage(); y = 20; }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Ítem: ${item.replace("_img", "")}`, 14, y);
        try {
          doc.addImage(url, "JPEG", 14, y + 5, 60, 40);
        } catch {
          doc.text("⚠️ Error al cargar imagen", 14, y + 10);
        }
        y += 50;
      }
    }
  
// ✍️ Firma
const firmaImg = form.checklist?.firma_img;
const hayImagenesMalEstado = imagenesMalEstado.length > 0;

if (firmaImg) {
  const firmaAlturaPequeña = 15; // más chica
  const firmaAncho = 30;         // más angosta
  const espacioRequerido = firmaAlturaPequeña + 16;
  const espacioRestante = pageHeight - y - 20;
  const centroX = pageWidth / 2;

  const dibujarFirmaCentrada = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Firma del conductor: ${form.conductor}`, centroX, y, { align: "center" });

    y += 5;

    try {
      // 🖋️ Dibujar firma primero
      doc.addImage(firmaImg, "PNG", centroX - firmaAncho / 2, y, firmaAncho, firmaAlturaPequeña);

      // ➖ Línea justo debajo de la firma
      const lineaY = y + firmaAlturaPequeña + 2;
      doc.setDrawColor(100);
      doc.setLineWidth(0.5);
      doc.line(centroX - 30, lineaY, centroX + 30, lineaY);

      y += firmaAlturaPequeña + 8;
    } catch {
      doc.setFont("helvetica", "normal");
      doc.text("⚠️ No se pudo cargar la firma.", 14, y + 10);
      y += 20;
    }
  };

  if (!hayImagenesMalEstado && espacioRestante >= espacioRequerido) {
    // ✅ Cabe debajo del bus, centrado
    dibujarFirmaCentrada();
  } else {
    // ➕ Otras condiciones: nueva página
    if (y + espacioRequerido > pageHeight - 20) {
      addFooter();
      doc.addPage();
      y = 20;
    }
    dibujarFirmaCentrada();
  }
}



  
    addFooter();
    doc.save(`checklist_${form.conductor}_${form.fecha_inspeccion}.pdf`);
  
    function addFooter() {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
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

  const filtrar = (f: Formulario) => {
    const texto = busqueda.toLowerCase();
    const coincide =
      f.id_correlativo?.toString().includes(texto) ||
      f.conductor?.toLowerCase().includes(texto) ||
      f.numero_interno?.toLowerCase().includes(texto);

    const fechaForm = new Date(f.fecha_inspeccion);
    const desde = fechaDesde ? new Date(fechaDesde) : null;
    const hasta = fechaHasta ? new Date(fechaHasta) : null;

    const dentroRango =
      (!desde || fechaForm >= desde) &&
      (!hasta || fechaForm <= hasta);

    return coincide && dentroRango;
  };
  const filtrados = formularios.filter(filtrar);

  const {
    currentPage,
    totalPages,
    paginatedItems,
    handlePageChange,
  } = usePagination<Formulario>({
    items: filtrados,
    itemsPerPage: itemsPerPage,
  });
  
  useEffect(() => {
    handlePageChange(1);
  }, [itemsPerPage, handlePageChange]); // ✅ limpio y sin warning
  
  return (
    <div className="container py-4 modulo-checklist-atendidos">
      <div className="card shadow rounded-3">
        {/* Título con línea naranja abajo */}
        <div className="card-header text-center bg-white">
          <h4 className="mb-0">
            Formularios Checklist Atendidos <span role="img" aria-label="validado">✅❌</span>
          </h4>
        </div>
  
        <div className="card-body">
          {/* Filtros por fecha */}
          <div className="row mb-3">
            <div className="col-md-5">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-limpiar w-100" onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
  
          {/* Buscador y selector de filas */}
          <div className="row align-items-center mb-3">
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Buscar por ID, conductor, N° interno"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="col-md-3 ms-auto">
              <select
                className="form-select"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                {[5, 10, 20, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    Ver {num} por página
                  </option>
                ))}
              </select>
            </div>
          </div>
  
          {/* Tabla */}
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Conductor</th>
                  <th>Realizado por</th>
                  <th>N° Vehículo</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>No Conformidades</th>
                  <th>Estado</th>
                  <th>Revisado por</th>
                  <th>Visualizar</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id_correlativo}</td>
                    <td>{f.conductor}</td>
                    <td>{f.creado_por || "N/A"}</td>
                    <td>{f.numero_interno}</td>
                    <td>{f.fecha_inspeccion}</td>
                    <td>{f.hora_inspeccion}</td>
                    <td>
                      <span className="badge badge-pendiente">
                        {f.hallazgos ?? 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${f.estado === "aprobado" ? "success" : "danger"}`}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td>{f.aprobado_por || "Desconocido"}</td>
                    <td>
                      <Link
                        href={`/admin/solicitudes/${f.id}?from=atendidos`}
                        className="btn btn-primary btn-sm me-2"
                      >
                        Ver Detalles
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPDF(f)}
                      >
                        Descargar PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center">
                      No hay resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
  
          {/* Paginación */}
          <div className="mt-3 d-flex justify-content-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
  
}
