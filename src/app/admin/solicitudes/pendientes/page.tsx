"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export default function ChecklistPendientes() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [adminNombre, setAdminNombre] = useState<string | null>(null);


  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "formularios"));
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
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


const handleDownloadPDF = (form: Formulario) => {
  const doc = new jsPDF();

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

  doc.text("Información del Vehículo:", 14, 100);
  doc.text(`Marca: ${form.vehiculo.marca}`, 14, 110);
  doc.text(`Modelo: ${form.vehiculo.modelo}`, 14, 120);
  doc.text(`Patente: ${form.vehiculo.patente}`, 14, 130);
  doc.text(`Año: ${form.vehiculo.ano}`, 14, 140);
  doc.text(`Color: ${form.vehiculo.color}`, 14, 150);
  doc.text(`Kilómetros Iniciales: ${form.vehiculo.kms_inicial}`, 14, 160);
  doc.text(`Kilómetros Finales: ${form.vehiculo.kms_final}`, 14, 170);

  autoTable(doc, {
    startY: 180,
    head: [["Ítem", "Estado"]],
    body: Object.entries(form.checklist).map(([item, estado]) => [item, estado]),
  });

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
              <th>N° Vehículo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>No Conformidades</th>
              <th>Estado</th>
              <th>Acciones</th>
              <th>Visualizar</th>
            </tr>
          </thead>
          <tbody>
            {formularios.filter(filtrar).map(f => (
              <tr key={f.id}>
                <td>{f.id_correlativo}</td>
                <td>{f.conductor}</td>
                <td>{f.numero_interno}</td>
                <td>{f.fecha_inspeccion}</td>
                <td>{f.hora_inspeccion}</td>
                <td><span className="badge bg-warning">{contarHallazgos(f.checklist)}</span></td>
                <td><span className="badge bg-warning text-dark">{f.estado}</span></td>
                <td>
                  <button className="btn btn-success btn-sm me-2" onClick={() => handleAprobar(f.id)}>Aprobar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRechazar(f.id)}>Rechazar</button>
                </td>
                <td>
                  <Link href={`/admin/solicitudes/${f.id}`} className="btn btn-primary btn-sm me-2">Ver Detalles</Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPDF(f)}>Descargar PDF</button>
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
