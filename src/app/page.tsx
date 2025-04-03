import { redirect } from "next/navigation";

// src/app/page.tsx
export default function Home() {
  redirect("/checklist");
  return (
    <main className="container py-5">
      <h1 className="mb-4">Checklist App 🚀</h1>
      <p>¡Bootstrap y Next.js listos!</p>
    </main>
  );
}

