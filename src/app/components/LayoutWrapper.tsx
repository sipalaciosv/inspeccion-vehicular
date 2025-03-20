"use client";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = useMemo(() => pathname.startsWith("/admin"), [pathname]);

  useEffect(() => {
    // Cargar Bootstrap JS de manera dinámica
    if (typeof window !== "undefined") {
      require("bootstrap/dist/js/bootstrap.bundle.min.js");
    }
  }, []);

  return (
    <>
      {isAdminRoute ? <AdminNavbar /> : <Navbar />}
      <main className="container mt-4">{children}</main>
    </>
  );
}
