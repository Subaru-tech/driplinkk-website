"use client";

import { useEffect, useRef } from "react";

/**
 * The hero visual: the DripLink Core — a bed-slinger 3D printer drawn as a
 * dead-on front elevation, printing a tree that rotates 360° as it builds.
 *
 * Deliberate choices:
 *   · The MACHINE never rotates or tilts. A front elevation is the reading
 *     people recognise instantly, so the silhouette does the work.
 *   · Only the TREE rotates. All the motion in the frame belongs to the part.
 *   · The tree is stacked horizontal layer lines — exactly what a real print
 *     looks like head-on. As it spins, the off-axis canopy spheres orbit and
 *     each layer's width changes; that width change IS the rotation.
 *   · The control screen shows the animation's real build percentage, so the
 *     machine is never reporting a number that contradicts what you see.
 *
 * All generated. No screenshots, no stock renders, no 3D library.
 */

const LAYERS = 104;
const BUILD_SECONDS = 15;
const SPIN_SECONDS = 10;

/* --- machine, in model units (x right, y up, origin at floor centre) -----
   Proportions are held to the dimensions the drawing labels: the frame is
   380mm tall (frameTop + barH = 268 units) and 360mm wide, so the width has
   to be 268 × 360/380 = 254 units. The earlier 172 made it a third narrower
   than its own callout claimed.
   Scale: 268 units = 380mm, i.e. ~0.705 units per mm. */
const M = {
  baseW: 254,
  baseH: 48,
  postX: 108,
  postW: 14,
  frameTop: 252,
  barH: 16,
  bedY: 64,
  bedW: 186,
  /* 190mm at the scale above. Capped by the frame, not chosen freely: the
     gantry has to carry the whole hotend above the top layer, so the build
     height can only be (frameTop − bedY − NOZZLE_DROP − clearance). At 148 the
     head punched through the crossbar once the nozzle was aligned properly. */
  printH: 134,
  spool: { x: 166, y: 134, r: 34 },
};

/** Model units from the gantry beam's origin down to the nozzle tip. */
const NOZZLE_DROP = 42;

const BBOX = {
  left: -M.baseW / 2 - 4,
  right: M.spool.x + M.spool.r + 4,
  top: M.frameTop + M.barH + 6,
  bottom: -12,
};

type Rgb = [number, number, number];

