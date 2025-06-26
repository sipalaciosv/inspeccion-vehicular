"use client";

import "./navbar.css"; // <-- Agrega esto si tienes navbar.css en la misma carpeta
import useUserRole from "@/hooks/useUserRole";
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { role, loading } = useUserRole();
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

  if (loading) return null;

  return (
    <>
      {/* Banner de advertencia con logo Google */}
      <div className="storage-warning">
        <span
          className="storage-warning-text"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" href="/admin">
            ⚙️ Admin Panel
          </Link>
          <button className="navbar-toggler" type="button" onClick={() => setIsOpen(!isOpen)}>
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto">
              {/* Checklist Dropdown */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="checklistDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Checklist
                </a>
                <ul className="dropdown-menu" aria-labelledby="checklistDropdown">
                  <li>
                    <Link className="dropdown-item" href="/admin/solicitudes/pendientes">
                      Pendientes
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/solicitudes/atendidos">
                      Atendidos
                    </Link>
                  </li>
                </ul>
              </li>

              {/* ✅ NUEVO: Fatiga Dropdown */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="fatigaDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Fatiga
                </a>
                <ul className="dropdown-menu" aria-labelledby="fatigaDropdown">
                  <li>
                    <Link className="dropdown-item" href="/admin/solicitudes-fatiga/pendientes">
                      Pendientes
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/solicitudes-fatiga/atendidos">
                      Atendidos
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Consolidado de Buses */}
              <li className="nav-item">
                <Link className="nav-link" href="/admin/consolidado-buses">
                  📋 Consolidado Buses
                </Link>
              </li>

              {/* Gestión (solo admin) */}
              {role === "admin" && (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="gestionDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Gestión
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="gestionDropdown">
                    <li>
                      <Link className="dropdown-item" href="/admin/gestion/vehiculos">
                        Vehículos
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/admin/gestion/conductores">
                        Conductores
                      </Link>
                    </li>
                  </ul>
                </li>
              )}

              {/* Usuarios (solo admin) */}
              {role === "admin" && (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="usuariosDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Usuarios
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="usuariosDropdown">
                    <li>
                      <Link className="dropdown-item" href="/admin/usuarios/admins">
                        Administradores
                      </Link>
                    </li>
                  </ul>
                </li>
              )}

              {/* 🌐 Panel Público */}
              <li className="nav-item">
                <Link className="nav-link" href="/checklist">
                  🌐 Panel Público
                </Link>
              </li>

              {/* 🔒 Logout */}
              <li className="nav-item">
                <button className="btn btn-danger ms-3" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
