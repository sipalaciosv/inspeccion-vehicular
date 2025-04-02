"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { useRouter } from "next/navigation";
import { signOut, User } from "firebase/auth";
import withRoleProtection from "../../components/withRoleProtection";

function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return <p className="text-center">Cargando...</p>;

  return (
    <div className="container py-5">
      <h2 className="text-center">Panel de Administración 🛠️</h2>
      <div className="text-center mt-4">
        <p>Bienvenido, {user.email}</p>
        <button onClick={handleLogout} className="btn btn-danger">Cerrar Sesión</button>
      </div>
    </div>
  );
}

export default withRoleProtection(AdminPanel, ["admin", "controlador"]);
