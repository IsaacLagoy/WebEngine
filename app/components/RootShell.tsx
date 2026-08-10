"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import IdleWrapper from "./IdleWrapper";
import Header from "./Header";

const CampScene = dynamic(() => import("./CampScene"), { ssr: false });

const DISABLE_BACKGROUND_AND_IDLE: string[] = [
  "/games/matrix-stack",
  "/games/date-my-roommate"
];

export default function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const disableExtras = DISABLE_BACKGROUND_AND_IDLE.some((p) =>
    pathname.startsWith(p),
  );

  if (disableExtras) {
    return <div className="relative z-10">{children}</div>;
  }

  return (
    <>
      <div className="fixed inset-0 z-0 w-screen h-screen bg-black">
        <CampScene />
      </div>
      <IdleWrapper idleTimeoutSeconds={300}>
        <Header />
        <div className="relative z-10">{children}</div>
      </IdleWrapper>
    </>
  );
}

