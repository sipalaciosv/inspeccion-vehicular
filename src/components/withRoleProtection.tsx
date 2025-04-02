"use client";

import { useEffect, useState, ComponentType } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function withRoleProtection<T extends object>(
  Component: ComponentType<T>,
  allowedRoles: string[]
) {
  return function ProtectedComponent(props: T) {
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
            router.push("/unauthorized");
          }
        } else {
          router.push("/login");
        }

        setLoading(false);
      });

      return () => unsubscribe();
    }, [router]); // ✅ Agregamos router como dependencia

    if (loading) return <div className="text-center mt-10">Cargando...</div>;
    if (!isAuthorized) return null;

    return <Component {...props} />;
  };
}
