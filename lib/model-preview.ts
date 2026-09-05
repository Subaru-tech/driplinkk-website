import type { Object3D, WebGLRenderer as WebGLRendererType } from "three";
import { extensionOf } from "@/lib/uploads";

/**
 * Turning an uploaded file into something you can look at.
 *
 * Everything here is browser-only and imported dynamically: three.js plus one
 * loader is ~600 KB, and a dashboard that never opens a preview should never
 * pay for it. Nothing in this module runs during SSR.
 */

/**
 * Creates a studio-quality environment map from a simple gradient.
 * This gives reflective surfaces something to reflect and provides
 * soft ambient lighting that wraps around geometry.
 */
export async function createStudioEnvironment(renderer: WebGLRendererType) {
  const THREE = await import("three");
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();

  /* Build a gradient scene that acts like a photo studio's cyclorama.
     Warm from above, cool from below, bright key from upper-right. */
  const envScene = new THREE.Scene();

  /* Sky dome — warm overhead light */
  const skyGeo = new THREE.SphereGeometry(50, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  envScene.add(skyMesh);

  /* Paint the sky with a gradient: warm white top → cool gray bottom */
  const colors = skyGeo.getAttribute("position");
  const colorAttr = new Float32Array(colors.count * 3);
  const tmpV = new THREE.Vector3();
  for (let i = 0; i < colors.count; i++) {
    tmpV.set(
      colors.getX(i),
      colors.getY(i),
      colors.getZ(i),
    ).normalize();
    const t = tmpV.y * 0.5 + 0.5; // 0 = bottom, 1 = top
    /* Warm white at top (1.2, 1.15, 1.0), cool blue-gray at bottom (0.15, 0.18, 0.25) */
    colorAttr[i * 3] = 0.15 + t * 1.05;
    colorAttr[i * 3 + 1] = 0.18 + t * 0.97;
    colorAttr[i * 3 + 2] = 0.25 + t * 0.75;
  }
  skyGeo.setAttribute("color", new THREE.BufferAttribute(colorAttr, 3));
  skyMat.vertexColors = true;

  /* Bright key light spot — upper right */
  const keyGeo = new THREE.SphereGeometry(2, 16, 8);
  const keyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const keyMesh = new THREE.Mesh(keyGeo, keyMat);
  keyMesh.position.set(15, 25, 10);
  envScene.add(keyMesh);

  /* Softer fill spot — lower left */
  const fillGeo = new THREE.SphereGeometry(4, 16, 8);
  const fillMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.45, 0.5) });
  const fillMesh = new THREE.Mesh(fillGeo, fillMat);
  fillMesh.position.set(-20, -5, -15);
  envScene.add(fillMesh);

  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  envScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      child.material?.dispose?.();
    }
  });

  return envMap;
}

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
    new THREE.MeshPhysicalMaterial({
      color: 0xd4d8dc,
      roughness: 0.38,
      metalness: 0.05,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4,
      sheen: 0.1,
      sheenColor: new THREE.Color(0xe8ecf0),
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

    /* 3-point lighting rig for studio-quality thumbnails */
    scene.add(new THREE.HemisphereLight(0xfaf7ee, 0x3a4133, 1.8));

    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(2, 3, 1.5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc7d8f0, 0.8);
    fill.position.set(-1.5, 0.5, -1);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff4e0, 0.6);
    rim.position.set(0, -1, -2);
    scene.add(rim);

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* Generate environment map for reflections */
    const envMap = await createStudioEnvironment(renderer);
    scene.environment = envMap;

    /* Apply environment map to geometry-only materials */
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
            if (!mat.envMap) mat.envMap = envMap;
            mat.envMapIntensity = mat.envMapIntensity ?? 0.6;
            mat.needsUpdate = true;
          }
        }
      }
    });

    renderer.render(scene, camera);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );

    /* WebGL contexts are a limited resource — a browser drops the oldest once
       you pass ~16. Uploading a dozen files without this would blank earlier
       previews on the page. */
    envMap.dispose();
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
