"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import VehicleInfo from "./components/VehicleInfo";
import ChecklistSection from "./components/ChecklistSection";
import axios from "axios";
import { runTransaction, doc } from "firebase/firestore";
import DamageDrawing from "./components/DamageDrawing";
import { auth } from "@/firebase";
import { getDoc } from "firebase/firestore";
import { secciones } from "@/constants/checklist";
import FirmaCanvas from "@/components/FirmaCanvas";
import imageCompression from "browser-image-compression";


const obtenerIdCorrelativo = async (tipo: "checklist" | "fatiga") => {
  const contadorRef = doc(db, "contadores", tipo);
  const nuevoId = await runTransaction(db, async transaction => {
    const contadorDoc = await transaction.get(contadorRef);
    if (!contadorDoc.exists()) throw "El documento de contador no existe.";

    const ultimo = contadorDoc.data().ultimo_id || 0;
    const siguiente = ultimo + 1;

    transaction.update(contadorRef, { ultimo_id: siguiente });

    return siguiente;
  });

  return nuevoId;
};
export interface FormData {
  fecha_inspeccion: string;
  hora_inspeccion: string;
  conductor: string;
  numero_interno: string;
  kilometraje: string;
  vehiculo: {
    marca: string;
    modelo: string;
    patente: string;
    ano: string;
    color: string;
    
  };
  checklist: { [key: string]: string };
  observaciones: string;
}

