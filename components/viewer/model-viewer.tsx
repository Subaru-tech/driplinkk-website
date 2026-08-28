"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { disposeObject, frameObject, loadModel } from "@/lib/model-preview";

/**
 * Live 3D preview of an uploaded file, in the browser, with no plugin and no
 * desktop app.
 *
 * Drag to orbit, scroll to zoom, right-drag to pan. The file is fetched as
 * bytes and parsed client-side; nothing is rendered on the server.
 *
 * three.js and the loader are imported dynamically inside an effect, so this
 * component costs nothing until it is actually mounted.
 */
export function ModelViewer({
  url,
  filename,
  className,
}: {
  url: string;
  filename: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* Everything the cleanup needs to tear down, captured as it's created.
       An effect that unmounts mid-load must still release the GPU context. */
    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Couldn't fetch the file.");
        const buffer = await response.arrayBuffer();
        if (disposed) return;

        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        const object = await loadModel(buffer, filename);
        if (disposed) {
          await disposeObject(object);
          return;
        }

        const scene = new THREE.Scene();
        scene.add(object);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x40474e, 2.1));

        const key = new THREE.DirectionalLight(0xffffff, 1.5);
        key.position.set(1, 1.4, 1);
        scene.add(key);

        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-1.2, -0.4, -0.8);
        scene.add(fill);

        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100000);
        const { distance } = await frameObject(object, 45);
        camera.position.set(distance * 0.62, distance * 0.55, distance * 0.62);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);
        renderer.domElement.className = "size-full touch-none";
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);
        /* Zoom bounds keyed to the model's own size, so a 2 mm screw and a
           300 mm bracket both behave the same under the same gestures. */
        controls.minDistance = distance * 0.15;
        controls.maxDistance = distance * 6;
        controls.update();

        const render = () => {
          controls.update();
          renderer.render(scene, camera);
          frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);

        const observer = new ResizeObserver(() => {
          const w = container.clientWidth || 1;
          const h = container.clientHeight || 1;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        });
        observer.observe(container);

        setStatus("ready");

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          controls.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
          void disposeObject(object);
        };
      } catch (error) {
        if (disposed) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Couldn't render this file.");
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [url, filename]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-raised",
        className,
      )}
    >
      <div ref={containerRef} className="size-full" />

      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center gap-2 text-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading preview</span>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <AlertCircle className="size-5 text-danger" aria-hidden="true" />
          <p className="text-sm text-muted">{message}</p>
        </div>
      ) : null}

      {status === "ready" ? (
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-faint">
          Drag to orbit · scroll to zoom
        </p>
      ) : null}
    </div>
  );
}
