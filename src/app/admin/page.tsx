"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";
import { signOut, User } from "firebase/auth"; // 🔹 Importamos User
import { doc, getDoc } from "firebase/firestore";

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null); // ✅ Ahora usamos User en lugar de any
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        // Verificar si el usuario es admin en Firestore
        const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          alert("Acceso denegado. No eres administrador.");
          router.push("/"); // Redirigir a otra página si no es admin
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return <p className="text-center">Cargando...</p>;
  if (!isAdmin) return <p className="text-center text-danger">Acceso denegado ❌</p>;

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
