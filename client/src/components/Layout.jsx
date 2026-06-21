import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="grain flex min-h-[100dvh] flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-6">
        <Outlet />
      </main>
      <footer className="mt-10 border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-ink-muted sm:flex-row sm:px-6">
          <span className="font-serif text-lg tracking-tight text-ink">
            Essence<span className="text-gold">.</span>
          </span>
          <span>Curated luxury fragrances · EONIS 2026</span>
          <div className="flex gap-5">
            <a href="#" className="transition hover:text-ink">
              Privacy
            </a>
            <a href="#" className="transition hover:text-ink">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
