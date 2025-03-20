"use client";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = useMemo(() => pathname.startsWith("/admin"), [pathname]);

  return (
    <>
      {isAdminRoute ? <AdminNavbar /> : <Navbar />}
      <main className="container mt-4">{children}</main>
    </>
  );
}
