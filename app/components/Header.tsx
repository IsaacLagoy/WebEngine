"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <nav className="flex items-center justify-center gap-6">
        <Link
          href="/"
          className={`px-4 py-2 rounded-lg transition-all ${
            pathname === "/"
              ? "text-white font-semibold"
              : "text-white/70 hover:text-white"
          }`}
        >
          Home
        </Link>
        <Link
          href="/about"
          className={`px-4 py-2 rounded-lg transition-all ${
            pathname === "/about"
              ? "text-white font-semibold"
              : "text-white/70 hover:text-white"
          }`}
        >
          About
        </Link>
        <Link
          href="/dnd"
          className={`px-4 py-2 rounded-lg transition-all ${
            pathname === "/dnd"
              ? "text-white font-semibold"
              : "text-white/70 hover:text-white"
          }`}
        >
          D&D
        </Link>
      </nav>
    </header>
  );
}
