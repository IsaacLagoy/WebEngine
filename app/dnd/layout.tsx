import { Suspense } from "react";
import Breadcrumbs from "@/app/dnd/components/Breadcrumbs";

export default function DndLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="max-w-4xl mx-auto pt-24 px-8">
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
      </div>
      {children}
    </>
  );
}