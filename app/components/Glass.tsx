"use client";

interface GlassProps {
  children: React.ReactNode;
  className?: string;
}

export default function Glass({ children, className = "" }: GlassProps) {
  return (
    <div className={`bg-white/2 backdrop-blur-sm border border-white/20 ${className}`}>
      {children}
    </div>
  );
}