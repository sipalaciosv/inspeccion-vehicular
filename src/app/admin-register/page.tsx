"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function AdminRegister() {
  const [secretKey, setSecretKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const SECRET_PASSCODE = process.env.NEXT_PUBLIC_SECRET_PASSCODE;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Verifica si la clave secreta es correcta
    if (secretKey !== SECRET_PASSCODE) {
      setError("❌ Clave secreta incorrecta");
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar en Firestore como admin
      await setDoc(doc(db, "usuarios", user.uid), {
        email: user.email,
        role: "admin",
      });

      alert("✅ Administrador registrado con éxito");
      router.push("/admin"); // Redirigir al panel de administración
    } catch (error: any) {
      setError("❌ Error al registrar administrador");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center">Registro de Administrador 🔐</h2>
      <form onSubmit={handleRegister} className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
        {error && <div className="alert alert-danger">{error}</div>}

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

        <button type="submit" className="btn btn-primary w-100">Registrar Administrador</button>
      </form>
    </div>
  );
}
