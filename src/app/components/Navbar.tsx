"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import "./navbar.css";
export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <>
      <div className="storage-warning">
  <span className="storage-warning-text" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
    <svg width="22" height="22" viewBox="0 0 48 48" style={{ verticalAlign: "middle" }}>
      <g>
        <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.5 33.6 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.1.9 7.1 2.4l6.4-6.4C33.3 5.2 28.9 3.5 24 3.5 12.8 3.5 3.5 12.8 3.5 24S12.8 44.5 24 44.5c11.3 0 20.5-8.7 20.5-20.5 0-1.4-.1-2.7-.3-4z"></path>
        <path fill="#34A853" d="M6.3 14.7l7 5.1C15.6 16.1 19.5 13.5 24 13.5c2.7 0 5.1.9 7.1 2.4l6.4-6.4C33.3 5.2 28.9 3.5 24 3.5 16.5 3.5 9.7 8.4 6.3 14.7z"></path>
        <path fill="#FBBC05" d="M24 44.5c5.7 0 10.7-1.9 14.7-5.2l-6.8-5.6c-2 1.4-4.7 2.3-7.9 2.3-6.5 0-12-5.4-12-12H6.3C2.9 32.6 12.8 44.5 24 44.5z"></path>
        <path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.6 33.6 30 36 24 36c-2.6 0-5-.8-6.8-2.3l-7 5.1C11.8 40.1 17.4 44.5 24 44.5c6.3 0 11.7-2.2 15.6-6.1l-6.8-5.6c-2 1.4-4.7 2.3-7.9 2.3-6.5 0-12-5.4-12-12H6.3C2.9 32.6 12.8 44.5 24 44.5z"></path>
      </g>
    </svg>
    <strong>¡Atención!</strong> El espacio de almacenamiento está por agotarse.
  </span>
  <div className="storage-bar-bg">
    <div className="storage-bar-fill"></div>
  </div>
</div>


      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" href="/">🚌 Inspección Vehicular</Link>
          <button className="navbar-toggler" type="button" onClick={() => setIsOpen(!isOpen)}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" href="/checklist">Checklist Pre Uso</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/fatiga">Declaración de Fatiga</Link>
              </li>
              {user ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" href="/admin">Panel de Administración</Link>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <Link className="nav-link" href="/login">Iniciar Sesión</Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
