"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function InteractiveEyeProp() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 18;
      const ny = (e.clientY / window.innerHeight - 0.5) * 14;
      containerRef.current.style.transform = `translate3d(${nx.toFixed(1)}px, ${ny.toFixed(1)}px, 0)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute right-1/4 top-10 z-0 hidden xl:block opacity-90 transition-transform duration-500 ease-out"
    >
      <Image
        src="/art/prop-eye.webp"
        alt=""
        width={100}
        height={100}
        unoptimized
        className="drop-shadow-[0_8px_16px_rgba(40,34,22,0.14)]"
      />
    </div>
  );
}

export default InteractiveEyeProp;
