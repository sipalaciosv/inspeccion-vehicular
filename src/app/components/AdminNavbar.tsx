"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" href="/admin">⚙️ Admin Panel</Link>
        <button className="navbar-toggler" type="button" onClick={() => setIsOpen(!isOpen)}>
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto">

            {/* Checklist Dropdown */}
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="checklistDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Checklist
              </a>
              <ul className="dropdown-menu" aria-labelledby="checklistDropdown">
                <li><Link className="dropdown-item" href="/admin/solicitudes/pendientes">Pendientes</Link></li>
                <li><Link className="dropdown-item" href="/admin/solicitudes/atendidos">Atendidos</Link></li>
              </ul>
            </li>

            {/* Gestión Dropdown */}
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="gestionDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Gestión
              </a>
              <ul className="dropdown-menu" aria-labelledby="gestionDropdown">
                <li><Link className="dropdown-item" href="/admin/gestion/vehiculos">Vehículos</Link></li>
                <li><Link className="dropdown-item" href="/admin/gestion/conductores">Conductores</Link></li>
              </ul>
            </li>

            {/* Usuarios Dropdown */}
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="usuariosDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Usuarios
              </a>
              <ul className="dropdown-menu" aria-labelledby="usuariosDropdown">
                <li><Link className="dropdown-item" href="/admin/usuarios/admins">Administradores</Link></li>
              </ul>
            </li>

            {/* 🌐 Panel Público */}
            <li className="nav-item">
              <Link className="nav-link" href="/checklist">🌐 Panel Público</Link>
            </li>

            {/* Cerrar Sesión */}
            <li className="nav-item">
              <button className="btn btn-danger ms-3" onClick={handleLogout}>Cerrar Sesión</button>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}
