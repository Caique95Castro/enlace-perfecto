import { useEffect, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type GalleryPhoto = { id: string; url: string; caption: string | null };

const RATIOS: Record<string, string> = {
  quadrado: "aspect-square",
  retrato: "aspect-[3/4]",
  paisagem: "aspect-[16/9]",
};

/** Galeria em carrossel, com navegação, loop e autoplay opcionais. */
export function GalleryCarousel({
  photos,
  coupleName,
  perView = 1,
  ratio = "quadrado",
  loop = true,
  autoplay = false,
}: {
  photos: GalleryPhoto[];
  coupleName: string;
  perView?: number;
  ratio?: string;
  loop?: boolean;
  autoplay?: boolean;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !autoplay) return;
    const id = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 4000);
    return () => window.clearInterval(id);
  }, [api, autoplay]);

  const basis =
    perView >= 3 ? "sm:basis-1/3" : perView === 2 ? "sm:basis-1/2" : "basis-full";
  const aspect = RATIOS[ratio] ?? "aspect-square";

  return (
    <div className="relative">
      <Carousel setApi={setApi} opts={{ loop, align: "start" }} className="w-full">
        <CarouselContent>
          {photos.map((photo) => (
            <CarouselItem key={photo.id} className={cn("basis-full", basis)}>
              <figure className="overflow-hidden rounded-lg">
                <img
                  src={photo.url}
                  alt={photo.caption ?? `Foto de ${coupleName}`}
                  loading="lazy"
                  className={cn("w-full object-cover", aspect)}
                />
                {photo.caption ? (
                  <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                    {photo.caption}
                  </figcaption>
                ) : null}
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-1 sm:-left-4" />
        <CarouselNext className="right-1 sm:-right-4" />
      </Carousel>

      {photos.length > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Ir para a foto ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current ? "w-5 bg-current opacity-80" : "w-1.5 bg-current opacity-30",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