function readRgb(styles: CSSStyleDeclaration, name: string, fallback: Rgb): Rgb {
  const raw = styles.getPropertyValue(name).trim();
  const hex = raw.startsWith("#") ? raw.slice(1) : "";
  if (hex.length !== 6) return fallback;
  const v = Number.parseInt(hex, 16);
  return Number.isNaN(v) ? fallback : [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r},${g},${b},${a})`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/* --- the tree ----------------------------------------------------------- */
const FORK = 0.34;
/*
 * Every sphere must satisfy y + r <= 1, or its crown sits above the last
 * printed layer and gets sliced flat — the tree then never finishes no matter
 * how long the build runs. The previous set peaked at 1.10, so a tenth of the
 * canopy was unreachable by construction. Highest crown here is 0.96.
 */
const CANOPY: { x: number; y: number; z: number; r: number }[] = [
  { x: 0, y: 0.66, z: 0, r: 0.3 },
  { x: -0.23, y: 0.56, z: 0.1, r: 0.22 },
  { x: 0.24, y: 0.58, z: -0.08, r: 0.23 },
  { x: 0.05, y: 0.75, z: 0.05, r: 0.2 },
  { x: -0.15, y: 0.7, z: -0.14, r: 0.17 },
  { x: 0.17, y: 0.69, z: 0.15, r: 0.16 },
];

type Slice = { cx: number; cz: number; r: number; bark: boolean };

function crossSections(t: number): Slice[] {
  const out: Slice[] = [];
  if (t < 0.022) {
    /* Brim disc — the printed raft the reference model sits on. */
    out.push({ cx: 0, cz: 0, r: 0.2, bark: true });
  }
  if (t < FORK) {
    const taper = 0.075 - 0.028 * (t / FORK);
    const flare = t < 0.09 ? 1 + (0.09 - t) * 6 : 1;
    out.push({ cx: 0, cz: 0, r: taper * flare, bark: true });
  } else if (t < 0.6) {
    const k = (t - FORK) / (0.6 - FORK);
    const spread = 0.17 * k;
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2 + 0.5;
      out.push({
        cx: Math.cos(a) * spread,
        cz: Math.sin(a) * spread,
        r: 0.046 - 0.018 * k,
        bark: true,
      });
    }
  }
  for (const s of CANOPY) {
    const dy = t - s.y;
    if (Math.abs(dy) < s.r) {
      out.push({ cx: s.x, cz: s.z, r: Math.sqrt(s.r * s.r - dy * dy), bark: false });
    }
  }
  return out;
}

export function PrintCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    const HEAD_START = BUILD_SECONDS * 1000 * 0.55;
    let startedAt = performance.now() - HEAD_START;

    const rootStyles = getComputedStyle(document.documentElement);
    let cream = readRgb(rootStyles, "--accent", [250, 247, 238]);
    let foliage = readRgb(rootStyles, "--accent-2", [169, 210, 107]);
    let machine = readRgb(rootStyles, "--machine", [151, 161, 137]);
    let bark = readRgb(rootStyles, "--bark", [192, 139, 82]);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      /* Layout may not have resolved on the first synchronous pass. Writing a
         zero-size backing store here would blank the canvas permanently if the
         frame loop is also throttled, so hold the previous size and let a
         later draw pick it up. */
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /**
     * Re-sync if the element's box has drifted from the backing store.
     *
     * ResizeObserver notifications are delivered with the rendering steps, so
     * anything that stalls those (a backgrounded tab, a throttled frame loop)
     * can leave the backing store sized for a previous viewport — and the
     * scene then draws at the wrong scale and position. Checking here makes
     * the canvas self-healing instead of dependent on observer timing.
     */
    const syncSize = () => {
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
    };

    /* Straight orthographic front view — no yaw, no pitch, ever. */
    let unit = 1;
    let originX = 0;
    let originY = 0;
    const sx = (x: number) => originX + x * unit;
    const sy = (y: number) => originY - y * unit;
    const lw = (w: number) => Math.max(0.75, w * unit * 0.55);

    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: Rgb,
      stroke: number,
      fill: number,
      radius = 0,
      strokeW = 1.5,
    ) => {
      ctx.beginPath();
      const px = sx(x);
      const py = sy(y + h);
      const pw = w * unit;
      const ph = h * unit;
      if (radius > 0 && "roundRect" in ctx) ctx.roundRect(px, py, pw, ph, radius * unit);
      else ctx.rect(px, py, pw, ph);
      if (fill > 0) {
        ctx.fillStyle = rgba(color, fill);
        ctx.fill();
      }
      if (stroke > 0) {
        ctx.strokeStyle = rgba(color, stroke);
        ctx.lineWidth = lw(strokeW);
        ctx.stroke();
      }
    };

    const circle = (
      cx: number,
      cy: number,
      r: number,
      color: Rgb,
      stroke: number,
      fill = 0,
      strokeW = 1.4,
    ) => {
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), r * unit, 0, Math.PI * 2);
      if (fill > 0) {
        ctx.fillStyle = rgba(color, fill);
        ctx.fill();
      }
      if (stroke > 0) {
        ctx.strokeStyle = rgba(color, stroke);
        ctx.lineWidth = lw(strokeW);
        ctx.stroke();
      }
    };

    const seg = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: Rgb,
      alpha: number,
      w = 1,
    ) => {
      ctx.beginPath();
      ctx.moveTo(sx(x1), sy(y1));
      ctx.lineTo(sx(x2), sy(y2));
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = lw(w);
      ctx.stroke();
    };

    const label = (
      text: string,
      x: number,
      y: number,
      size: number,
      color: Rgb,
      alpha: number,
      align: CanvasTextAlign = "left",
    ) => {
      const px = size * unit;
      if (px < 5) return; // below this it's mud, not detail
      ctx.font = `${px}px ui-monospace, "SFMono-Regular", monospace`;
      ctx.fillStyle = rgba(color, alpha);
      ctx.textBaseline = "middle";
      ctx.textAlign = align;
      ctx.fillText(text, sx(x), sy(y));
      ctx.textAlign = "left";
    };

    /** Arrowhead for the dimension callouts. */
    const arrow = (x: number, y: number, dir: "up" | "down" | "left" | "right", color: Rgb) => {
      const a = 3.2;
      ctx.beginPath();
      if (dir === "up" || dir === "down") {
        const s = dir === "up" ? 1 : -1;
        ctx.moveTo(sx(x), sy(y));
        ctx.lineTo(sx(x - a * 0.55), sy(y - s * a));
        ctx.lineTo(sx(x + a * 0.55), sy(y - s * a));
      } else {
        const s = dir === "right" ? 1 : -1;
        ctx.moveTo(sx(x), sy(y));
        ctx.lineTo(sx(x - s * a), sy(y - a * 0.55));
        ctx.lineTo(sx(x - s * a), sy(y + a * 0.55));
      }
      ctx.closePath();
      ctx.fillStyle = rgba(color, 0.75);
      ctx.fill();
    };

    /**
     * Engineering dimension callout — extension lines, arrowheads, and a
     * measurement. This is what makes the drawing read as a deliberate
     * technical illustration rather than a rough wireframe, and it's the
     * right register for a CAD product.
     */
    const dimensionV = (x: number, y0: number, y1: number, text: string, color: Rgb) => {
      seg(x, y0, x, y1, color, 0.4);
      arrow(x, y0, "down", color);
      arrow(x, y1, "up", color);
      seg(x - 3, y0, x + 3, y0, color, 0.35);
      seg(x - 3, y1, x + 3, y1, color, 0.35);
      label(text, x - 5, (y0 + y1) / 2, 7, color, 0.75, "right");
    };

    const dimensionH = (y: number, x0: number, x1: number, text: string, color: Rgb) => {
      seg(x0, y, x1, y, color, 0.4);
      arrow(x0, y, "left", color);
      arrow(x1, y, "right", color);
      seg(x0, y - 3, x0, y + 3, color, 0.35);
      seg(x1, y - 3, x1, y + 3, color, 0.35);
      label(text, (x0 + x1) / 2, y - 7, 7, color, 0.75, "center");
    };

    const draw = (now: number) => {
      syncSize();
      /* Nothing to draw into yet — keep the loop alive and try next frame. */
      if (width === 0 || height === 0) {
        if (running && !reduceMotion) frame = requestAnimationFrame(draw);
        return;
      }
      const elapsed = reduceMotion ? BUILD_SECONDS * 1000 : now - startedAt;
      const cycle = BUILD_SECONDS + 3;
      const build = reduceMotion ? 1 : Math.min(1, ((elapsed / 1000) % cycle) / BUILD_SECONDS);
      const spin = reduceMotion
        ? 0.9
        : ((elapsed / 1000) % SPIN_SECONDS) * ((Math.PI * 2) / SPIN_SECONDS);

      ctx.clearRect(0, 0, width, height);

      /* Breakpoints come from the VIEWPORT, not the canvas box. The canvas is
         inset by the scrollbar, so canvas-width breakpoints disagree with the
         CSS `lg:`/`md:` ones by a few pixels — which silently flips the
         machine into the wrong layout right at 1024. */
      const vw = window.innerWidth;
      const wide = vw >= 1024;
      const medium = !wide && vw >= 768;

      /* Wide layouts draw dimension callouts, which sit outside the machine —
         reserve that space in the fit box so they can't clip. */
      /* Derived from the machine, not hardcoded — the callouts sit a fixed
         distance off the base, so they must move when the base width does. */
      const bbox = wide
        ? {
            left: -M.baseW / 2 - 56, // dimension line at -22, plus its label
            right: BBOX.right,
            top: BBOX.top,
            bottom: -44, // horizontal callout at -26, plus its label
          }
        : BBOX;
      const modelH = bbox.top - bbox.bottom;
      const modelW = bbox.right - bbox.left;
      /* Narrow screens can't fit a full machine AND the whole copy block, so
         the machine shrinks and sits hard against the bottom edge — sized so
         the TREE specifically clears the CTA row, since the tree is the part
         worth seeing. */
      /* The tablet band only started being reached once breakpoints moved to
         viewport width (the canvas box is ~15px narrower, so 768 used to fall
         through to the narrow branch). Its numbers are tuned here for the
         first time: 0.44 put the canopy 11px into the CTA row. */
      const heightFrac = wide ? 0.88 : medium ? 0.36 : 0.32;
      /* Width is the binding constraint on wide layouts, so this is the dial
         that actually controls how broad the machine reads. */
      const widthFrac = wide ? 0.52 : 0.86;

      unit = Math.min((height * heightFrac) / modelH, (width * widthFrac) / modelW);
      /* Centre on the model's bounding box, not on x=0 — the side-mounted
         spool makes the machine asymmetric. */
      const bboxCx = (bbox.left + bbox.right) / 2;
      const anchorX = wide ? width * 0.7 : width * 0.5;
      originX = anchorX - bboxCx * unit;
      originY = wide
        ? height * 0.5 + ((bbox.top + bbox.bottom) / 2) * unit
        : height * 0.985;

      const built = Math.floor(build * LAYERS);
      const printed = (built / LAYERS) * M.printH;
      const detail = unit > 1.1; // only draw fine detail when it will read

      /* ==================================================== BASE + SCREEN */
      rect(-M.baseW / 2, 0, M.baseW, M.baseH, machine, 0.8, 0.18, 3);
      /* upper lip */
      seg(-M.baseW / 2 + 3, M.baseH - 5, M.baseW / 2 - 3, M.baseH - 5, machine, 0.4);

      /* Control screen */
      const scrX = -M.baseW / 2 + 22;
      const scrY = 10;
      const scrW = 104;
      const scrH = 28;
      rect(scrX, scrY, scrW, scrH, machine, 0.75, 0.28, 2);
      if (detail) {
        label("DripLink Core", scrX + 4, scrY + scrH - 5, 5.4, cream, 0.85);
        label("Printing...", scrX + 4, scrY + scrH - 13, 5, foliage, 0.9);
        /* progress bar reflecting the real build state */
        rect(scrX + 4, scrY + 6, scrW - 30, 4, machine, 0.55, 0.12, 1, 1);
        rect(scrX + 4, scrY + 6, (scrW - 30) * build, 4, foliage, 0, 0.9, 1);
        label(`${Math.round(build * 100)}%`, scrX + scrW - 22, scrY + 8, 5.4, cream, 0.9);
      }
      /* Knob, USB, feet */
      circle(scrX + scrW + 16, scrY + scrH / 2, 9, foliage, 0.9, 0.16, 1.8);
      circle(scrX + scrW + 16, scrY + scrH / 2, 4, foliage, 0.55, 0);
      seg(scrX + scrW + 16, scrY + scrH / 2 + 4, scrX + scrW + 16, scrY + scrH / 2 + 8.5, foliage, 0.9, 1.4);
      rect(scrX + scrW + 34, scrY + 8, 10, 5, machine, 0.6, 0.14, 1);
      for (const s of [-1, 1]) rect(s * (M.baseW / 2 - 18) - 6, -9, 12, 9, machine, 0.65, 0.2, 1.5);

      /* ========================================================= UPRIGHTS */
      for (const s of [-1, 1]) {
        const x = s * M.postX - M.postW / 2;
        rect(x, M.baseH, M.postW, M.frameTop - M.baseH, machine, 0.85, 0.16, 2);
        if (detail) {
          /* aluminium extrusion channels */
          seg(x + M.postW * 0.32, M.baseH + 4, x + M.postW * 0.32, M.frameTop - 4, machine, 0.3);
          seg(x + M.postW * 0.68, M.baseH + 4, x + M.postW * 0.68, M.frameTop - 4, machine, 0.3);
          /* corner bolts */
          circle(s * M.postX, M.baseH + 8, 2.2, machine, 0.5);
          circle(s * M.postX, M.frameTop - 8, 2.2, machine, 0.5);
        }
        /* Z lead screw */
        seg(s * M.postX, M.baseH + 6, s * M.postX, M.frameTop - 6, cream, 0.16, 1.2);
      }

      /* ========================================================= CROSSBAR */
      rect(-M.postX - M.postW / 2, M.frameTop, M.postX * 2 + M.postW, M.barH, machine, 0.85, 0.2, 2);
      if (detail) {
        /* DripLink droplet mark + wordmark, as on the reference machine */
        const lx = -22;
        const ly = M.frameTop + M.barH / 2;
        ctx.beginPath();
        ctx.moveTo(sx(lx), sy(ly + 5));
        ctx.quadraticCurveTo(sx(lx + 4.5), sy(ly), sx(lx), sy(ly - 5));
        ctx.quadraticCurveTo(sx(lx - 4.5), sy(ly), sx(lx), sy(ly + 5));
        ctx.strokeStyle = rgba(cream, 0.9);
        ctx.lineWidth = lw(1.3);
        ctx.stroke();
        label("DripLink", lx + 8, ly, 8, cream, 0.9);
      }

      /* ============================================================== BED */
      const plateY = M.bedY;
      rect(-M.bedW / 2, plateY, M.bedW, 6, machine, 0.9, 0.3, 1);
      /* build surface grid — the only grid in the design, under the print */
      for (let i = 1; i < 12; i++) {
        const gx = -M.bedW / 2 + (i / 12) * M.bedW;
        seg(gx, plateY + 5.5, gx, plateY + 1, machine, 0.32);
      }
      /* Y carriage + levelling knobs + rails */
      rect(-M.bedW / 2 + 10, plateY - 7, M.bedW - 20, 7, machine, 0.6, 0.16, 1);
      if (detail) {
        for (const s of [-1, 1]) {
          circle(s * (M.bedW / 2 - 16), plateY - 10, 3, machine, 0.55, 0.1);
        }
        seg(-M.bedW / 2 + 4, plateY - 9, M.bedW / 2 - 4, plateY - 9, machine, 0.28);
      }

      /* ============================================== X GANTRY + RAILS */
      /* Derived from the layer being deposited, not a standalone offset.
         The two were computed independently before, which left the nozzle a
         constant 24 units BELOW the top of the print — buried inside the tree
         instead of riding on it. Anchoring the gantry to the top layer plus
         the nozzle drop makes the tip land exactly on the layer it's laying. */
      const topLayerY = M.bedY + 6 + printed;
      const gantryY = topLayerY + NOZZLE_DROP;
      rect(-M.postX, gantryY, M.postX * 2, 10, machine, 0.9, 0.24, 1.5);
      if (detail) {
        /* twin linear rails and the belt run */
        seg(-M.postX + 3, gantryY + 8, M.postX - 3, gantryY + 8, machine, 0.45);
        seg(-M.postX + 3, gantryY + 2, M.postX - 3, gantryY + 2, machine, 0.45);
        for (let i = 0; i < 26; i++) {
          const bx = -M.postX + 5 + (i / 26) * (M.postX * 2 - 10);
          seg(bx, gantryY + 5.2, bx + 1.4, gantryY + 5.2, cream, 0.28, 1);
        }
        /* motor block left, idler pulley right */
        rect(-M.postX - 2, gantryY - 3, 12, 16, machine, 0.7, 0.2, 1);
        circle(M.postX - 4, gantryY + 5, 5, machine, 0.7, 0.14);
      }

      /* ======================================================= PRINT HEAD */
      const headX = reduceMotion ? -20 : Math.sin((elapsed / 1000) * 2.4) * (M.bedW * 0.33);
      /* carriage backplate */
      rect(headX - 17, gantryY - 30, 34, 32, machine, 0.9, 0.26, 2);
      /* fan shroud + radial grille */
      rect(headX - 13, gantryY - 26, 26, 22, machine, 0.85, 0.3, 2);
      circle(headX, gantryY - 15, 8.5, machine, 0.85, 0.12);
      if (detail) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.3;
          seg(
            headX + Math.cos(a) * 3,
            gantryY - 15 + Math.sin(a) * 3,
            headX + Math.cos(a) * 8,
            gantryY - 15 + Math.sin(a) * 8,
            machine,
            0.5,
            0.8,
          );
        }
        circle(headX, gantryY - 15, 2.4, machine, 0.7, 0.3);
        /* heatsink fins above the shroud */
        for (let i = 0; i < 4; i++) {
          seg(headX - 7, gantryY - 2 + i * 2.4, headX + 7, gantryY - 2 + i * 2.4, machine, 0.4);
        }
        /* warning label */
        rect(headX + 6, gantryY - 25, 5, 5, foliage, 0.6, 0.2, 0.5);
      }
      /* hotend + nozzle taper */
      rect(headX - 5, gantryY - 34, 10, 8, machine, 0.85, 0.35, 1);
      ctx.beginPath();
      ctx.moveTo(sx(headX - 5), sy(gantryY - 34));
      ctx.lineTo(sx(headX + 5), sy(gantryY - 34));
      ctx.lineTo(sx(headX), sy(gantryY - 42));
      ctx.closePath();
      ctx.fillStyle = rgba(cream, 0.9);
      ctx.fill();

      /* ================================================== CABLE CHAIN */
      if (detail) {
        const links = 16;
        for (let i = 0; i <= links; i++) {
          const k = i / links;
          const cxp = headX + (M.postX * 0.15 - headX) * k;
          const cyp =
            gantryY + 8 + Math.sin(k * Math.PI) * 26 + (M.frameTop - gantryY - 8) * k * k;
          rect(cxp - 2, cyp - 1.6, 4, 3.2, machine, 0.55, 0.18, 0.6, 1);
        }
      }

      /* ============================================================ TREE */
      const treeBase = plateY + 6;
      const cosS = Math.cos(spin);
      const sinS = Math.sin(spin);

      for (let i = 0; i < built; i++) {
        const t = i / (LAYERS - 1);
        const y = treeBase + t * M.printH;
        const heat = Math.max(0, 1 - (built - i) / 7);

        const slices = crossSections(t)
          .map((s) => ({
            ...s,
            rx: s.cx * cosS - s.cz * sinS,
            rz: s.cx * sinS + s.cz * cosS,
          }))
          .sort((a, b) => a.rz - b.rz);

        for (const s of slices) {
          const base = s.bark ? bark : foliage;
          const color = mix(base, cream, heat * heat);
          const depth = 0.62 + 0.38 * ((s.rz + 0.4) / 0.8);
          const alpha = Math.min(1, (0.52 + 0.48 * heat) * depth);
          const halfW = s.r * M.printH * 0.98;
          ctx.beginPath();
          ctx.moveTo(sx(s.rx * M.printH * 0.98 - halfW), sy(y));
          ctx.lineTo(sx(s.rx * M.printH * 0.98 + halfW), sy(y));
          ctx.strokeStyle = rgba(color, alpha);
          ctx.lineCap = "round";
          ctx.lineWidth = Math.max(1.4, (M.printH / LAYERS) * unit * 1.3);
          ctx.stroke();
        }
      }
      ctx.lineCap = "butt";

      /* molten bead at the nozzle */
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = rgba(cream, 1);
      ctx.fillStyle = rgba(cream, 1);
      ctx.beginPath();
      ctx.arc(sx(headX), sy(gantryY - 43), Math.max(1.8, 2.4 * unit * 0.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* ================================================ SPOOL (side arm) */
      /* mounting arm off the right upright */
      rect(M.postX, M.spool.y - 4, M.spool.x - M.postX - 8, 8, machine, 0.7, 0.2, 1);
      circle(M.spool.x, M.spool.y, M.spool.r, machine, 0.85, 0.1, 1.8);
      circle(M.spool.x, M.spool.y, M.spool.r * 0.32, machine, 0.7, 0.22);
      circle(M.spool.x, M.spool.y, M.spool.r * 0.12, machine, 0.8, 0.4);
      if (detail) {
        /* filament windings */
        for (let i = 0; i < 5; i++) {
          circle(M.spool.x, M.spool.y, M.spool.r * (0.42 + i * 0.11), foliage, 0.3, 0, 0.8);
        }
      }
      /* filament run: spool → top of frame → down to the head */
      ctx.beginPath();
      ctx.moveTo(sx(M.spool.x - M.spool.r * 0.7), sy(M.spool.y + M.spool.r * 0.7));
      ctx.quadraticCurveTo(
        sx(M.postX + 14),
        sy(M.frameTop + 26),
        sx(headX + 6),
        sy(gantryY + 4),
      );
      ctx.strokeStyle = rgba(foliage, 0.5);
      ctx.lineWidth = lw(1.4);
      ctx.stroke();

      /* ============================================ DIMENSION CALLOUTS ===
         Only on wide layouts — below that there isn't room for them to read,
         and half-legible measurements are worse than none. */
      if (wide && detail) {
        dimensionV(-M.baseW / 2 - 22, 0, M.frameTop + M.barH, "380mm", machine);
        dimensionH(-26, -M.baseW / 2, M.baseW / 2, "360mm", machine);
        /* build-volume callout on the printed part itself */
        seg(M.bedW / 2 + 4, treeBase, M.bedW / 2 + 14, treeBase, machine, 0.3);
        seg(M.bedW / 2 + 4, treeBase + M.printH, M.bedW / 2 + 14, treeBase + M.printH, machine, 0.3);
        dimensionV(M.bedW / 2 + 26, treeBase, treeBase + M.printH, "190mm", machine);
      }

      if (running && !reduceMotion) frame = requestAnimationFrame(draw);
    };

    /* Paint frame zero synchronously — rAF never fires in a background tab. */
    resize();
    draw(performance.now());
    if (!reduceMotion) frame = requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running && !reduceMotion) {
          running = true;
          startedAt = performance.now() - HEAD_START;
          frame = requestAnimationFrame(draw);
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { threshold: 0 },
    );
    visibility.observe(canvas);

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!reduceMotion) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const themeObserver = new MutationObserver(() => {
      const next = getComputedStyle(document.documentElement);
      cream = readRgb(next, "--accent", cream);
      foliage = readRgb(next, "--accent-2", foliage);
      machine = readRgb(next, "--machine", machine);
      bark = readRgb(next, "--bark", bark);
      draw(performance.now());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
