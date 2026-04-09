"use client";

import { PixelMascot } from "./pixel-mascot";
import { FloatingObjects } from "./floating-objects";

export function MascotWrapper() {
  return (
    <>
      <FloatingObjects />
      <PixelMascot size={80} />
    </>
  );
}
