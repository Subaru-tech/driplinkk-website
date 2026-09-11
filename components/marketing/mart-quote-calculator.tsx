"use client";

import { useState, useId } from "react";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Coins,
  FileCode,
  Gauge,
  Layers,
  Package,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface MaterialOption {
  id: string;
  name: string;
  type: string;
  costPerGram: number; // in INR
  baseRatePerHour: number; // in INR
  tolerance: string;
  density: number; // g/cm3
  color: string;
  tag: string;
}

const MATERIALS: MaterialOption[] = [
  {
    id: "pla",
    name: "PLA+ High Speed",
    type: "FDM / FFF",
    costPerGram: 2.2,
    baseRatePerHour: 80,
    tolerance: "±0.08 mm",
    density: 1.24,
    color: "#a9d26b",
    tag: "Prototyping & Fit Checks",
  },
  {
    id: "petg",
    name: "PETG Technical",
    type: "FDM / FFF",
    costPerGram: 2.8,
    baseRatePerHour: 100,
    tolerance: "±0.08 mm",
    density: 1.27,
    color: "#d9b45c",
    tag: "Waterproof & Chemical Safe",
  },
  {
    id: "abs",
    name: "ABS / ASA Engineered",
    type: "FDM / FFF",
    costPerGram: 3.2,
    baseRatePerHour: 120,
    tolerance: "±0.05 mm",
    density: 1.05,
    color: "#e28743",
    tag: "High Temp & Outdoor UV",
  },
  {
    id: "resin",
    name: "Tough Engineering Resin",
    type: "SLA / MSLA",
    costPerGram: 6.5,
    baseRatePerHour: 180,
    tolerance: "±0.025 mm",
    density: 1.18,
    color: "#76b5c5",
    tag: "Ultra-Fine Surface & Teeth",
  },
  {
    id: "nylon-cf",
    name: "Nylon PA12 Carbon Fiber",
    type: "Industrial FDM",
    costPerGram: 9.0,
    baseRatePerHour: 220,
    tolerance: "±0.05 mm",
    density: 1.15,
    color: "#869575",
    tag: "Metal Replacement Rigidity",
  },
];

const PRESETS = [
  {
    name: "Enclosure_Top_Cover.step",
    volumeCm3: 38,
    dimensions: "120 × 85 × 24 mm",
    recommendedMaterial: "petg",
    estimatedHours: 2.5,
  },
  {
    name: "Planetary_Gear_Set.stl",
    volumeCm3: 54,
    dimensions: "80 × 80 × 35 mm",
    recommendedMaterial: "nylon-cf",
    estimatedHours: 4.0,
  },
  {
    name: "Sensor_Mount_Bracket.3mf",
    volumeCm3: 22,
    dimensions: "65 × 45 × 18 mm",
    recommendedMaterial: "abs",
    estimatedHours: 1.5,
  },
];

