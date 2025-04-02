"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function withRoleProtection(Component: any, allowedRoles: string[]) {
  return function ProtectedComponent(props: any) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          const role = userDoc.exists() ? userDoc.data().role : null;

          if (allowedRoles.includes(role)) {
            setIsAuthorized(true);
          } else {
            router.push("/unauthorized"); // redirige si no tiene permiso
          }
        } else {
          router.push("/login"); // redirige si no está logeado
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, []);

    if (loading) return <div className="text-center mt-10">Cargando...</div>;
    if (!isAuthorized) return null;

    return <Component {...props} />;
  };
}
