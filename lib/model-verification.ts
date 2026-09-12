// Common malicious executable magic numbers / script headers
export const MALICIOUS_HEADERS = [
  { name: "Windows PE/DOS Executable (MZ)", bytes: Buffer.from([0x4d, 0x5a]) },
  { name: "Linux ELF Executable", bytes: Buffer.from([0x7f, 0x45, 0x4c, 0x46]) },
  { name: "macOS Mach-O 32-bit", bytes: Buffer.from([0xfe, 0xed, 0xfa, 0xce]) },
  { name: "macOS Mach-O 64-bit", bytes: Buffer.from([0xfe, 0xed, 0xfa, 0xcf]) },
  { name: "macOS Mach-O (Reversed)", bytes: Buffer.from([0xce, 0xfa, 0xed, 0xfe]) },
  { name: "Java Class / Mach-O Fat Binary", bytes: Buffer.from([0xca, 0xfe, 0xba, 0xbe]) },
  { name: "Shell Script Shebang", bytes: Buffer.from([0x23, 0x21]) },
];

export const EICAR_SIGNATURE = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

export function verifyModelFormatMagic(ext: string, buf: Buffer): { valid: boolean; reason?: string } {
  const cleanExt = ext.replace(".", "").toLowerCase();

  // 1. Check against executable/script magic headers
  for (const sig of MALICIOUS_HEADERS) {
    if (buf.length >= sig.bytes.length && buf.subarray(0, sig.bytes.length).equals(sig.bytes)) {
      return {
        valid: false,
        reason: `Executable binary signature detected (${sig.name}). Disallowed file masquerading as .${cleanExt} rejected before storage.`,
      };
    }
  }

  // 2. Check EICAR standard test signature
  if (buf.includes(Buffer.from(EICAR_SIGNATURE))) {
    return {
      valid: false,
      reason: "Malware / virus signature detected in uploaded file (EICAR-Test-Signature). Upload rejected before storage.",
    };
  }

  // 3. Format-specific internal structure & magic checks
  if (cleanExt === "3mf") {
    // 3MF must be an Open Packaging Convention ZIP container starting with 'PK'
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      return { valid: false, reason: "Invalid 3MF package: Missing standard ZIP (PK) container header." };
    }
    return { valid: true };
  }

  if (cleanExt === "step" || cleanExt === "stp") {
    const textPreview = buf.subarray(0, 512).toString("utf8");
    if (!textPreview.includes("ISO-10303-21") && !textPreview.includes("HEADER;")) {
      return { valid: false, reason: "Invalid STEP file: Missing 'ISO-10303-21' or 'HEADER;' Exchange Structure definition." };
    }
    return { valid: true };
  }

  if (cleanExt === "stl") {
    const textHead = buf.subarray(0, 80).toString("utf8").trim().toLowerCase();
    if (textHead.startsWith("solid")) {
      const sample = buf.subarray(0, Math.min(buf.length, 512));
      const hasNullBytes = sample.some((b) => b === 0);
      if (!hasNullBytes) {
        return { valid: true }; // Valid ASCII STL
      }
    }

    // Binary STL validation: 80 bytes header + 4 bytes uint32 triangle count + (N * 50 bytes)
    if (buf.length >= 84) {
      const triangleCount = buf.readUInt32LE(80);
      const expectedSize = 84 + triangleCount * 50;
      if (triangleCount > 0 && Math.abs(buf.length - expectedSize) <= 100) {
        return { valid: true }; // Valid Binary STL
      }
    }

    if (textHead.startsWith("solid")) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: "Invalid STL file: Header and triangle geometry do not match valid ASCII or Binary STL specifications.",
    };
  }

  if (cleanExt === "obj") {
    const textSample = buf.subarray(0, 1024).toString("utf8");
    const lines = textSample.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    const hasObjTokens = lines.some((l) => l.startsWith("v ") || l.startsWith("f ") || l.startsWith("vt ") || l.startsWith("vn "));
    if (!hasObjTokens && lines.length > 0) {
      return { valid: false, reason: "Invalid Wavefront OBJ file: Missing geometric vertex (v) or face (f) elements." };
    }
    return { valid: true };
  }

  return { valid: true };
}
