"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./auth/AuthButton";

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={`px-2 sm:px-3 md:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
        pathname === href
          ? "text-white font-semibold"
          : "text-white/70 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <nav
          className="
            flex items-center gap-1 sm:gap-3 md:gap-6
            justify-center
          "
        >
          <HeaderLink href="/">Home</HeaderLink>
          <HeaderLink href="/projects">Projects</HeaderLink>
          <HeaderLink href="/experience">Experience</HeaderLink>
          <HeaderLink href="/games">Games</HeaderLink>
          {/* <HeaderLink href="/dnd">D&amp;D</HeaderLink> */}
          <AuthButton />
        </nav>
    </header>
  );
}