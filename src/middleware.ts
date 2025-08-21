// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Activa mantenimiento si la variable está en "1", "true" o "on"
  const MAINT = (process.env.NEXT_PUBLIC_MAINTENANCE || "").toLowerCase();
  const maintenanceOn = ["1", "true", "on", "yes"].includes(MAINT);

  if (!maintenanceOn) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // ✅ NO interceptar assets críticos ni la propia página de mantenimiento
  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/maintenance.html" ||
    /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|txt|json|map)$/i.test(pathname);

  if (isAsset) return NextResponse.next();

  // 🔒 Si quieres permitir bypass para admins, descomenta y usa cookie "maint_bypass=1"
  // if (req.cookies.get("maint_bypass")?.value === "1") return NextResponse.next();

  // Reescribe TODAS las rutas a la página de mantenimiento
  const url = req.nextUrl.clone();
  url.pathname = "/maintenance.html";
  return NextResponse.rewrite(url);
}

// Aplica a todo
export const config = {
  matcher: "/:path*",
};