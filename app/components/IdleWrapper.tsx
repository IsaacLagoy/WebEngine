"use client";

import { useEffect, useState, useRef, ReactNode } from "react";

interface IdleWrapperProps {
  children: ReactNode;
  idleTimeoutSeconds?: number;
}

export default function IdleWrapper({ 
  children, 
  idleTimeoutSeconds = 5 
}: IdleWrapperProps) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetIdleTimer = () => {
    setIsIdle(false);
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, idleTimeoutSeconds * 1000);
  };

  useEffect(() => {
    // Initial timer setup
    resetIdleTimer();

    // Track various user activities
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [idleTimeoutSeconds]);

  return (
    <div
      className={`transition-opacity duration-1000 ${
        isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
}
