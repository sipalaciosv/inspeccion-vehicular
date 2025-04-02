"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function PageContent() {
  const [secretKey, setSecretKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [role, setRole] = useState("admin"); // Valor por defecto


  const [error, setError] = useState(""); // ✅ Se usa correctamente
  const router = useRouter();

  const SECRET_PASSCODE = process.env.NEXT_PUBLIC_SECRET_PASSCODE;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // ✅ Limpiamos el error al iniciar

    if (secretKey !== SECRET_PASSCODE) {
      setError("❌ Clave secreta incorrecta");
      return;
    }

    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        email: user.email,
        role: role,
        nombre: nombre,
        
      });
      

      alert("✅ Administrador registrado con éxito");
      router.push("/admin");
    } catch (err) {
      setError("❌ Error al registrar administrador: " + (err as Error).message);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center">Registro de Usuarios 🔐</h2>
      <form onSubmit={handleRegister} className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
        {error && <div className="alert alert-danger">{error}</div>} {/* ✅ Muestra el error si existe */}
        <div className="mb-3">
          <label>Clave Secreta</label>
          <input
            type="password"
            className="form-control"
            required
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
        </div>
        <div className="mb-3">
  <label>Nombre</label>
  <input
    type="text"
    className="form-control"
    required
    value={nombre}
    onChange={(e) => setNombre(e.target.value)}
  />
</div>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
        <label>Rol</label>
        <select
          className="form-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="admin">Administrador</option>
          <option value="controlador">Controlador</option>
          <option value="chofer">Chofer</option>
        </select>
      </div>

        <button type="submit" className="btn btn-primary w-100">Registrar Usuario</button>
      </form>
    </div>
  );
}


