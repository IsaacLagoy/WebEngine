"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBreadcrumbs, type Crumb } from "@/app/dnd/hooks/useBreadcrumbs";

export default function Breadcrumbs() {
  const crumbs = useBreadcrumbs();
  const searchParams = useSearchParams();
  const trail = searchParams.get("trail");

  const currentHref = crumbs[crumbs.length - 1]?.href;

  // Don't render on /dnd root or if there's nothing meaningful to show
  if (crumbs.length <= 1 || currentHref === "/dnd") return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-white/40 mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;

        if (isLast) {
          return (
            <span key={i} className="text-white/80 font-medium">
              {crumb.label}
            </span>
          );
        }

        // Pass trail forward so back-navigation works from deeper pages
        const href = trail
          ? `${crumb.href}?trail=${trail.split(",").slice(0, i - 1).join(",")}`
          : crumb.href;

        return (
          <span key={i} className="flex items-center gap-1">
            <Link
              href={i === 0 ? crumb.href : href}
              className="hover:text-white/70 transition-colors"
            >
              {crumb.label}
            </Link>
            <span className="text-white/20">/</span>
          </span>
        );
      })}
    </nav>
  );
}