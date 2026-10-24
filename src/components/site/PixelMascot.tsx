"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { svgDataUrl } from "@/lib/mascot/svg";

/**
 * Demonstrates what a raster mascot really is: the same source rendered once at
 * icon size and upscaled. Generated in-browser from the engine's SVG — no image
 * assets ship with Anitoon.
 */
export function PixelMascot({
  svg,
  className,
  alt,
  pixels = 96,
}: {
  svg: string;
  className?: string;
  alt: string;
  pixels?: number;
}) {
  const source = svgDataUrl(svg);
  const [pixelated, setPixelated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      try {
        const ratio = 430 / 420;
        const canvas = document.createElement("canvas");
        canvas.width = pixels;
        canvas.height = Math.round(pixels * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        if (!cancelled) setPixelated(canvas.toDataURL("image/png"));
      } catch {
        /* fall back to the vector source */
      }
    };
    image.src = source;
    return () => {
      cancelled = true;
    };
  }, [source, pixels]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pixelated ?? source}
      alt={alt}
      width={pixels}
      height={Math.round(pixels * (430 / 420))}
      data-pixelated={Boolean(pixelated)}
      className={clsx(
        "h-auto w-full [image-rendering:pixelated]",
        className,
      )}
    />
  );
}

export default PixelMascot;
