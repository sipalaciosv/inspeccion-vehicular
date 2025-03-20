"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = useMemo(() => pathname?.startsWith("/admin") ?? false, [pathname]);

  useEffect(() => {
    // @ts-expect-error: Bootstrap no tiene declaración de tipos en TypeScript
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then(() => console.log("✅ Bootstrap JS cargado correctamente"))
      .catch(err => console.error("❌ Error al cargar Bootstrap JS:", err));
  }, []);

  return (
    <>
      {isAdminRoute ? <AdminNavbar /> : <Navbar />}
      <main className="container mt-4">{children}</main>
    </>
  );
}
