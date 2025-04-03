"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  role: string;
}

export default function PageContent() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  useEffect(() => {
    const fetchUsuarios = async () => {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const data = snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Usuario, "id">), // evitamos conflicto con el id
        id: doc.id, // lo agregamos al final
      }));
      setUsuarios(data);
    };
  
    fetchUsuarios();
  }, []);
  

  return (
    <div className="container py-4">
      <h2 className="text-center">Usuarios Registrados 👥</h2>
      <div className="table-responsive mt-4">
        <table className="table table-striped">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(user => (
              <tr key={user.id}>
                <td>{user.nombre || "Sin nombre"}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge bg-info text-dark">{user.role}</span>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={3} className="text-center">No hay usuarios registrados</td></tr>
            )}
          </tbody>
        </table>
        <div className="text-end mt-3">
  <a href="/admin-register" className="btn btn-primary">Registrar Nuevo Usuario</a>
</div>

      </div>
    </div>
  );
}
