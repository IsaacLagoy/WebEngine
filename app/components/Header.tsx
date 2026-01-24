"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link href={href} className={`px-4 py-2 rounded-lg transition-all ${
      pathname === href
        ? "text-white font-semibold"
        : "text-white/70 hover:text-white"
  }`}>{children}</Link>
  );
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="flex justify-between">
        <div></div>
        <nav className="flex items-center justify-center gap-6">
          <HeaderLink href="/">Home</HeaderLink>
          <HeaderLink href="/projects">Projects</HeaderLink>
          <HeaderLink href="/experience">Experience</HeaderLink>
          <HeaderLink href="/dnd">D&D</HeaderLink>
        </nav>
        <AuthButton />
      </div>
    </header>
  );
}
