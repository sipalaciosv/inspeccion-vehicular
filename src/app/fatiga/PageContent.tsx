"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, runTransaction, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import FirmaCanvas from "@/components/FirmaCanvas";
import useUserRole from "@/hooks/useUserRole";

interface FormularioFatiga {
  conductor: string;
  tipo_vehiculo: string;
  numero_interno: string;
  destino: string;
  hora_salida: string;
  fecha: string;
  respuestas: Record<number, string>;
  observaciones: Record<number, string>;
}

const obtenerIdCorrelativo = async (tipo: "checklist" | "fatiga") => {
  const contadorRef = doc(db, "contadores", tipo);
  return await runTransaction(db, async transaction => {
    const contadorDoc = await transaction.get(contadorRef);
    if (!contadorDoc.exists()) throw "El documento de contador no existe.";

    const ultimo = contadorDoc.data().ultimo_id || 0;
    const siguiente = ultimo + 1;
    transaction.update(contadorRef, { ultimo_id: siguiente });
    return siguiente;
  });
};

export default function PageContent() {
  const [form, setForm] = useState<FormularioFatiga>({
    conductor: "",
    tipo_vehiculo: "BUS",
    numero_interno: "",
    destino: "",
    hora_salida: "",
    fecha: "",
    respuestas: {},
    observaciones: {},
  });
  const { role } = useUserRole();

  const [conductores, setConductores] = useState<string[]>([]);
  const [vehiculos, setVehiculos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firmaImg, setFirmaImg] = useState<string | null>(null);
  const [firmaKey, setFirmaKey] = useState(0); // 👈 nuevo estado

  useEffect(() => {
    const fetchData = async () => {
      const snapshotConductores = await getDocs(collection(db, "conductores"));
      setConductores(snapshotConductores.docs.map(doc => doc.data().nombre).sort((a, b) => a.localeCompare(b)))
      ;

      const snapshotVehiculos = await getDocs(collection(db, "vehiculos"));
const numerosOrdenados = snapshotVehiculos.docs
  .map(doc => doc.data().numero_interno)
  .filter(num => num !== undefined)
  .sort((a, b) => Number(a) - Number(b)); // ← ordena numéricamente

setVehiculos(numerosOrdenados);

    };
    fetchData();
  }, []);
  useEffect(() => {
    if (role !== "admin") {
      const ahora = new Date();
      const fecha = ahora.toLocaleDateString("en-CA"); // ✅ "YYYY-MM-DD"
      const hora = ahora.toTimeString().slice(0, 5);   // ✅ "HH:MM"
  
      setForm(prev => ({
        ...prev,
        fecha,
        hora_salida: hora,
      }));
    }
  }, [role]);
  
  
  const preguntas = [
    "¿Ha dormido lo suficiente para afirmar que se encuentra apto para cumplir sus funciones y sin cansancio?",
    "¿Se encuentra sin problemas de salud (física), para la correcta realización del trabajo?",
    "¿Se encuentra emocionalmente bien para ejecutar de buena forma su trabajo?",
    "¿Se encuentra en óptimas condiciones sin consumo o influencia del alcohol?",
    "¿Se encuentra en condiciones sin consumo o influencia de drogas ilícitas?",
    "¿Me encuentro tomando medicamentos que me impidan operar y/o alteren mi concentración? ¿Los declaré?",
    "¿Se encuentra libre de consumo de medicamentos que puedan afectar su capacidad mental y/o física para conducir?",
    "¿Ha consultado algún centro de asistencia de salud por alguna molestia que le dificulte la conducción?",
    "¿Me siento enfermo o fatigado?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRespuesta = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      respuestas: { ...prev.respuestas, [index]: value },
    }));
  };

  const handleObservacion = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      observaciones: { ...prev.observaciones, [index]: value },
    }));
  };
  function contarErrores(respuestas: Record<number, string>): number {
    let errores = 0;
    const negativasEsperadas = [5, 7, 8];
  
    for (const [indexStr, respuesta] of Object.entries(respuestas)) {
      const index = Number(indexStr);
      const esperaNo = negativasEsperadas.includes(index);
  
      if (esperaNo && respuesta !== "NO") {
        errores++;
      } else if (!esperaNo && respuesta !== "SI") {
        errores++;
      }
    }
  
    return errores;
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!firmaImg) {
      alert("⚠️ Debes firmar antes de enviar el formulario.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const idCorrelativo = await obtenerIdCorrelativo("fatiga");

      const auth = getAuth();
      const user = auth.currentUser;
      let creadoPorNombre = "Desconocido";

      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          creadoPorNombre = userDoc.data().nombre || user.email;
        }
      }
      let firmaUrl = null;

