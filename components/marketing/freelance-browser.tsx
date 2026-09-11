"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Star,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Cpu,
  Layers,
  Wrench,
  Shapes,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type Freelancer = {
  id: string;
  name: string;
  handle: string;
  title: string;
  avatarText: string;
  badge?: string;
  category: "mechanical" | "enclosures" | "organic" | "dfam" | "reverse";
  categoryLabel: string;
  bio: string;
  rating: number;
  completedJobs: number;
  startingRate: string;
  turnaround: string;
  software: string[];
  skills: string[];
  recentParts: string[];
};

const CATEGORIES = [
  { id: "all", label: "All Specialists" },
  { id: "mechanical", label: "Mechanical CAD", icon: Wrench },
  { id: "enclosures", label: "Enclosures & IoT", icon: Cpu },
  { id: "organic", label: "Organic & Sculpting", icon: Shapes },
  { id: "dfam", label: "DfAM & Functional", icon: Layers },
  { id: "reverse", label: "Reverse Engineering", icon: SlidersHorizontal },
] as const;

const FREELANCERS: Freelancer[] = [
  {
    id: "f1",
    name: "Arjun Verma",
    handle: "@arjun_cad",
    title: "Senior Mechanical & Parametric CAD Engineer",
    avatarText: "AV",
    badge: "Top Rated",
    category: "mechanical",
    categoryLabel: "Mechanical CAD",
    bio: "Ex-robotics engineer specializing in precision kinematics, gearboxes, linkage mechanisms, and tight-tolerance FDM/SLA designs.",
    rating: 4.98,
    completedJobs: 54,
    startingRate: "₹1,400 / hr",
    turnaround: "2–4 days",
    software: ["SolidWorks", "LeaFF OS", "Fusion 360"],
    skills: ["Planetary Gears", "Bearings & Press-fits", "Tolerance ±0.05mm", "Stress Analysis"],
    recentParts: ["Dual-axis cycloidal gearbox", "Bionic robotic gripper", "Linear rail slider"],
  },
  {
    id: "f2",
    name: "Priya Sundaram",
    handle: "@priyadesign",
    title: "Electronics Enclosure & IoT Product Designer",
    avatarText: "PS",
    badge: "Vetted Specialist",
    category: "enclosures",
    categoryLabel: "Enclosures & IoT",
    bio: "Specializing in IP54/IP65 weather-resistant housings, snap-fit PCB enclosures, heat-sink ducting, and production-ready 3D prints.",
    rating: 4.95,
    completedJobs: 42,
    startingRate: "₹1,200 / hr",
    turnaround: "2–3 days",
    software: ["Fusion 360", "LeaFF OS", "Rhino 3D"],
    skills: ["Snap-fit Geometry", "O-ring Seals", "Threaded Inserts", "PCB Clearance Check"],
    recentParts: ["ESP32 sensor pod with gland seal", "Rugged handheld terminal", "DIN-rail controller case"],
  },
  {
    id: "f3",
    name: "Vikram Malhotra",
    handle: "@vikram_sculpts",
    title: "Organic 3D Character & Miniature Sculptor",
    avatarText: "VM",
    badge: "Resin & FDM Expert",
    category: "organic",
    categoryLabel: "Organic & Sculpting",
    bio: "Digital sculptor crafting high-detail tabletop miniatures, cosplay props, and ergonomic organic grips with zero-island overhang optimization.",
    rating: 5.0,
    completedJobs: 67,
    startingRate: "₹1,500 / hr",
    turnaround: "3–5 days",
    software: ["ZBrush", "Blender", "LeaFF OS"],
    skills: ["High-Poly Sculpting", "Keying & Hollowing", "Support-Free FDM", "Resin Orientation"],
    recentParts: ["Modular tabletop dragon kit", "Ergonomic game controller grip", "1:1 prop blaster"],
  },
  {
    id: "f4",
    name: "Ananya Rao",
    handle: "@ananya_dfam",
    title: "Design for Additive Manufacturing (DfAM) Specialist",
    avatarText: "AR",
    badge: "Lightweighting",
    category: "dfam",
    categoryLabel: "DfAM & Functional",
    bio: "Focuses on topology optimization, lattice infill generation, and material transition engineering to reduce weight while preserving yield strength.",
    rating: 4.92,
    completedJobs: 31,
    startingRate: "₹1,800 / hr",
    turnaround: "3–5 days",
    software: ["nTop", "SolidWorks", "LeaFF OS"],
    skills: ["Topology Optimization", "Conformal Lattices", "TPU Energy Absorption", "Anisotropic Compensation"],
    recentParts: ["Drone motor arm bracket", "Orthotic insole with variable lattice", "Heat exchanger jacket"],
  },
  {
    id: "f5",
    name: "Rohan Kulkarni",
    handle: "@rohan_scan2cad",
    title: "Reverse Engineering & Scan-to-CAD Modelers",
    avatarText: "RK",
    badge: "Precision Matching",
    category: "reverse",
    categoryLabel: "Reverse Engineering",
    bio: "Converts 3D scan meshes and point clouds into clean, feature-based parametric CAD solids with measured fit checks.",
    rating: 4.97,
    completedJobs: 39,
    startingRate: "₹1,600 / hr",
    turnaround: "2–4 days",
    software: ["Geomagic Design X", "SolidWorks", "LeaFF OS"],
    skills: ["Mesh-to-NURBS", "Broken Part Reconstruction", "Caliper & Scan Calibration", "GOM Inspect"],
    recentParts: ["Discontinued vintage automotive clip", "Impeller blade replacement", "Camera lens adapter flange"],
  },
  {
    id: "f6",
    name: "Siddharth Nair",
    handle: "@sid_industrial",
    title: "Industrial & Consumer Product Prototyper",
    avatarText: "SN",
    badge: "Vetted Specialist",
    category: "mechanical",
    categoryLabel: "Mechanical CAD",
    bio: "Takes rough napkin sketches to factory-viable functional 3D models. Skilled in wall thickness verification, draft angles, and assembly fits.",
    rating: 4.94,
    completedJobs: 48,
    startingRate: "₹1,350 / hr",
    turnaround: "2–3 days",
    software: ["SolidWorks", "KeyShot", "LeaFF OS"],
    skills: ["Consumer Ergonomics", "Modular Assemblies", "DFM / DFA", "Multi-part Fit Check"],
    recentParts: ["Coffee tamper pressure calibrator", "Foldable laptop stand hinge", "Desk cable organizer rail"],
  },
];

