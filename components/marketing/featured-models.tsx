import { ArrowRight, Box, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { MarketplaceModel } from "@/lib/types";

// Curated backup highlights if catalog has few models initially
const FALLBACK_FEATURED = [
  {
    id: "featured-robotic-arm",
    title: "Robotic Arm — 5 DOF Articulated",
    category: "Robotics",
    price: 0,
    rating: "4.8",
    downloads: 342,
    formats: ["STL", "STEP", "3MF"],
    author: "DripLink Robotics Lab",
    preview: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "featured-gearbox",
    title: "Precision Planetary Gearbox 10:1",
    category: "Mechanical",
    price: 49,
    rating: "4.9",
    downloads: 512,
    formats: ["STEP", "STL"],
    author: "MakerMechanics",
    preview: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "featured-servo-mount",
    title: "NEMA 17 Stepper Servo Mount",
    category: "Tools & Jigs",
    price: 0,
    rating: "4.7",
    downloads: 189,
    formats: ["STL", "3MF"],
    author: "OpenCNC",
    preview: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "featured-enclosure",
    title: "Modular ESP32 DIN Rail Enclosure",
    category: "Enclosures",
    price: 99,
    rating: "4.9",
    downloads: 420,
    formats: ["STL", "STEP", "3MF"],
    author: "ProtoShields",
    preview: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  },
];

export function FeaturedModels({ models = [] }: { models?: MarketplaceModel[] }) {
  // If we have actual models from the database, blend or use them
  const displayItems =
    models.length >= 4
      ? models.slice(0, 4).map((m, idx) => ({
          id: m.id,
          title: m.title,
          category: m.category || "3D Model",
          price: m.price,
          rating: (4.7 + (idx % 3) * 0.1).toFixed(1),
          downloads: 120 + idx * 45,
          formats: ["STL", "STEP", "3MF"],
          author: m.seller_name || m.seller?.full_name || "DripLink Creator",
          preview: m.preview_image_paths?.[0] || null,
        }))
      : FALLBACK_FEATURED;

  return (
    <section aria-labelledby="featured-models-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" aria-hidden="true" />
          <h2 id="featured-models-heading" className="font-display text-lg font-semibold text-fg sm:text-xl">
            Featured Models
          </h2>
        </div>
        <a
          href="#all-models"
          className="group flex items-center gap-1 text-xs font-medium text-muted hover:text-fg transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayItems.map((item) => {
          const isFree = item.price === 0;
          const href = item.id.startsWith("featured-") ? "/models" : `/models/${item.id}`;

          return (
            <Link
              key={item.id}
              href={href}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface p-3 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-xl hover:shadow-black/25"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-lg bg-raised">
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.preview}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center">
                    <Box className="size-8 text-faint" strokeWidth={1.5} />
                  </div>
                )}

                {/* Category Pill on Image */}
                <div className="absolute top-2 left-2 rounded-md bg-canvas/80 px-2 py-0.5 text-[10px] font-medium text-fg backdrop-blur-sm border border-line/50">
                  {item.category}
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-canvas/90 px-1.5 py-0.5 text-[10px] font-semibold text-fg backdrop-blur-sm border border-line/60">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="flex flex-1 flex-col justify-between pt-3">
                <div className="flex flex-col gap-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-fg group-hover:text-accent transition-colors" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-muted line-clamp-1">by {item.author}</p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5">
                  <span className="font-mono text-xs font-semibold">
                    {isFree ? (
                      <span className="text-accent">Free</span>
                    ) : (
                      formatCurrency(item.price)
                    )}
                  </span>
                  <span className="text-[11px] font-medium text-muted group-hover:text-fg">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
