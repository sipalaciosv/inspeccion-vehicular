"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ Se ha enviado un correo para restablecer la contraseña.");
    } catch (error) {
      setMessage("❌ Error al enviar el correo. Verifica el email.");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center">Recuperar Contraseña 🔑</h2>
      <form onSubmit={handleResetPassword} className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
        {message && <div className="alert alert-info">{message}</div>}
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
        <button type="submit" className="btn btn-primary w-100">Enviar Instrucciones</button>
      </form>
    </div>
  );
}
