"use client";

import { useEffect, useState, useCallback } from "react";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { DndClass, ClassData, readCollectionPage, removeFromCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";

const PAGE_SIZE = 50;

export default function ClassesPage() {
  const router = useRouter();
  const [trail, setTrail] = useState<string | null>(null);

  const [classes, setClasses] = useState<DndClass[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [hasNextPage, setHasNextPage] = useState(false);
  const isAdmin = useIsAdmin();

  const loadClasses = useCallback(async () => {
    try {
      const result = await readCollectionPage<ClassData>("classes", PAGE_SIZE, cursorByPage[currentPage], true);
      setClasses(result.items);
      setHasNextPage(result.nextCursor !== null);
      setCursorByPage((prev) => {
        if (!result.nextCursor) return prev;
        if (prev[currentPage + 1] === result.nextCursor) return prev;
        return { ...prev, [currentPage + 1]: result.nextCursor };
      });
    } catch (err: any) {
      console.error("Error loading classes:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [currentPage, cursorByPage]);

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
          <>
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
          {(currentPage > 1 || hasNextPage) && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl px-2"
              >
                &lt;
              </button>
              <span className="text-white/60 text-sm">
                Page {currentPage}
              </span>
              <button
                onClick={() => {
                  if (hasNextPage) setCurrentPage((p) => p + 1);
                }}
                disabled={!hasNextPage}
                className="text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl px-2"
              >
                &gt;
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </main>
  );
}