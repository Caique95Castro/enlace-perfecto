import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, muted }: { className?: string; muted?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          muted ? "bg-secondary text-primary" : "bg-primary text-primary-foreground",
        )}
      >
        <Heart className="size-4" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Meu Casamento</span>
    </Link>
  );
}
