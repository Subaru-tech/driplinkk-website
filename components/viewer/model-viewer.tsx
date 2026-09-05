"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { createStudioEnvironment, disposeObject, frameObject, loadModel } from "@/lib/model-preview";

/**
 * Live 3D preview of an uploaded file, in the browser, with no plugin and no
 * desktop app.
 *
 * Drag to orbit, scroll to zoom, right-drag to pan. The file is fetched as
 * bytes and parsed client-side; nothing is rendered on the server.
 *
 * three.js and the loader are imported dynamically inside an effect, so this
 * component costs nothing until it is actually mounted.
 *
 * Rendering features:
 *   - Studio-quality PMREM environment map for realistic reflections
 *   - ACESFilmic tone mapping for cinematic contrast
 *   - 4-light rig: hemisphere + key + fill + rim
 *   - Contact shadow ground plane
 *   - Smooth auto-rotate that pauses on interaction
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

        /* ---- Scene ---- */
        const scene = new THREE.Scene();

        /* Subtle gradient background — dark forest tones that match the site */
        const bgCanvas = document.createElement("canvas");
        bgCanvas.width = 2;
        bgCanvas.height = 512;
        const bgCtx = bgCanvas.getContext("2d")!;
        const grad = bgCtx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, "#3a4133");   // --bg-secondary
        grad.addColorStop(0.5, "#31372b"); // --bg-primary
        grad.addColorStop(1, "#262b21");   // --bg-void
        bgCtx.fillStyle = grad;
        bgCtx.fillRect(0, 0, 2, 512);
        const bgTexture = new THREE.CanvasTexture(bgCanvas);
        bgTexture.colorSpace = THREE.SRGBColorSpace;
        scene.background = bgTexture;

        scene.add(object);

        /* ---- 4-light studio rig ---- */
        /* Hemisphere: warm sky, cool ground — gentle fill everywhere */
        scene.add(new THREE.HemisphereLight(0xfaf7ee, 0x3a4133, 1.4));

        /* Key: strong warm white from upper-right front */
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(2, 3, 1.5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.bias = -0.0005;
        scene.add(key);

        /* Fill: softer cool blue from opposite side */
        const fill = new THREE.DirectionalLight(0xc7d8f0, 0.9);
        fill.position.set(-2, 0.5, -1);
        scene.add(fill);

        /* Rim: subtle warm backlight to define edges against dark background */
        const rim = new THREE.DirectionalLight(0xfff4e0, 0.7);
        rim.position.set(0, -0.5, -2.5);
        scene.add(rim);

        /* ---- Camera ---- */
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 100000);
        const { distance, radius } = await frameObject(object, 40);
        camera.position.set(distance * 0.62, distance * 0.55, distance * 0.62);

        /* Scale shadow camera to model size */
        key.shadow.camera.near = 0.1;
        key.shadow.camera.far = distance * 6;
        const shadowExtent = radius * 2;
        key.shadow.camera.left = -shadowExtent;
        key.shadow.camera.right = shadowExtent;
        key.shadow.camera.top = shadowExtent;
        key.shadow.camera.bottom = -shadowExtent;

        /* ---- Contact shadow ground plane ---- */
        const groundGeo = new THREE.PlaneGeometry(radius * 6, radius * 6);
        const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        /* Place ground at the bottom of the model */
        const modelBox = new THREE.Box3().setFromObject(object);
        ground.position.y = modelBox.min.y - 0.001;
        ground.receiveShadow = true;
        scene.add(ground);

        /* Enable shadow casting on all mesh children */
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        /* ---- Renderer ---- */
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.className = "size-full touch-none";
        container.appendChild(renderer.domElement);

        /* ---- Environment map ---- */
        const envMap = await createStudioEnvironment(renderer);
        scene.environment = envMap;

        /* Apply environment map to all PBR materials */
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of mats) {
              if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                if (!mat.envMap) mat.envMap = envMap;
                mat.envMapIntensity = mat.envMapIntensity ?? 0.7;
                mat.needsUpdate = true;
              }
            }
          }
        });

        /* ---- Controls ---- */
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.rotateSpeed = 0.8;
        controls.panSpeed = 0.6;
        controls.zoomSpeed = 1.2;
        controls.target.set(0, 0, 0);
        /* Zoom bounds keyed to the model's own size, so a 2 mm screw and a
           300 mm bracket both behave the same under the same gestures. */
        controls.minDistance = distance * 0.12;
        controls.maxDistance = distance * 8;
        /* Gentle auto-rotate — stops when user interacts, resumes 3s later */
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.5;
        controls.update();

        /* Pause auto-rotate on interaction, resume after idle */
        let autoRotateTimer: ReturnType<typeof setTimeout> | null = null;
        const pauseAutoRotate = () => {
          controls.autoRotate = false;
          if (autoRotateTimer) clearTimeout(autoRotateTimer);
          autoRotateTimer = setTimeout(() => {
            controls.autoRotate = true;
          }, 3000);
        };
        renderer.domElement.addEventListener("pointerdown", pauseAutoRotate);
        renderer.domElement.addEventListener("wheel", pauseAutoRotate);

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
          if (autoRotateTimer) clearTimeout(autoRotateTimer);
          renderer.domElement.removeEventListener("pointerdown", pauseAutoRotate);
          renderer.domElement.removeEventListener("wheel", pauseAutoRotate);
          observer.disconnect();
          controls.dispose();
          envMap.dispose();
          bgTexture.dispose();
          groundGeo.dispose();
          groundMat.dispose();
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
          Drag to orbit · scroll to zoom · auto-rotates
        </p>
      ) : null}
    </div>
  );
}
