"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, doc, getDocs, updateDoc, getDoc } from "firebase/firestore";
import Link from "next/link";
import useUserRole from "@/hooks/useUserRole";

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
  estado: "pendiente" | "aprobado" | "rechazado";
  creado_por?: string;
  aprobado_por?: string;
}

export default function PageContent() {
  const [formularios, setFormularios] = useState<FormularioFatiga[]>([]);
  const { role: userRole, loading } = useUserRole();
const [usuarioNombre, setUsuarioNombre] = useState("Desconocido");



useEffect(() => {
  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, "fatiga_somnolencia"));
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FormularioFatiga))
      .filter(f => f.estado === "pendiente")
      .sort((a, b) => b.id_correlativo - a.id_correlativo);
    setFormularios(data);
  };

  const obtenerNombreUsuario = async () => {
    const auth = await import("@/firebase").then(mod => mod.auth);
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUsuarioNombre(userData.nombre || user.email || "Desconocido");
      }
    }
  };

  fetchData();
  obtenerNombreUsuario();
}, []);


  const aprobarFormulario = async (formulario: FormularioFatiga) => {
    await updateDoc(doc(db, "fatiga_somnolencia", formulario.id), {
      estado: "aprobado",
      aprobado_por: usuarioNombre,
    });
    setFormularios(prev => prev.filter(f => f.id !== formulario.id));
  };

  const rechazarFormulario = async (formulario: FormularioFatiga) => {
    await updateDoc(doc(db, "fatiga_somnolencia", formulario.id), {
      estado: "rechazado",
      aprobado_por: usuarioNombre,
    });
    setFormularios(prev => prev.filter(f => f.id !== formulario.id));
  };

  return (
    <div className="container py-4">
      <h2 className="text-center">Formularios de Fatiga Pendientes ⏳</h2>
      

      <div className="table-responsive mt-3">
        <table className="table table-striped">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Conductor</th>
              <th>N° Vehículo</th>
              <th>Destino</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Realizado por</th>
              {(userRole === "admin" || userRole === "controlador") && <th>Acciones</th>}

              <th>Visualizar</th>
            </tr>
          </thead>
          <tbody>
            {formularios.map(f => (
              <tr key={f.id}>
                <td>{f.id_correlativo}</td>
                <td>{f.conductor}</td>
                <td>{f.numero_interno}</td>
                <td>{f.destino}</td>
                <td>{f.fecha}</td>
                <td>{f.hora_salida}</td>
                <td>{f.creado_por || "N/A"}</td>
                {(userRole === "admin" || userRole === "controlador") && (
                  <td>
                    <button className="btn btn-success btn-sm me-2" onClick={() => aprobarFormulario(f)}>Aprobar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => rechazarFormulario(f)}>Rechazar</button>
                  </td>
                )}
                <td>
                  <Link href={`/admin/solicitudes-fatiga/${f.id}`} className="btn btn-primary btn-sm">Ver Detalles</Link>
                </td>
              </tr>
            ))}
            {formularios.length === 0 && (
              <tr><td colSpan={userRole === "admin" ? 9 : 8} className="text-center">No hay formularios pendientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
