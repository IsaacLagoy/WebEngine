"use client";

import { useEffect, useState } from "react";

interface GlassProps {
  children: React.ReactNode;
  className?: string;
}

export default function Glass({ children, className = "" }: GlassProps) {
  const [isSafari, setIsSafari] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect Safari (not Chrome or Chromium-based browsers)
    const ua = navigator.userAgent.toLowerCase();
    const isSafariBrowser = 
      ua.includes('safari') && 
      !ua.includes('chrome') && 
      !ua.includes('chromium') && 
      !ua.includes('edg');
    
    console.log('User Agent:', ua);
    console.log('Is Safari:', isSafariBrowser);
    
    setIsSafari(isSafariBrowser);
  }, []);

  // Default to fallback until we know the browser
  const glassClass = isSafari === true ? 'glass-safari' : 'glass-fallback';

  return (
    <div className={`glass-pane ${glassClass} ${className}`}>
      <div className="glass-content">
        {children}
      </div>
    </div>
  );
}