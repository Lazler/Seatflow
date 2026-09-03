import { cn } from "@/lib/utils";

// Die Marke ist das Wortmarke selbst — kein eigenständiges "SF"-Icon.
// "SeatFlow" in Inter Bold, gefolgt vom Koralle-Punkt an der Grundlinie.
const GROESSEN = {
  sm: "text-lg",       // Footer, kompakte Kontexte
  md: "text-[22px]",   // Nav-Rail, Marketing-Nav
  lg: "text-[32px]",   // Auth-Screens
  xl: "text-[56px]",   // Marketing-Footer, Poster
} as const;

export function Logo({ size = "md", className }: { size?: keyof typeof GROESSEN; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-baseline whitespace-nowrap font-bold leading-none tracking-tight text-foreground",
        GROESSEN[size],
        className
      )}
    >
      SeatFlow
      {/* Der Punkt sitzt wie ein Satzpunkt AUF der Grundlinie: Bei
          items-baseline liegt die Unterkante eines leeren inline-block genau
          dort. (self-end hätte ihn auf die Zeilen-Unterkante gedrückt, also in
          den Unterlängen-Bereich — der Punkt hing sichtbar zu tief.) */}
      <span className="ml-[0.08em] inline-block h-[0.2em] w-[0.2em] shrink-0 rounded-full bg-brand" aria-hidden="true" />
    </span>
  );
}
