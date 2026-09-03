"use client";

import { useRef, useState, useEffect } from "react";

export default function SitzplanSkaliert({
  breite,
  hoehe,
  children,
}: {
  breite: number;
  hoehe: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      setScale(Math.min(1, w / breite));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [breite]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-border shadow-sm"
      style={{ height: hoehe * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: breite, height: hoehe }}>
        {children}
      </div>
    </div>
  );
}
