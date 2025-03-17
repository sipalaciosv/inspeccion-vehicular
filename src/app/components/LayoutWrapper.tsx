"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {isAdminRoute ? <AdminNavbar /> : <Navbar />}
      <main className="container mt-4">{children}</main>
    </>
  );
}
