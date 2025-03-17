"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Solicitudes() {
  const [formularios, setFormularios] = useState<any[]>([]);

  useEffect(() => {
    const fetchFormularios = async () => {
      const snapshot = await getDocs(collection(db, "formularios"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  return (
    <div className="container py-5">
      <h2 className="text-center">Solicitudes Pendientes 📋</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {formularios.map(f => (
            <tr key={f.id}>
              <td>{f.conductor}</td>
              <td>{f.fecha_inspeccion}</td>
              <td><span className={`badge bg-${f.estado === "pendiente" ? "warning" : f.estado === "aprobado" ? "success" : "danger"}`}>{f.estado}</span></td>
              <td>
                {f.estado === "pendiente" && (
                  <>
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleAprobar(f.id)}>Aprobar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRechazar(f.id)}>Rechazar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