export function MartQuoteCalculator() {
  const [selectedFile, setSelectedFile] = useState<string>(PRESETS[0].name);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("petg");
  const [infillDensity, setInfillDensity] = useState<number>(30); // %
  const [layerHeight, setLayerHeight] = useState<string>("0.20"); // mm
  const [quantity, setQuantity] = useState<number>(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputId = useId();

  const selectedMaterial =
    MATERIALS.find((m) => m.id === selectedMaterialId) ?? MATERIALS[0];

  // Weight computation: volume * density * (infill factor + skin shells)
  const effectiveInfillFactor = 0.25 + (infillDensity / 100) * 0.75;
  const partMassGrams = Math.round(
    selectedPreset.volumeCm3 * selectedMaterial.density * effectiveInfillFactor
  );

  // Print time factor based on layer height
  const layerTimeMultiplier = layerHeight === "0.12" ? 1.4 : layerHeight === "0.28" ? 0.75 : 1.0;
  const printHoursPerUnit =
    Math.round(selectedPreset.estimatedHours * layerTimeMultiplier * 10) / 10;
  const totalPrintHours = Math.round(printHoursPerUnit * quantity * 10) / 10;

  // Pricing calculation in INR (transparent breakdown)
  const materialCost = Math.round(partMassGrams * selectedMaterial.costPerGram * quantity);
  const machineTimeCost = Math.round(
    totalPrintHours * selectedMaterial.baseRatePerHour * 0.8
  );
  const basePrepAndQACost = 150; // Fixed pre-flight calibration & tolerance inspection
  const shippingFlatRate = 90; // Tracked domestic shipping

  const subtotal = materialCost + machineTimeCost + basePrepAndQACost;
  // Volume tier discount: 5% for 3+, 10% for 5+, 15% for 10+
  const discountPercent = quantity >= 10 ? 15 : quantity >= 5 ? 10 : quantity >= 3 ? 5 : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalEstimatedPrice = subtotal - discountAmount + shippingFlatRate;

  const handleSimulatedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file.name);
      setSelectedPreset({
        name: file.name,
        volumeCm3: 45,
        dimensions: "110 × 75 × 30 mm",
        recommendedMaterial: "petg",
        estimatedHours: 3.0,
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file.name);
      setSelectedPreset({
        name: file.name,
        volumeCm3: 45,
        dimensions: "110 × 75 × 30 mm",
        recommendedMaterial: "petg",
        estimatedHours: 3.0,
      });
    }
  };

  return (
    <div id="quote-estimator" className="flex flex-col gap-10">
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <span className="tech-label text-accent-2">
          INSTANT MULTI-VENDOR COMPARISON
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Compare Multi-Vendor Print Prices
        </h2>
        <p className="max-w-2xl text-sm text-muted sm:text-base">
          Upload any 3D file (.STL, .STEP, or .3MF) or pick a sample part. DripLink Mart
          automatically aggregates capacity across vetted regional print hubs to give you the lowest
          guaranteed vendor rate, ±0.05 mm tolerances, and tracked delivery.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Upload & Configuration (7 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* File Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleSimulatedDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
              isDragOver
                ? "border-accent bg-accent-muted/20"
                : "border-line bg-surface/40 hover:border-line-control hover:bg-surface/70"
            )}
          >
            <input
              type="file"
              id={fileInputId}
              accept=".stl,.step,.stp,.3mf,.obj"
              onChange={handleFileInput}
              className="sr-only"
            />
            <div className="flex size-14 items-center justify-center rounded-2xl border border-line bg-void text-accent">
              <Upload className="size-6" />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <label
                htmlFor={fileInputId}
                className="cursor-pointer font-display text-base font-semibold text-fg hover:underline"
              >
                Upload your 3D CAD or mesh file
              </label>
              <p className="text-xs text-muted">
                Drag and drop STL, STEP, STP, 3MF, or OBJ (Up to 150 MB)
              </p>
            </div>

            {/* Current Loaded File Details */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-line bg-void px-3 py-1.5 font-mono text-xs">
              <FileCode className="size-3.5 text-accent-2" />
              <span className="font-medium text-fg">{selectedFile}</span>
              <span className="text-faint">({selectedPreset.dimensions})</span>
            </div>

            {/* Quick Demo Presets */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="font-mono text-[11px] text-faint">Or test sample part:</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setSelectedFile(preset.name);
                    setSelectedPreset(preset);
                    setSelectedMaterialId(preset.recommendedMaterial);
                  }}
                  className={cn(
                    "rounded border px-2 py-0.5 font-mono text-[11px] transition-colors",
                    selectedFile === preset.name
                      ? "border-accent-2 bg-accent-2-muted text-accent-2"
                      : "border-line bg-surface text-muted hover:text-fg"
                  )}
                >
                  {preset.name.split(".")[0].replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Material Selection */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-faint">
                Select Manufacturing Material
              </label>
              <span className="font-mono text-xs text-muted">
                Tolerance: <strong className="text-fg">{selectedMaterial.tolerance}</strong>
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setSelectedMaterialId(mat.id)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                    selectedMaterialId === mat.id
                      ? "border-accent bg-surface ring-1 ring-accent"
                      : "border-line bg-surface/50 hover:bg-surface hover:border-line-control"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-display text-sm font-semibold text-fg">
                      {mat.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted">{mat.type}</span>
                  </div>
                  <span className="text-[11px] text-faint">{mat.tag}</span>
                  <div className="mt-1 flex w-full items-center justify-between font-mono text-[11px] text-muted border-t border-line/40 pt-1.5">
                    <span>Rate: ₹{mat.costPerGram}/g</span>
                    <span className="text-accent-2">{mat.tolerance}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Density & Quality Parameters */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Infill */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-3">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-fg">Infill Density</span>
                <span className="font-mono text-accent-2">{infillDensity}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                step="5"
                value={infillDensity}
                onChange={(e) => setInfillDensity(Number(e.target.value))}
                className="accent-accent h-1.5 w-full cursor-pointer rounded-lg bg-line"
              />
              <span className="text-[10px] text-faint">
                {infillDensity <= 25
                  ? "Standard cosmetic shell"
                  : infillDensity <= 60
                  ? "Functional mechanical"
                  : "Ultra solid / impact proof"}
              </span>
            </div>

            {/* Layer Height */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-3">
              <span className="text-xs font-medium text-fg">Layer Precision</span>
              <select
                value={layerHeight}
                onChange={(e) => setLayerHeight(e.target.value)}
                className="h-8 rounded border border-line-control bg-void px-2 font-mono text-xs text-fg focus:border-accent focus:outline-none"
              >
                <option value="0.12">0.12 mm (Ultra Detail)</option>
                <option value="0.20">0.20 mm (Standard Quality)</option>
                <option value="0.28">0.28 mm (Rapid Draft)</option>
              </select>
              <span className="text-[10px] text-faint">FDM / SLA layer slice</span>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-3">
              <span className="text-xs font-medium text-fg">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex size-8 items-center justify-center rounded border border-line bg-void text-fg hover:bg-raised font-mono text-sm"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono text-sm font-semibold text-fg">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex size-8 items-center justify-center rounded border border-line bg-void text-fg hover:bg-raised font-mono text-sm"
                >
                  +
                </button>
              </div>
              {quantity >= 3 && (
                <span className="font-mono text-[10px] text-accent-2">
                  {discountPercent}% volume discount applied
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Calculated Quote Card (5 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-accent/20 bg-gradient-to-b from-surface via-surface/80 to-void p-6 shadow-2xl lg:col-span-5 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <Printer className="size-5 text-accent-2" />
                <h3 className="font-display text-lg font-semibold text-fg">
                  Multi-Vendor Quote Breakdown
                </h3>
              </div>
              <span className="rounded-full border border-accent-2/30 bg-accent-2-muted px-2.5 py-0.5 font-mono text-[11px] text-accent-2">
                Best Vetted Hub Rate
              </span>
            </div>

            {/* Part Telemetry Stats */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-void/60 p-3 font-mono text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-faint uppercase">Estimated Weight</span>
                <span className="font-semibold text-fg">
                  ~{partMassGrams * quantity}g total ({partMassGrams}g/part)
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-faint uppercase">Total Print Time</span>
                <span className="font-semibold text-fg">~{totalPrintHours} machine hrs</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-faint uppercase">Vetted Tolerance</span>
                <span className="font-semibold text-accent-2">{selectedMaterial.tolerance}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-faint uppercase">Dispatch SLA</span>
                <span className="font-semibold text-fg">24–48 hours</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Material ({selectedMaterial.name} × {partMassGrams * quantity}g)</span>
                <span className="font-mono text-fg">₹{materialCost}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Machine Execution ({totalPrintHours} hrs)</span>
                <span className="font-mono text-fg">₹{machineTimeCost}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tolerance Inspection & G-Code Pre-flight</span>
                <span className="font-mono text-fg">₹{basePrepAndQACost}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tracked Domestic Shipping</span>
                <span className="font-mono text-fg">₹{shippingFlatRate}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between font-mono text-accent-2 border-t border-line/40 pt-2">
                  <span>Volume Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
            </div>

            {/* Total Price */}
            <div className="rounded-xl border border-line-control/60 bg-void/80 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-muted">Total Quoted Price</span>
                  <p className="text-[11px] text-faint">All-inclusive: print + QA + delivery</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-semibold text-accent">
                    ₹{totalEstimatedPrice}
                  </span>
                  <span className="block font-mono text-[11px] text-muted">
                    (₹{Math.round(totalEstimatedPrice / quantity)} / unit)
                  </span>
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div className="space-y-2 text-[11px] text-muted">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-accent-2" />
                <span>Reprint Guarantee: If tolerances don&apos;t hold, we reprint for free.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-accent-2" />
                <span>Auto-routed to the nearest verified printer hub for speed.</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="mt-8 flex flex-col gap-3">
            <ButtonLink
              href={`/signup?source=mart_quote&file=${encodeURIComponent(selectedFile)}&price=${totalEstimatedPrice}`}
              size="lg"
              className="w-full"
            >
              Order Print with Mart (₹{totalEstimatedPrice})
              <ArrowRight className="size-4" />
            </ButtonLink>
            <p className="text-center font-mono text-[11px] text-faint">
              One price up front • No hidden fees at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
