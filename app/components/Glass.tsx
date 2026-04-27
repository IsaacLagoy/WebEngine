"use client";

import { forwardRef, type MouseEventHandler, type ReactNode } from "react";

interface GlassProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Glass = forwardRef<HTMLDivElement, GlassProps>(
  ({ children, className = "", onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`bg-white/2 backdrop-blur-sm border border-white/20 ${className}`}
      >
        {children}
      </div>
    );
  }
);

Glass.displayName = "Glass";

export default Glass;