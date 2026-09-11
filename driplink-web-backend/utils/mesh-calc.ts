/**
 * Server-Side 3D Mesh Volume & Weight Calculation Engine
 * =======================================================
 * Supports binary and ASCII STL mesh geometries.
 * Calculates exact volumetric mass using tetrahedral divergence integration:
 *   V = 1/6 * sum( v1 . (v2 x v3) )
 *
 * Density reference (g/cm3):
 *   - PLA: 1.24
 *   - PETG: 1.27
 *   - ABS: 1.05
 *   - Resin: 1.18
 *   - Nylon-CF: 1.15
 */

export const MATERIAL_DENSITIES: Record<string, number> = {
  pla: 1.24,
  petg: 1.27,
  abs: 1.05,
  resin: 1.18,
  "nylon-cf": 1.15,
};

export type MeshVolumeResult = {
  volumeMm3: number;
  volumeCm3: number;
  triangleCount: number;
  format: "binary" | "ascii";
};

/**
 * Computes signed tetrahedral volume for 3 vertices with respect to origin.
 */
function signedTetrahedralVolume(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  x3: number, y3: number, z3: number
): number {
  return (
    x1 * (y2 * z3 - y3 * z2) -
    y1 * (x2 * z3 - x3 * z2) +
    z1 * (x2 * y3 - x3 * y2)
  ) / 6.0;
}

/**
 * Determines whether the buffer represents a binary or ASCII STL.
 */
function isBinaryStl(buffer: Buffer): boolean {
  if (buffer.length < 84) return false;

  const triangleCount = buffer.readUInt32LE(80);
  const expectedBinarySize = 84 + triangleCount * 50;

  // Exact file size match for binary STL
  if (buffer.length === expectedBinarySize) {
    return true;
  }

  // Check if starts with "solid"
  const headerStr = buffer.toString("utf8", 0, Math.min(80, buffer.length));
  if (headerStr.startsWith("solid") && !buffer.subarray(0, 80).includes(0x00)) {
    // If it contains facet/vertex text, it's ASCII
    const textSample = buffer.toString("utf8", 0, Math.min(1000, buffer.length));
    if (textSample.includes("facet") || textSample.includes("vertex")) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates volume of an STL file from its Buffer.
 */
export function calculateStlVolume(buffer: Buffer): MeshVolumeResult {
  if (buffer.length < 84) {
    throw new Error("File too small to be a valid STL model.");
  }

  if (isBinaryStl(buffer)) {
    const triangleCount = buffer.readUInt32LE(80);
    let totalVolume = 0;
    let offset = 84;

    for (let i = 0; i < triangleCount; i++) {
      if (offset + 50 > buffer.length) break;

      // Skip 12 bytes normal (offset + 0 to + 11)
      const x1 = buffer.readFloatLE(offset + 12);
      const y1 = buffer.readFloatLE(offset + 16);
      const z1 = buffer.readFloatLE(offset + 20);

      const x2 = buffer.readFloatLE(offset + 24);
      const y2 = buffer.readFloatLE(offset + 28);
      const z2 = buffer.readFloatLE(offset + 32);

      const x3 = buffer.readFloatLE(offset + 36);
      const y3 = buffer.readFloatLE(offset + 40);
      const z3 = buffer.readFloatLE(offset + 44);

      totalVolume += signedTetrahedralVolume(x1, y1, z1, x2, y2, z2, x3, y3, z3);
      offset += 50;
    }

    const volumeMm3 = Math.abs(totalVolume);
    const volumeCm3 = volumeMm3 / 1000.0;

    return {
      volumeMm3,
      volumeCm3,
      triangleCount,
      format: "binary",
    };
  } else {
    // ASCII STL parsing
    const text = buffer.toString("utf8");
    const vertexRegex = /vertex\s+([+-]?\d*(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+([+-]?\d*(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+([+-]?\d*(?:\.\d+)?(?:[eE][+-]?\d+)?)/gi;

    let match;
    const vertices: number[][] = [];
    let totalVolume = 0;
    let triangleCount = 0;

    while ((match = vertexRegex.exec(text)) !== null) {
      vertices.push([
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3]),
      ]);

      if (vertices.length === 3) {
        const [v1, v2, v3] = vertices;
        totalVolume += signedTetrahedralVolume(
          v1[0], v1[1], v1[2],
          v2[0], v2[1], v2[2],
          v3[0], v3[1], v3[2]
        );
        triangleCount++;
        vertices.length = 0;
      }
    }

    const volumeMm3 = Math.abs(totalVolume);
    const volumeCm3 = volumeMm3 / 1000.0;

    return {
      volumeMm3,
      volumeCm3,
      triangleCount,
      format: "ascii",
    };
  }
}

/**
 * Calculates part weight in grams for a given volume and material.
 * Weight (g) = Volume (cm³) * Density (g/cm³)
 */
export function calculatePartWeight(volumeCm3: number, material: string): number {
  const normMat = material.trim().toLowerCase();
  const density = MATERIAL_DENSITIES[normMat] ?? 1.24; // Default to PLA density if unrecognized
  const weight = volumeCm3 * density;
  return Math.round(weight * 100) / 100; // 2 decimal places precision
}
