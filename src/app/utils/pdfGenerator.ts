'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ChecklistPDFData {
  conductor: string;
  numero_interno: string;
  fecha_inspeccion: string;
  hora_inspeccion: string;
  observaciones: string;
  checklist: { [key: string]: string };
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
interface jsPDFWithPlugin extends jsPDF {
    previousAutoTable?: {
      finalY?: number;
    };
  }
  
export const generarPDF = (data: ChecklistPDFData) => {
    const doc = new jsPDF() as jsPDFWithPlugin;


  doc.setFontSize(16);
  doc.text("Reporte de Inspección", 14, 20);
  doc.setFontSize(12);
  doc.text(`Conductor: ${data.conductor}`, 14, 30);
  doc.text(`Número Interno: ${data.numero_interno}`, 14, 40);
  doc.text(`Fecha: ${data.fecha_inspeccion}`, 14, 50);
  doc.text(`Hora: ${data.hora_inspeccion}`, 14, 60);
  doc.text("Observaciones:", 14, 70);
  doc.text(data.observaciones || "Ninguna", 14, 80);

  doc.text("Información del Vehículo:", 14, 90);
  doc.text(`Marca: ${data.vehiculo.marca}`, 14, 100);
  doc.text(`Modelo: ${data.vehiculo.modelo}`, 14, 110);
  doc.text(`Patente: ${data.vehiculo.patente}`, 14, 120);
  doc.text(`Año: ${data.vehiculo.ano}`, 14, 130);
  doc.text(`Color: ${data.vehiculo.color}`, 14, 140);
  doc.text(`Kms Iniciales: ${data.vehiculo.kms_inicial}`, 14, 150);
  doc.text(`Kms Finales: ${data.vehiculo.kms_final}`, 14, 160);

  autoTable(doc, {
    startY: 170,
    head: [["Ítem", "Estado"]],
    body: Object.entries(data.checklist)
      .filter(([_, val]) => val !== null && val !== undefined)
      .map(([key, val]) => [key, val]),
  });

  let yPosition = doc.previousAutoTable.finalY + 10;

  Object.entries(data.checklist).forEach(([item, value]) => {
    if (value.startsWith("https://")) {
      if (yPosition + 50 > doc.internal.pageSize.height) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`Imagen: ${item}`, 14, yPosition);
      doc.addImage(value, "JPEG", 14, yPosition + 5, 60, 40);
      yPosition += 50;
    }
  });

  doc.save(`reporte_${data.conductor}_${data.fecha_inspeccion}.pdf`);
};
