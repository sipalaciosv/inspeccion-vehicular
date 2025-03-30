"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function CrearUsuario() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456"); // Contraseña por defecto
  const [rol, setRol] = useState("chofer");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const correoGenerado = `${nombre.toLowerCase()}.${apellido.toLowerCase()}@empresa.com`;
    setEmail(correoGenerado);
  }, [nombre, apellido]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        email,
        nombre: `${nombre} ${apellido}`,
        role: rol,
      });

      alert("✅ Usuario registrado correctamente");
      router.push("/admin/usuarios");
    } catch (err) {
      setError("❌ Error al registrar usuario: " + (err as Error).message);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center">Crear Usuario</h2>
      <form onSubmit={handleRegister} className="card p-4 mx-auto" style={{ maxWidth: "500px" }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label>Nombre</label>
          <input type="text" className="form-control" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="mb-3">
          <label>Apellido</label>
          <input type="text" className="form-control" required value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>

        <div className="mb-3">
          <label>Correo electrónico</label>
          <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="mb-3">
          <label>Rol</label>
          <select className="form-control" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="chofer">Chofer</option>
            <option value="controlador">Controlador</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-100">Crear Usuario</button>
      </form>
    </div>
  );
}
