import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink/10 py-6 text-center text-sm text-ink/50">
        Essence Parfumerija — EONIS 2026 project
      </footer>
    </div>
  );
}
