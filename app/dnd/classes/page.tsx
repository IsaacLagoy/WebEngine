"use client";

import { useEffect, useState, useCallback } from "react";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { DndClass, ClassData, readCollection, removeFromCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";

export default function ClassesPage() {
  const router = useRouter();
  const [trail, setTrail] = useState<string | null>(null);

  const [classes, setClasses] = useState<DndClass[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const isAdmin = useIsAdmin();

  const loadClasses = useCallback(async () => {
    try {
      const data = await readCollection<ClassData>("classes");
      setClasses(data);
    } catch (err: any) {
      console.error("Error loading classes:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  async function handleDeleteClass(classId: string) {
    try {
      await removeFromCollection("classes", classId);
      await loadClasses();
    } catch (err: any) {
      console.error("Error deleting class:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to delete classes.");
      }
    }
  }

  function handleClassClick(cls: DndClass) {
    const nextTrail = trail ? `${trail},classes` : "classes";
    router.push(`/dnd/classes/${cls.id}?trail=${nextTrail}`);
  }

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTrail(params.get("trail"));
  }, []);

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Classes
        </h1>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-white/70 text-lg">No classes found.</div>
        ) : (
          <ul className="space-y-3">
            {classes.map((cls) => (
              <li key={cls.id}>
                <Glass
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between relative"
                  onClick={() => handleClassClick(cls)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white font-semibold text-lg">
                      {cls.name}
                    </div>
                    {cls.alignment && (
                      <div className="text-white/40 text-xs hidden sm:block">
                        {cls.alignment}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id);
                      }}
                      className="bg-red-600/40 hover:bg-red-600/60 text-white hover:text-red-800 transition-all -m-1.5"
                    >
                      <Glass className="w-10 h-10 flex items-center justify-center border-none">
                        x
                      </Glass>
                    </button>
                  )}
                </Glass>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}