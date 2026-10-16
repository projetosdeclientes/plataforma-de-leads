"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Buscar Leads", icon: "🔎" },
  { href: "/crm", label: "Meu CRM", icon: "📋" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-lg">
            🎯
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Lead<span className="text-emerald-400">SemSite</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="mr-1.5">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
          <a
            href="/api/export"
            className="ml-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            ⬇️ CSV
          </a>
        </nav>
      </div>
    </header>
  );
}
