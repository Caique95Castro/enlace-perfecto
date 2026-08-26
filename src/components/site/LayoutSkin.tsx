import type { SkinId } from "@/lib/layout-presets";
import { cn } from "@/lib/utils";

/**
 * Camada decorativa dos "Layouts prontos". Puramente visual e opcional: quando o casal
 * nunca aplicou um modelo (`skin === "none"`), nada é renderizado e o site continua
 * exatamente como antes. Todas as decorações são SVG/CSS (sem imagens externas),
 * posicionadas de forma absoluta e reduzidas no mobile para não causar overflow.
 */

export function skinRootClass(skin: SkinId): string {
  switch (skin) {
    case "botanical":
      return "site-skin-paper";
    case "romantic":
      return "site-skin-romantic";
    case "editorial":
      return "site-skin-editorial";
    case "classic":
      return "site-skin-classic";
    default:
      return "";
  }
}

export function SkinBackdrop({ skin }: { skin: SkinId }) {
  if (skin === "none" || skin === "minimal") return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {skin === "botanical" ? <BotanicalDecor /> : null}
      {skin === "romantic" ? <RomanticDecor /> : null}
      {skin === "editorial" ? <EditorialDecor /> : null}
      {skin === "classic" ? <ClassicDecor /> : null}
    </div>
  );
}

/** Divisor decorativo exibido entre as seções conforme o estilo escolhido. */
export function SkinDivider({ skin, className }: { skin: SkinId; className?: string }) {
  if (skin === "none") return null;
  return (
    <div aria-hidden className={cn("flex justify-center py-2 opacity-60", className)}>
      {skin === "botanical" || skin === "romantic" ? (
        <svg width="120" height="18" viewBox="0 0 120 18" fill="none">
          <path
            d="M2 9h34M84 9h34"
            stroke="var(--site-primary)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M60 2c5 3 8 5 8 7s-3 4-8 7c-5-3-8-5-8-7s3-4 8-7Z"
            stroke="var(--site-primary)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      ) : skin === "classic" ? (
        <svg width="140" height="14" viewBox="0 0 140 14" fill="none">
          <path d="M0 7h56M84 7h56" stroke="var(--site-secondary)" strokeWidth="1" />
          <circle cx="70" cy="7" r="4" stroke="var(--site-secondary)" strokeWidth="1" fill="none" />
        </svg>
      ) : (
        <span className="h-px w-24 bg-current opacity-30" />
      )}
    </div>
  );
}

function Leaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 160" className={className} style={style} fill="none">
      <path
        d="M50 158C50 100 20 70 20 40 20 18 34 4 50 2c16 2 30 16 30 38 0 30-30 60-30 118Z"
        fill="var(--site-primary)"
        opacity="0.18"
      />
      <path d="M50 156V8" stroke="var(--site-primary)" strokeWidth="1.2" opacity="0.35" />
      {[30, 55, 80, 105].map((y) => (
        <g key={y}>
          <path
            d={`M50 ${y} C36 ${y - 8} 30 ${y - 14} 26 ${y - 22}`}
            stroke="var(--site-primary)"
            strokeWidth="1"
            opacity="0.3"
          />
          <path
            d={`M50 ${y} C64 ${y - 8} 70 ${y - 14} 74 ${y - 22}`}
            stroke="var(--site-primary)"
            strokeWidth="1"
            opacity="0.3"
          />
        </g>
      ))}
    </svg>
  );
}

function Butterfly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="none">
      <g stroke="var(--site-primary)" strokeWidth="1.2" opacity="0.45">
        <path d="M60 50C46 18 20 12 14 26c-6 14 12 30 46 24Z" fill="var(--site-primary)" fillOpacity="0.1" />
        <path d="M60 50C74 18 100 12 106 26c6 14-12 30-46 24Z" fill="var(--site-primary)" fillOpacity="0.1" />
        <path d="M60 50C50 76 32 88 26 78c-6-10 8-24 34-28Z" fill="var(--site-primary)" fillOpacity="0.08" />
        <path d="M60 50C70 76 88 88 94 78c6-10-8-24-34-28Z" fill="var(--site-primary)" fillOpacity="0.08" />
        <path d="M60 44v20" />
      </g>
    </svg>
  );
}

function Blob({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} fill="none">
      <path
        d="M43 25c28-16 66-9 92 9 26 18 40 47 33 74-7 27-35 52-68 60-33 8-71-1-88-24-17-23-13-60 3-85 6-10 14-24 28-34Z"
        fill="var(--site-secondary)"
        opacity="0.35"
      />
    </svg>
  );
}

function BotanicalDecor() {
  return (
    <>
      <Blob className="absolute -left-20 top-10 w-64 blur-[1px] sm:w-96" />
      <Blob className="absolute -right-24 top-[45%] w-56 blur-[1px] sm:w-80" />
      <Leaf className="absolute -left-6 top-24 w-16 -rotate-12 sm:w-28" />
      <Leaf className="absolute -right-4 top-[30%] w-14 rotate-[160deg] sm:w-24" />
      <Leaf className="absolute -left-4 bottom-24 hidden w-24 rotate-[25deg] sm:block" />
      <Butterfly className="absolute right-6 top-[18%] w-14 animate-[pulse_5s_ease-in-out_infinite] sm:w-20" />
      <Butterfly className="absolute left-8 bottom-[15%] hidden w-16 animate-[pulse_7s_ease-in-out_infinite] sm:block" />
    </>
  );
}

function RomanticDecor() {
  return (
    <>
      <Blob className="absolute -left-16 top-16 w-56 sm:w-80" />
      <Blob className="absolute -right-20 bottom-24 w-48 sm:w-72" />
      <svg
        viewBox="0 0 120 120"
        className="absolute right-4 top-24 w-16 opacity-60 sm:w-24"
        fill="none"
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="60"
            cy="34"
            rx="14"
            ry="26"
            transform={`rotate(${deg} 60 60)`}
            stroke="var(--site-primary)"
            strokeWidth="1"
            fill="var(--site-primary)"
            fillOpacity="0.08"
          />
        ))}
      </svg>
      <svg
        viewBox="0 0 120 120"
        className="absolute -left-2 bottom-32 hidden w-20 opacity-60 sm:block"
        fill="none"
      >
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="60"
            cy="34"
            rx="16"
            ry="26"
            transform={`rotate(${deg} 60 60)`}
            stroke="var(--site-primary)"
            strokeWidth="1"
            fill="var(--site-primary)"
            fillOpacity="0.08"
          />
        ))}
      </svg>
    </>
  );
}

function EditorialDecor() {
  return (
    <>
      <div className="absolute left-6 top-0 h-full w-px bg-current opacity-10 sm:left-14" />
      <div className="absolute right-6 top-0 hidden h-full w-px bg-current opacity-10 sm:block" />
    </>
  );
}

function ClassicDecor() {
  return (
    <>
      <div className="absolute inset-3 hidden border border-current opacity-[0.08] sm:block" />
      <svg viewBox="0 0 100 100" className="absolute left-4 top-4 hidden w-14 opacity-40 sm:block" fill="none">
        <path d="M2 40C2 18 18 2 40 2" stroke="var(--site-secondary)" strokeWidth="1.5" />
        <circle cx="40" cy="2" r="2" fill="var(--site-secondary)" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute right-4 top-4 hidden w-14 rotate-90 opacity-40 sm:block" fill="none">
        <path d="M2 40C2 18 18 2 40 2" stroke="var(--site-secondary)" strokeWidth="1.5" />
        <circle cx="40" cy="2" r="2" fill="var(--site-secondary)" />
      </svg>
    </>
  );
}