export default function PageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    fecha_inspeccion: "",
    hora_inspeccion: "",
    conductor: "",
    numero_interno: "",
     kilometraje: "",
    vehiculo: { marca: "", modelo: "", patente: "", ano: "", color: "" },
    checklist: {},
    observaciones: "",
  });
  const [firmaImg, setFirmaImg] = useState<string | null>(null);
  const [firmaKey, setFirmaKey] = useState(0); // 👈 fuerza reinicio del canvas

  const [conductores, setConductores] = useState<string[]>([]);
  const [numerosInternos, setNumerosInternos] = useState<string[]>([]);
  const [imagenes, setImagenes] = useState<{ [key: string]: File | null }>({});

  const [controladorNombre, setControladorNombre] = useState<string | null>(null);

  useEffect(() => {
    const cargarConductores = async () => {
      const snapshot = await getDocs(collection(db, "conductores"));
      setConductores(snapshot.docs.map(doc => doc.data().nombre));
    };

    const cargarNumerosInternos = async () => {
      const snapshot = await getDocs(collection(db, "vehiculos"));
      setNumerosInternos(snapshot.docs.map(doc => doc.data().numero_interno));
    };

    cargarConductores();
    cargarNumerosInternos();
  }, []);
  useEffect(() => {
    const fetchControlador = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(docRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setControladorNombre(data.nombre); // Suponiendo que en Firestore se guarda el nombre
        }
      }
    };
  
    fetchControlador();
  }, []);
  const [dibujoKey, setDibujoKey] = useState(0);

  const cargarDatosVehiculo = async (numeroInterno: string) => {
    const snapshot = await getDocs(collection(db, "vehiculos"));
    const vehiculo = snapshot.docs.find(doc => doc.data().numero_interno === numeroInterno)?.data();

    if (vehiculo) {
      setForm(prevForm => ({
        ...prevForm,
        numero_interno: numeroInterno,
        vehiculo: {
          marca: vehiculo.marca || "",
          modelo: vehiculo.modelo || "",
          patente: vehiculo.patente || "",
          ano: vehiculo.ano || "",
          color: vehiculo.color || "",
          
          
        },
        kilometraje: "",
      }));
    }
  };
  const [imagenDibujo, setImagenDibujo] = useState<string | null>(null);
  
  const comprimirImagen = async (archivo: Blob | File): Promise<File> => {
    const file =
      archivo instanceof File
        ? archivo
        : new File([archivo], "temp.png", { type: archivo.type });
  
    const opciones = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
  
    return await imageCompression(file, opciones);
  };
  
  /** ✅ Función para manejar el envío del formulario a Firebase */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    try {
      // ✅ Validar que se completaron todos los ítems del checklist
      const totalEsperado = Object.values(secciones).flat().length;
      const totalCompletado = Object.keys(form.checklist).length;
      const opcionesValidas = ["B", "M", "NA"];
      const tieneRespuestasInvalidas = Object.values(form.checklist).some(
        val => !opcionesValidas.includes(val)
      );
  
      if (totalCompletado !== totalEsperado || tieneRespuestasInvalidas) {
        alert("❌ Debes responder todos los ítems del checklist antes de enviar.");
        setIsSubmitting(false);
        return;
      }
  
      if (!firmaImg) {
        alert("❌ Debes firmar antes de enviar el formulario.");
        setIsSubmitting(false);
        return;
      }
  
      // ✅ Subir imágenes del checklist
      const uploadedImages: { [key: string]: string } = {};
      for (const item in imagenes) {
        if (imagenes[item]) {
          const imagenOriginal = imagenes[item]!;
          console.log(`📸 Imagen "${item}" original:`, imagenOriginal.size, "bytes");
  
          const imagenComprimida = await comprimirImagen(imagenOriginal);
          console.log(`📉 Imagen "${item}" comprimida:`, imagenComprimida.size, "bytes");
  
          const formData = new FormData();
          formData.append("file", imagenComprimida);
          formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  
          const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData
          );
          uploadedImages[`${item}_img`] = response.data.secure_url;
        }
      }
  
      // ✅ Procesar imagen del dibujo (con o sin rayones)
      if (imagenDibujo) {
        const dibujoBlob = await fetch(imagenDibujo).then(res => res.blob());
        const dibujoComprimido = await comprimirImagen(dibujoBlob);
        console.log("🚌 Dibujo original:", dibujoBlob.size, "bytes");
        console.log("📉 Dibujo comprimido:", dibujoComprimido.size, "bytes");
  
        const dibujoForm = new FormData();
        dibujoForm.append("file", dibujoComprimido);
        dibujoForm.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  
        const dibujoRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          dibujoForm
        );
  
        uploadedImages["danios_img"] = dibujoRes.data.secure_url;
      }
  
      // ✅ Subir firma
      const firmaBlob = await fetch(firmaImg).then(res => res.blob());
      const firmaComprimida = await comprimirImagen(firmaBlob);
      console.log("✍️ Firma original:", firmaBlob.size, "bytes");
      console.log("📉 Firma comprimida:", firmaComprimida.size, "bytes");
  
      const firmaForm = new FormData();
      firmaForm.append("file", firmaComprimida);
      firmaForm.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  
      const firmaRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        firmaForm
      );
      uploadedImages["firma_img"] = firmaRes.data.secure_url;
  
      // ✅ Guardar formulario en Firestore
      const itemsCriticos: string[] = []; // define tus ítems críticos aquí si corresponde
      const hayCriticoMalo = itemsCriticos.some(item => form.checklist[item] === "M");
      const idCorrelativo = await obtenerIdCorrelativo("checklist");
      
      await addDoc(collection(db, "formularios"), {
        ...form,
        id_correlativo: idCorrelativo,
        checklist: { ...form.checklist, ...uploadedImages },
        fecha_creacion: new Date(),
        estado: hayCriticoMalo ? "rechazado" : "pendiente",
        aprobado_por: hayCriticoMalo ? "Autorechazo" : null,
        creado_por: controladorNombre || "Desconocido",
      });
  
      alert(
        hayCriticoMalo
          ? "❌ Formulario enviado pero fue rechazado automáticamente por ítems críticos."
          : "✅ Formulario enviado exitosamente"
      );
  
      // ✅ Limpiar el formulario
      setForm({
        fecha_inspeccion: "",
        hora_inspeccion: "",
        conductor: "",
        numero_interno: "",
        kilometraje: "",
        vehiculo: { marca: "", modelo: "", patente: "", ano: "", color: "" },
        checklist: {},
        observaciones: "",
      });
      setImagenDibujo(null);
      setImagenes({});
      setFirmaImg(null);
      setFirmaKey(prev => prev + 1); // reiniciar canvas de firma
      setDibujoKey(prev => prev + 1); // 🔄 reinicia canvas
    } catch (error) {
      console.error("❌ Error al enviar el formulario:", error);
      alert("❌ Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <main className="container py-4">
      
      
      <div className="card">
        <div className="card-header bg-primary text-white text-center">
        <h2>Checklist Pre Uso Buses 🚌</h2>
        </div>
        <div className="card-body">
        <form onSubmit={handleSubmit} method="POST">
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">Información del Vehículo y Conductor</div>
          <div className="card-body row">
            <div className="col-md-3 mb-3">
              <label>Fecha de Inspección</label>
              <input
                required type="date" className="form-control" value={form.fecha_inspeccion} 
                onChange={(e) => setForm({ ...form, fecha_inspeccion: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label>Hora de Inspección</label>
              <input
                required type="time" className="form-control" value={form.hora_inspeccion}
                onChange={(e) => setForm({ ...form, hora_inspeccion: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label>Conductor</label>
              <select
                required className="form-control"
                value={form.conductor}
                onChange={(e) => setForm({ ...form, conductor: e.target.value })}
              >
                <option value="">Seleccione un conductor</option>
                {conductores.map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label>Número Interno</label>
              <select
                required className="form-control"
                value={form.numero_interno}
                onChange={(e) => cargarDatosVehiculo(e.target.value)}
              >
                <option value="">Seleccione un número interno</option>
                {numerosInternos.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
            
  <label>Kilometraje</label>
  <input
    required
    type="number"
    value={form.kilometraje} 
    className="form-control"
    onChange={(e) =>
      setForm({
        ...form,
         kilometraje: e.target.value 
      })}
    
  />
</div>
          </div>
          <VehicleInfo vehiculo={form.vehiculo} />
        </div>

        {/* Sección de Checklist */}
        <ChecklistSection form={form} setForm={setForm} setImages={setImagenes} />

        <h5 className="mt-4">Observaciones de Choques y/o Rayaduras</h5>
        <DamageDrawing
  onSave={(dataUrl) => setImagenDibujo(dataUrl)}
  resetKey={dibujoKey}
  clearPreview={imagenDibujo === null} // 👈 limpia la vista previa
/>


        {/* Observaciones */}
        <div className="mb-3">
          <label>Observaciones</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          />
        </div>
        <h5 className="mt-4">Firma del responsable</h5>
        <FirmaCanvas key={firmaKey} onSave={(dataUrl) => setFirmaImg(dataUrl)} />


        {/* Botón de Enviar */}
        <div className="text-center mt-3">
        <button type="submit" className="btn btn-success" disabled={isSubmitting}>
  {isSubmitting ? "Enviando..." : "Enviar"}
</button>
        </div>
      </form>
        </div>
      </div>
    </main>
  );
}
