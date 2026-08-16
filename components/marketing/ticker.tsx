/**
 * Infinite horizontal ticker.
 *
 * The track holds the items twice and translates exactly -50%, so the loop is
 * seamless with no JS. The whole strip is aria-hidden: it's decorative
 * repetition, and a screen reader reading the same list twice is noise.
 */
export function Ticker({ items }: { items: string[] }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex overflow-hidden border-y border-line py-4 select-none"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <div className="marquee-track flex w-max shrink-0 items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {items.map((item, index) => (
              <span key={`${copy}-${index}`} className="flex items-center">
                <span className="px-6 font-mono text-xs tracking-widest text-faint uppercase">
                  {item}
                </span>
                <span className="size-1 rotate-45 bg-accent/40" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
