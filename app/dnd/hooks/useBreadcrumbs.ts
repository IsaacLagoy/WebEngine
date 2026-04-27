"use client";

import { usePathname, useSearchParams } from "next/navigation";

export type Crumb = {
  label: string;
  href: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  elements: "Elements",
  "skill-sheets": "Skill Sheets",
  skills: "Skills",
  spells: "Spells",
  classes: "Classes",
};

function segmentToLabel(segment: string): string {
  // Check static map first
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // Otherwise title-case the segment (for dynamic IDs like "engineer")
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pathToCrumb(path: string): Crumb {
  const segments = path.split("/").filter(Boolean); // e.g. ["classes", "engineer"]
  const label = segmentToLabel(segments[segments.length - 1]);
  return { label, href: `/dnd/${path}` };
}

export function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trail = searchParams.get("trail");

  // Build past crumbs from trail param
  const pastCrumbs: Crumb[] = trail
    ? trail.split(",").map((path) => pathToCrumb(path.trim()))
    : [];

  // Current page crumb (no href — it's where we are)
  const relativePath = pathname.replace(/^\/dnd\//, "");
  const segments = relativePath.split("/").filter(Boolean);
  const currentLabel = segmentToLabel(segments[segments.length - 1]);

  return [
    { label: "DnD", href: "/dnd" },
    ...pastCrumbs,
    { label: currentLabel, href: pathname },
  ];
}

// Helper for pages to call when navigating forward
export function appendTrail(
  currentPath: string,
  existingTrail: string | null
): string {
  const relative = currentPath.replace(/^\/dnd\//, "");
  if (!existingTrail) return relative;
  return `${existingTrail},${relative}`;
}