if (firmaImg) {
  const firmaForm = new FormData();
  const firmaBlob = await fetch(firmaImg).then(res => res.blob());
  firmaForm.append("file", firmaBlob);
  firmaForm.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

  const firmaRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: firmaForm
    }
  );

  const firmaData = await firmaRes.json();
  firmaUrl = firmaData.secure_url;
}
const errores = contarErrores(form.respuestas);
      await addDoc(collection(db, "fatiga_somnolencia"), {
        ...form,
        id_correlativo: idCorrelativo,
        estado: "pendiente",
        creado_por: creadoPorNombre,
        firma_img: firmaUrl,
        errores, 
      });

      alert("✅ Formulario enviado exitosamente");

      setForm({
        conductor: "",
        tipo_vehiculo: "BUS",
        numero_interno: "",
        destino: "",
        hora_salida: "",
        fecha: "",
        respuestas: {},
        observaciones: {},
        
      });
      setFirmaImg(null);
      setFirmaKey(prev => prev + 1); // 🔄 fuerza a reiniciar FirmaCanvas

    } catch (error) {
      console.error(error);
      alert("❌ Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container py-4">
      <div className="card">
        <div className="card-header bg-primary text-white text-center">
          <h2 className="mb-0">Control de Fatiga y Somnolencia 🚛</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Datos del Conductor */}
            <div className="mb-4">
  <h5>Datos del Conductor</h5>
  <div className="row">
    <div className="col-md-6 mb-3">
      <label>Conductor</label>
      <select
        className="form-control"
        name="conductor"
        value={form.conductor}
        onChange={handleChange}
        required
      >
        <option value="">Seleccione un Conductor</option>
        {conductores.map((nombre) => (
          <option key={nombre} value={nombre}>{nombre}</option>
        ))}
      </select>
    </div>

    <div className="col-md-6 mb-3">
      <label>Tipo de Vehículo</label>
      <input
        className="form-control"
        name="tipo_vehiculo"
        value={form.tipo_vehiculo}
        readOnly
      />
    </div>

    <div className="col-md-6 mb-3">
      <label>Número Interno</label>
      <select
        className="form-control"
        name="numero_interno"
        value={form.numero_interno}
        onChange={handleChange}
        required
      >
        <option value="">Seleccione un Vehículo</option>
        {vehiculos.map((num) => (
          <option key={num} value={num}>{num}</option>
        ))}
      </select>
    </div>

    <div className="col-md-6 mb-3">
      <label>Destino</label>
      <select
        className="form-control"
        name="destino"
        value={form.destino}
        onChange={handleChange}
        required
      >
        <option value="">Seleccione Destino de Tránsito</option>
        <option value="Iquique">Iquique</option>
        <option value="Arica">Arica</option>
        <option value="Antofagasta">Antofagasta</option>
        <option value="Calama">Calama</option>
      </select>
    </div>

    <div className="col-md-6 mb-3">
      <label>Hora de Salida</label>
      <input
        className="form-control"
        type="time"
        name="hora_salida"
        value={form.hora_salida}
        onChange={handleChange}
        required
        disabled={role !== "admin"}
      />
    </div>

    <div className="col-md-6 mb-3">
      <label>Fecha</label>
      <input
        className="form-control"
        type="date"
        name="fecha"
        value={form.fecha}
        onChange={handleChange}
        required
        disabled={role !== "admin"}
      />
    </div>
  </div>
</div>


            {/* Cuestionario */}
            <div className="mb-4">
              <h5>Cuestionario</h5>
              {preguntas.map((pregunta, index) => (
                <div key={index} className="mb-3">
                  <p>{index + 1}. {pregunta}</p>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`respuesta_${index}`}
                      value="SI"
                      onChange={() => handleRespuesta(index, "SI")}
                      required
                    />
                    <label className="form-check-label">Sí</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`respuesta_${index}`}
                      value="NO"
                      onChange={() => handleRespuesta(index, "NO")}
                      required
                    />
                    <label className="form-check-label">No</label>
                  </div>
                  <input
                    className="form-control mt-2"
                    placeholder="Observaciones"
                    onChange={(e) => handleObservacion(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Leyenda final */}
            <p className="text-muted text-center fst-italic">
              Afirmo que lo registrado en este formato es conforme a lo verificado en la fecha y hora
            </p>
            <h5 className="mt-4">Firma del Conductor</h5>
            <FirmaCanvas key={firmaKey} onSave={(dataUrl) => setFirmaImg(dataUrl)} />


            <div className="text-center mt-3">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
