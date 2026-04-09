"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface FloatingObj {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  icon: string;
  opacity: number;
}

// SVG path data for comic real estate objects
const ICONS: { name: string; path: string }[] = [
  // House with blown-off roof
  { name: "blown-roof", path: "M4 22v-8l8-8 8 8v8H4zM2 6l4-3 3 2 2-2 3 3M20 4l-3 2-2-3" },
  // Umbrella
  { name: "umbrella", path: "M12 2v20M12 2C6 2 2 7 2 12h20c0-5-4-10-10-10zM10 22c0 1.1.9 2 2 2s2-.9 2-2" },
  // Sofa
  { name: "sofa", path: "M4 14v-3a2 2 0 012-2h12a2 2 0 012 2v3M2 14a2 2 0 012-2v5a1 1 0 001 1h14a1 1 0 001-1v-5a2 2 0 014 0v5a3 3 0 01-3 3H5a3 3 0 01-3-3v-5z" },
  // Eiffel Tower
  { name: "eiffel", path: "M12 2l-4 10h8L12 2zM8 12l-3 10h14l-3-10M10 17h4M9 7h6" },
  // Burj Khalifa
  { name: "burj", path: "M12 2v20M10 22h4M11 4h2v2h-2zM10 8h4v3h-4zM9 13h6v4H9zM8 19h8v3H8z" },
  // Person with umbrella
  { name: "person-umbrella", path: "M12 4a2 2 0 100-4 2 2 0 000 4zM12 4v8M8 8l4-2 4 2M10 12l-2 8M14 12l2 8M6 1c3-1 6-1 9 0M7 1C7-1 17-1 17 1" },
  // Flying roof
  { name: "flying-roof", path: "M2 12l10-8 10 8M5 11l7-5.6L19 11M3 14l2-1M19 14l2-1M8 9l-3-4M16 9l3-4" },
  // Key
  { name: "key", path: "M21 2l-2 2-3.5-1L14 4.5 12.5 3 11 4.5 8 7.5a5.5 5.5 0 10-1 7 5.5 5.5 0 001-7L21 2zM5.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" },
  // For Sale sign
  { name: "for-sale", path: "M6 4h12v8H6V4zM12 12v8M8 20h8M8 7h8M8 9h5" },
  // Window
  { name: "window", path: "M3 5h18v14H3V5zM12 5v14M3 12h18M7 8h2M15 8h2M7 15h2M15 15h2" },
  // Crane
  { name: "crane", path: "M10 22V6M6 22h8M10 6l8-4M10 6l-6-2M18 2v8M16 4h4M10 10h6M10 14h4" },
  // Cactus (funny housewarming)
  { name: "cactus", path: "M12 22V6M12 6c0-2-3-4-3-4M12 10c0-2 3-4 3-4M9 6v6M15 10v4M10 22h4" },
  // Satellite dish
  { name: "satellite", path: "M4 20L20 4M8 16l2 2M12 12l2 2M16 8l2 2M2 22a20 20 0 0120-20" },
  // Swimming pool
  { name: "pool", path: "M2 16c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M2 20c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M4 8h16v6H4V8zM8 8V6M16 8V6" },
  // Palm tree
  { name: "palm", path: "M12 22V10M12 10c-4-2-8 0-8 0M12 10c4-2 8 0 8 0M12 10c-2-4-1-8-1-8M12 10c2-4 1-8 1-8M10 22h4" },
];

function createObject(id: number, canvasW: number, canvasH: number): FloatingObj {
  const icon = ICONS[id % ICONS.length];
  return {
    id,
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 0.4,
    size: 36 + Math.random() * 28,
    icon: icon.path,
    opacity: 0.12 + Math.random() * 0.10,
  };
}

export function FloatingObjects() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<FloatingObj[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [, setTick] = useState(0);

  // Initialize objects
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    objectsRef.current = Array.from({ length: 22 }, (_, i) => createObject(i, w, h));
  }, []);

  // Mouse tracking
  const handleMouse = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [handleMouse]);

  // Animation loop
  useEffect(() => {
    let raf: number;
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mouse = mouseRef.current;

      objectsRef.current.forEach((obj) => {
        // Mouse nudge — push objects away from cursor
        const dx = obj.x - mouse.x;
        const dy = obj.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120 * 0.8;
          obj.vx += (dx / dist) * force;
          obj.vy += (dy / dist) * force;
        }

        // Apply velocity with friction
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.vx *= 0.98;
        obj.vy *= 0.98;
        obj.rotation += obj.rotationSpeed;

        // Wrap around edges
        if (obj.x < -50) obj.x = w + 50;
        if (obj.x > w + 50) obj.x = -50;
        if (obj.y < -50) obj.y = h + 50;
        if (obj.y > h + 50) obj.y = -50;
      });

      setTick((t) => t + 1);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
    >
      {objectsRef.current.map((obj) => (
        <div
          key={obj.id}
          className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
          style={{
            left: obj.x - obj.size / 2,
            top: obj.y - obj.size / 2,
            width: obj.size,
            height: obj.size,
            transform: `rotate(${obj.rotation}deg)`,
            opacity: obj.opacity,
            transition: "opacity 0.3s",
          }}
          onMouseEnter={() => {
            // Give a little extra push on hover
            const angle = Math.random() * Math.PI * 2;
            obj.vx += Math.cos(angle) * 2;
            obj.vy += Math.sin(angle) * 2;
            obj.rotationSpeed += (Math.random() - 0.5) * 2;
          }}
        >
          <svg
            width={obj.size}
            height={obj.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={obj.icon} />
          </svg>
        </div>
      ))}
    </div>
  );
}
