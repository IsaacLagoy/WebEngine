"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import CampScene from "./CampScene";
import IdleWrapper from "./IdleWrapper";
import Header from "./Header";

const DISABLE_BACKGROUND_AND_IDLE: string[] = [
  "/games/matrix-stack",
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
      <div className="fixed inset-0 z-0 w-screen h-screen">
        <CampScene />
      </div>
      <IdleWrapper idleTimeoutSeconds={300}>
        <Header />
        <div className="relative z-10">{children}</div>
      </IdleWrapper>
    </>
  );
}

