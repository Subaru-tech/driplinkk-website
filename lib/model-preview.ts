import type { Object3D } from "three";
import { extensionOf } from "@/lib/uploads";

/**
 * Turning an uploaded file into something you can look at.
 *
 * Everything here is browser-only and imported dynamically: three.js plus one
 * loader is ~600 KB, and a dashboard that never opens a preview should never
 * pay for it. Nothing in this module runs during SSR.
 */

/** Extensions we can actually draw. STEP and ZIP are uploadable but not
    viewable — STEP needs an OpenCascade build, and a zip is a container. */
export const PREVIEWABLE_EXTENSIONS = [
  ".stl",
  ".obj",
  ".ply",
  ".3mf",
  ".glb",
  ".gltf",
  ".gcode",
] as const;

export function canPreview(filename: string): boolean {
  return (PREVIEWABLE_EXTENSIONS as readonly string[]).includes(extensionOf(filename));
}

/**
 * Loads a model from bytes into a three.js object.
 *
 * Geometry-only loaders (STL, PLY) return a BufferGeometry, so they get a
 * mesh + material wrapped around them here. Scene loaders (OBJ, 3MF, glTF)
 * bring their own materials, which are left alone — a glTF that ships with
 * colours should show them.
 */
export async function loadModel(buffer: ArrayBuffer, filename: string): Promise<Object3D> {
  const THREE = await import("three");
  const ext = extensionOf(filename);

  const surface = () =>
    new THREE.MeshStandardMaterial({
      color: 0xb7bec4,
      roughness: 0.62,
      metalness: 0.06,
      /* Meshes arrive with only front faces reliably wound; drawing both
         sides keeps an open or inverted model from looking full of holes. */
      side: THREE.DoubleSide,
    });

  switch (ext) {
    case ".stl": {
      const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
      const geometry = new STLLoader().parse(buffer);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, surface());
    }
    case ".ply": {
      const { PLYLoader } = await import("three/addons/loaders/PLYLoader.js");
      const geometry = new PLYLoader().parse(buffer);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, surface());
    }
    case ".obj": {
      const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js");
      return new OBJLoader().parse(new TextDecoder().decode(buffer));
    }
    case ".3mf": {
      const { ThreeMFLoader } = await import("three/addons/loaders/3MFLoader.js");
      return new ThreeMFLoader().parse(buffer);
    }
    case ".glb":
    case ".gltf": {
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(buffer, "");
      return gltf.scene;
    }
    case ".gcode": {
      const { GCodeLoader } = await import("three/addons/loaders/GCodeLoader.js");
      /* G-code draws as toolpath lines, not a solid — that IS the preview.
         Seeing the paths is the point; a shaded blob would hide them. */
      return new GCodeLoader().parse(new TextDecoder().decode(buffer));
    }
    default:
      throw new Error(`No preview for ${ext || "that file type"}.`);
  }
}

/**
 * Centres an object on the origin and returns the camera distance that frames
 * it. Uploaded models arrive at wildly different scales and origins — a 200 mm
 * part exported from CAD often sits far off-axis — so nothing can be assumed
 * about where or how big the geometry is.
 */
export async function frameObject(object: Object3D, fovDegrees: number, padding = 1.35) {
  const THREE = await import("three");
  const box = new THREE.Box3().setFromObject(object);

  if (box.isEmpty()) return { distance: 10, radius: 1 };

  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);

  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const distance = (radius / Math.sin((fovDegrees * Math.PI) / 360)) * padding;

  return { distance, radius };
}

/**
 * Renders one frame off-screen and returns a PNG.
 *
 * This is what gives a card a real thumbnail: it runs once at upload time, in
 * the browser that already has the file in memory, so no server-side mesh
 * rendering is needed. Returns null rather than throwing when WebGL is
 * unavailable (headless browsers, blocked GPUs) — a missing thumbnail is a
 * cosmetic loss and the card's icon fallback covers it.
 */
export async function renderThumbnail(file: File, size = 512): Promise<Blob | null> {
  try {
    const THREE = await import("three");
    const buffer = await file.arrayBuffer();
    const object = await loadModel(buffer, file.name);

    const scene = new THREE.Scene();
    scene.add(object);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5158, 2.2));

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1, 1.4, 1);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    const { distance } = await frameObject(object, 45);
    /* Three-quarter view: a straight-on shot of a symmetric part reads as a
       flat silhouette and tells you nothing about its depth. */
    camera.position.set(distance * 0.62, distance * 0.55, distance * 0.62);
    camera.lookAt(0, 0, 0);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(size, size, false);
    renderer.render(scene, camera);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );

    /* WebGL contexts are a limited resource — a browser drops the oldest once
       you pass ~16. Uploading a dozen files without this would blank earlier
       previews on the page. */
    renderer.dispose();
    renderer.forceContextLoss();
    disposeObject(object);

    return blob;
  } catch {
    return null;
  }
}

/** Frees GPU memory for an object tree. three.js does not do this for you. */
export async function disposeObject(object: Object3D) {
  const THREE = await import("three");
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
      child.geometry?.dispose?.();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose?.();
    }
  });
}
