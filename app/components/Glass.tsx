"use client";

interface GlassProps {
  children: React.ReactNode;
  className?: string;
}

export default function Glass({ children, className = "" }: GlassProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 ${className}`}>
      {children}
    </div>
  );
}