export function FreelanceBrowser() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return FREELANCERS.filter((f) => {
      const matchesCategory =
        selectedCategory === "all" || f.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.bio.toLowerCase().includes(q) ||
        f.skills.some((s) => s.toLowerCase().includes(q)) ||
        f.software.some((s) => s.toLowerCase().includes(q)) ||
        f.recentParts.some((p) => p.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-8">
      {/* Search and Category Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by skill, part type, or tool (e.g. Snap-fit, SolidWorks, Enclosure, Drone)..."
            className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface pr-4 pl-10 text-sm text-fg placeholder:text-faint transition-colors focus:border-line-strong focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-contrast shadow-sm"
                    : "border border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {cat.id !== "all" && <cat.icon className="size-3.5" aria-hidden="true" />}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Count and Quick Filter Summary */}
      <div className="flex items-center justify-between border-b border-line pb-3 text-xs text-muted">
        <span>
          Showing <span className="font-mono font-medium text-fg">{filtered.length}</span> vetted{" "}
          {filtered.length === 1 ? "specialist" : "specialists"}
        </span>
        <span className="flex items-center gap-1.5 text-accent-2 font-mono">
          <ShieldCheck className="size-3.5" />
          Print-Ready Tolerance Guarantee
        </span>
      </div>

      {/* Freelancers Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line p-12 text-center">
          <p className="text-base text-fg font-medium">No specialists match your search.</p>
          <p className="mt-1 text-sm text-muted">
            Try adjusting your query or resetting category filters to see all available engineers.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((freelancer) => (
            <Card
              key={freelancer.id}
              className="flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-xl hover:shadow-black/25"
            >
              <div className="flex flex-col gap-4">
                {/* Header: Avatar, Name, Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] border border-line bg-surface font-display text-sm font-semibold text-accent">
                      {freelancer.avatarText}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-medium text-fg text-base">
                          {freelancer.name}
                        </span>
                        <CheckCircle2
                          className="size-3.5 text-accent-2"
                          aria-label="Verified Specialist"
                        />
                      </div>
                      <span className="font-mono text-xs text-faint">
                        {freelancer.handle}
                      </span>
                    </div>
                  </div>

                  {freelancer.badge && (
                    <span className="rounded-full bg-accent-muted px-2.5 py-0.5 font-mono text-[0.6875rem] font-medium text-accent">
                      {freelancer.badge}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-display text-sm font-semibold text-fg">
                    {freelancer.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-pretty text-muted">
                    {freelancer.bio}
                  </p>
                </div>

                {/* Rating & Rate Stats Bar */}
                <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-control)] border border-line bg-raised/50 p-2.5 text-center">
                  <div>
                    <span className="block font-mono text-[0.6875rem] text-faint uppercase">
                      Rating
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs font-semibold text-fg">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {freelancer.rating}
                    </span>
                  </div>
                  <div className="border-x border-line">
                    <span className="block font-mono text-[0.6875rem] text-faint uppercase">
                      Jobs
                    </span>
                    <span className="mt-0.5 block font-mono text-xs font-semibold text-fg">
                      {freelancer.completedJobs}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[0.6875rem] text-faint uppercase">
                      Starting
                    </span>
                    <span className="mt-0.5 block font-mono text-xs font-semibold text-accent">
                      {freelancer.startingRate}
                    </span>
                  </div>
                </div>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {freelancer.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-surface px-2 py-0.5 text-[0.6875rem] text-muted border border-line"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Recent Projects Pill */}
                <div className="mt-1 border-t border-line/60 pt-3">
                  <span className="block font-mono text-[0.6875rem] text-faint uppercase tracking-wider mb-1.5">
                    Recent custom parts
                  </span>
                  <ul className="flex flex-col gap-1 text-xs text-muted">
                    {freelancer.recentParts.slice(0, 2).map((part) => (
                      <li key={part} className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-accent-2" />
                        <span className="truncate">{part}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
                <ButtonLink
                  href="/signup?role=creator"
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  Request Quote
                </ButtonLink>
                <ButtonLink
                  href={`/contact?specialist=${freelancer.id}`}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Contact
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
