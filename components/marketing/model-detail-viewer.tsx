"use client";

import {
  Box,
  Maximize2,
  Minimize2,
  Orbit,
  RotateCcw,
  Sun,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function ModelDetailViewer({
  title,
  previewImages = [],
}: {
  title: string;
  previewImages?: string[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [lighting, setLighting] = useState<"studio" | "cyber" | "blueprint">("studio");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImage = previewImages.length > 0 ? previewImages[selectedIndex] : null;

  function handleReset() {
    setRotation(0);
    setZoom(1);
  }

  function handleRotate() {
    setRotation((prev) => (prev + 45) % 360);
  }

  function handleZoom() {
    setZoom((prev) => (prev >= 1.6 ? 1 : prev + 0.3));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main 3D Viewport */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface to-raised transition-all",
          isFullscreen
            ? "fixed inset-4 z-50 rounded-2xl border-line-strong shadow-2xl"
            : "aspect-4/3 w-full"
        )}
      >
        {/* Viewport Ambient Backlight */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300",
            lighting === "studio" && "bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_70%)]",
            lighting === "cyber" && "bg-[radial-gradient(circle_at_50%_40%,rgba(0,229,180,0.12),transparent_70%)]",
            lighting === "blueprint" && "bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.15),transparent_70%)]"
          )}
        />

        {/* 3D Visual Content */}
        {currentImage ? (
          <div className="relative size-full flex items-center justify-center p-6 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={title}
              className="max-h-full max-w-full object-contain select-none transition-transform duration-300 drop-shadow-2xl"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
              }}
            />
          </div>
        ) : (
          <div className="grid size-full place-items-center">
            <div className="flex flex-col items-center gap-3">
              <Box className="size-16 text-faint" strokeWidth={1.2} />
              <p className="text-xs text-muted font-mono">3D Mesh Viewport</p>
            </div>
          </div>
        )}

        {/* Top Viewport Floating Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-canvas/80 px-2.5 py-1 text-xs font-medium text-fg backdrop-blur-md border border-line/60 shadow-xs">
            <Orbit className="size-3.5 text-accent animate-spin-slow" />
            <span>Interactive 3D Preview</span>
          </div>
        </div>

        {/* Floating Viewport Controls */}
        <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 rounded-xl bg-canvas/85 p-1 backdrop-blur-md border border-line/70 shadow-lg">
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 45°"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg transition-colors"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleZoom}
            title="Zoom In"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg transition-colors"
          >
            <ZoomIn className="size-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setLighting((prev) =>
                prev === "studio" ? "cyber" : prev === "cyber" ? "blueprint" : "studio"
              )
            }
            title={`Lighting: ${lighting}`}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg transition-colors"
          >
            <Sun className="size-4 text-accent" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset View"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg transition-colors"
          >
            <span className="text-[10px] font-mono font-bold">1:1</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Angle Thumbnails Carousel */}
      {previewImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
          {previewImages.map((imgPath, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedIndex(idx);
                handleReset();
              }}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-xl border bg-raised transition-all cursor-pointer",
                selectedIndex === idx
                  ? "border-accent ring-2 ring-accent/30 scale-105"
                  : "border-line opacity-70 hover:opacity-100 hover:border-line-strong"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgPath} alt={`Angle ${idx + 1}`} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted/80 flex items-center justify-between">
        <span>Click and rotate or switch viewpoints. High-res CAD geometries unlock upon acquisition.</span>
        <span className="font-mono text-[11px] text-faint">3D Studio v2.4</span>
      </p>
    </div>
  );
}
