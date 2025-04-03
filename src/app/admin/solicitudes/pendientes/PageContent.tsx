"use client";


import useUserRole from "@/hooks/useUserRole";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import Link from "next/link";
//import jsPDF from "jspdf";
//import autoTable from "jspdf-autotable";
import { auth } from "@/firebase";
import { getDoc } from "firebase/firestore";


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
  aprobado_por?: string;
  creado_por?: string;
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
// interface jsPDFWithAutoTable extends jsPDF {
//   lastAutoTable?: {
//     finalY: number;
//   };
// }
export default function PageContent() {
  const { role, loading } = useUserRole();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [adminNombre, setAdminNombre] = useState<string | null>(null);
  

  


  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "formularios"));
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Formulario))
        .filter(f => f.estado === "pendiente")
        .sort((a, b) => b.id_correlativo - a.id_correlativo); // 🆕 Ordenar
        
      setFormularios(data);
        // 🔐 Obtener nombre del admin actual
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAdminNombre(userData.nombre);
      }
    }
    };

    fetchFormularios();
  }, []);

  const contarHallazgos = (checklist: { [key: string]: string }) =>
    Object.values(checklist).filter(val => val === "M").length;

  const handleAprobar = async (id: string) => {
    await updateDoc(doc(db, "formularios", id), {
      estado: "aprobado",
      aprobado_por: adminNombre || "Desconocido",
    });
    setFormularios(prev => prev.filter(f => f.id !== id));
  };

  const handleRechazar = async (id: string) => {
    await updateDoc(doc(db, "formularios", id), {
      estado: "rechazado",
      aprobado_por: adminNombre || "Desconocido",
    });
    setFormularios(prev => prev.filter(f => f.id !== id));
  };


  // const handleDownloadPDF = async (form: Formulario) => {
  //   const doc = new jsPDF("p", "mm", "a4") as jsPDFWithAutoTable;
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   const pageHeight = doc.internal.pageSize.getHeight();
  //   let y = 20;
  
  //   // 🔹 Logo
  //   const logo = await fetch("/tarapaca.png")
  //     .then(res => res.blob())
  //     .then(blob => new Promise<string>((resolve) => {
  //       const reader = new FileReader();
  //       reader.onload = () => resolve(reader.result as string);
  //       reader.readAsDataURL(blob);
  //     }));
  
  //   doc.addImage(logo, "PNG", 14, 10, 30, 20);
  
  //   // 🔸 Título
  //   doc.setFontSize(16);
  //   doc.setFont("helvetica", "bold");
  //   doc.text("Checklist Buses Tarapacá", pageWidth / 2, 20, { align: "center" });
  
  //   y = 35;
  //   doc.setLineWidth(0.5);
  //   doc.line(14, y, pageWidth - 14, y);
  //   y += 10;
  
  //   // 🔸 Tabla 1: Datos del formulario
  //   const datosFormulario = [
  //     ["Conductor", form.conductor],
  //     ["N° Interno", form.numero_interno],
  //     ["Fecha", form.fecha_inspeccion],
  //     ["Hora", form.hora_inspeccion],
  //     ["Kilometraje", form.kilometraje || "N/A"],
  //     ["Estado", form.estado],
  //     ["Observaciones", form.observaciones || "Ninguna"]
  //   ];
  
  //   const datosVehiculo = [
  //     ["Marca", form.vehiculo.marca],
  //     ["Modelo", form.vehiculo.modelo],
  //     ["Patente", form.vehiculo.patente],
  //     ["Año", form.vehiculo.ano || "N/A"],
  //     ["Color", form.vehiculo.color || "N/A"]
  //   ];
  
  //   autoTable(doc, {
  //     startY: y,
  //     head: [["Datos del Formulario", ""]],
  //     body: datosFormulario,
  //     styles: { fontSize: 10, cellPadding: 2 },
  //     headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold", halign: "center" },
  //     margin: { left: 14, right: 14 },
  //   });
  
  //   y = doc.lastAutoTable?.finalY ?? y + 10;
  
  //   // 🔸 Tabla 2: Datos del vehículo
  //   autoTable(doc, {
  //     startY: y,
  //     head: [["Información del Vehículo", ""]],
  //     body: datosVehiculo,
  //     styles: { fontSize: 10, cellPadding: 2 },
  //     headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold", halign: "center" },
  //     margin: { left: 14, right: 14 },
  //   });
  
  //   y = doc.lastAutoTable?.finalY ?? y + 10;
  
  //   // 🔸 Checklist por secciones
  //   const secciones: { [key: string]: string[] } = {
  //     "Sistema de Luces": [
  //       "Luz delantera alta", "Luz delantera baja", "Luces de emergencia",
  //       "Luces neblineros", "Luces direccionales delanteras", "Luces direccionales traseras", "Luces de salón"
  //     ],
  //     "Estado de Llantas y Neumáticos": [
  //       "Llanta y neumático pos. 1", "Llanta y neumático pos. 2", "Llanta y neumático pos. 3",
  //       "Llanta y neumático pos. 4", "Llanta y neumático pos. 5", "Llanta y neumático pos. 6",
  //       "Llanta y neumático pos. 7", "Llanta y neumático pos. 8", "Llanta de repuesto"
  //     ],
  //     "Parte Exterior": [
  //       "Parabrisas delantero", "Parabrisas trasero", "Limpia parabrisas",
  //       "Vidrio de ventanas", "Espejos laterales", "Tapa de estanque combustible"
  //     ],
  //     "Parte Interna": [
  //       "Estado de tablero/indicadores operativos", "Maxi brake", "Freno de servicio",
  //       "Cinturón de seguridad conductor", "Cinturón de pasajeros", "Orden, limpieza y baño",
  //       "Dirección", "Bocina", "Asientos", "Luces del salón de pasajeros"
  //     ],
  //     "Accesorios de Seguridad": [
  //       "Conos de seguridad (3)", "Extintor (pasillo y cabina)", "Gata hidráulica",
  //       "Chaleco reflectante", "Cuñas de seguridad (2)", "Botiquín", "Llave de rueda",
  //       "Barrote de llave rueda", "Tubo de fuerza (1 metro)", "Multiplicador de fuerza", "Triangulos de seguridad (2)"
  //     ],
  //     "Documentación": [
  //       "Revisión técnica", "Certificado de gases", "Permiso de Circulación",
  //       "SOAP (seguro obligatorio)", "Padrón (inscripción)", "Cartolas de recorrido",
  //       "Licencia de conducir", "Tarjeta SiB"
  //     ],
  //   };
  
  //   for (const [titulo, items] of Object.entries(secciones)) {
  //     if (y + 30 > pageHeight - 20) {
  //       addFooter();
  //       doc.addPage();
  //       y = 20;
  //     }
  
  //     doc.setFont("helvetica", "bold");
  //     doc.setFontSize(12);
  //     doc.text(titulo, 14, y);
  //     y += 6;
  
  //     autoTable(doc, {
  //       startY: y,
  //       head: [["Ítem", "Estado"]],
  //       body: items.map(item => [item, form.checklist[item] || "N/A"]),
  //       styles: { fontSize: 10, cellPadding: 2 },
  //       headStyles: {
  //         fillColor: [52, 58, 64],
  //         textColor: 255,
  //         fontStyle: "bold",
  //         halign: "center",
  //       },
  //       bodyStyles: { halign: "left" },
  //       didParseCell: (data) => {
  //         if (data.section === 'body' && data.column.index === 1) {
  //           const val = data.cell.text[0];
  //           if (val === "B") data.cell.styles.textColor = [0, 150, 0];
  //           else if (val === "M") data.cell.styles.textColor = [200, 0, 0];
  //           else data.cell.styles.textColor = [100, 100, 100];
  //         }
  //       },
  //       margin: { left: 14, right: 14 },
  //     });
  
  //     y = doc.lastAutoTable?.finalY ?? y + 10;
  //   }
  
  //   // 🖼️ Imágenes adjuntas
  //   const imagenes = Object.entries(form.checklist).filter(([, val]) => val.startsWith("https://"));
  //   if (imagenes.length > 0) {
  //     doc.setFont("helvetica", "bold");
  //     doc.setFontSize(12);
  //     doc.text("Imágenes Adjuntas", 14, y);
  //     y += 8;
  
  //     for (const [item, url] of imagenes) {
  //       if (y + 50 > pageHeight - 20) {
  //         addFooter();
  //         doc.addPage();
  //         y = 20;
  //       }
  
  //       doc.setFont("helvetica", "normal");
  //       doc.text(`Ítem: ${item}`, 14, y);
  
  //       try {
  //         doc.addImage(url, "JPEG", 14, y + 5, 60, 40);
  //       } catch {
  //         doc.text("⚠️ Error al cargar imagen", 14, y + 10);
  //       }
  
  //       y += 50;
  //     }
  //   }
  
  //   // 📌 Imagen de daños
  //   if (form.checklist.danios_img) {
  //     if (y + 60 > pageHeight - 20) {
  //       addFooter();
  //       doc.addPage();
  //       y = 20;
  //     }
  
  //     doc.setFont("helvetica", "bold");
  //     doc.setFontSize(12);
  //     doc.text("Dibujo de daños en el bus", 14, y);
  //     y += 8;
  
  //     try {
  //       doc.addImage(form.checklist.danios_img, "PNG", 14, y, 100, 60);
  //       y += 70;
  //     } catch {
  //       doc.text("⚠️ No se pudo cargar la imagen de daños.", 14, y + 10);
  //       y += 20;
  //     }
  //   }
  
  //   addFooter();
  //   doc.save(`reporte_${form.conductor}_${form.fecha_inspeccion}.pdf`);
  
  //   function addFooter() {
  //     const pageCount = doc.getNumberOfPages();
  //     for (let i = 1; i <= pageCount; i++) {
  //       doc.setPage(i);
  //       doc.setFontSize(10);
  //       doc.setTextColor(150);
  //       doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  //       doc.text("Buses Tarapacá", 14, pageHeight - 10);
  //     }
  //   }
  // };
  
  

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
  if (loading) return null;
  return (
    <div className="container py-4">
      <h2 className="text-center">Formularios Checklist Pendientes 📋</h2>

      {/* 🔍 Filtros */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input className="form-control" placeholder="Buscar por ID, conductor, N° interno"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="col-md-3 mb-2">
        <label className="form-label">Desde</label>
          <input type="date" className="form-control" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </div>
        <div className="col-md-3 mb-2">
        <label className="form-label">Hasta</label>
          <input type="date" className="form-control" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>
        <div className="col-md-2 mb-2">
          <button className="btn btn-secondary w-100" onClick={limpiarFiltros}>Limpiar</button>
        </div>
      </div>

      {/* 📄 Tabla */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Conductor</th>
              <th>Generado por</th>
              <th>N° Vehículo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>No Conformidades</th>
              <th>Estado</th>
              {role === "admin" && <th>Acciones</th>}

              <th>Visualizar</th>
            </tr>
          </thead>
          <tbody>
            {formularios.filter(filtrar).map(f => (
              <tr key={f.id}>
                <td>{f.id_correlativo}</td>
                <td>{f.conductor}</td>
                <td>{f.creado_por || "Desconocido"}</td>
                <td>{f.numero_interno}</td>
                <td>{f.fecha_inspeccion}</td>
                <td>{f.hora_inspeccion}</td>
                <td><span className="badge bg-warning">{contarHallazgos(f.checklist)}</span></td>
                <td><span className="badge bg-warning text-dark">{f.estado}</span></td>
                {role === "admin" && (
                  <td>
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleAprobar(f.id)}>Aprobar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRechazar(f.id)}>Rechazar</button>
                  </td>
                )}


                <td>
                  <Link href={`/admin/solicitudes/${f.id}`} className="btn btn-primary btn-sm me-2">Ver Detalles</Link>
                  {/* <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPDF(f)}>Descargar PDF</button> */}
                </td>
              </tr>
            ))}
            {formularios.filter(filtrar).length === 0 && (
              <tr><td colSpan={9} className="text-center">No hay resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
