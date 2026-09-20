import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="leading-none">
          <span className="script-title block text-3xl text-foreground">Daffodils</span>
          <span className="label-caps block text-[0.6rem] text-muted-foreground">Nexus Hub</span>
        </Link>
        <nav className="label-caps flex items-center gap-6 text-xs">
          <Link to="/" className="transition-colors hover:text-primary">
            Blog
          </Link>
          <Link to="/admin" className="transition-colors hover:text-primary">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="script-title text-2xl">Grow. Inspire. Empower.</p>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Reflections on leadership, faith, wholeness, and purposeful living from Daffodils Nexus
          Hub.
        </p>
        <p className="label-caps mt-8 text-[0.65rem] text-muted-foreground">
          © 2026 Daffodils Nexus Hub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
