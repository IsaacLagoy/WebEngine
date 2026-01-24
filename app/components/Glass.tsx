"use client";

import { forwardRef } from "react";

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
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