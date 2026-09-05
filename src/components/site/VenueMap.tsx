import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin } from "lucide-react";
import { getLocationCoordinates } from "@/lib/location.functions";
import { cn } from "@/lib/utils";

export function VenueMap({
  address,
  latitude,
  longitude,
  heightClass,
}: {
  address: string;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  heightClass: string;
}) {
  const getCoordinates = useServerFn(getLocationCoordinates);
  const { data, isLoading } = useQuery({
    queryKey: ["location-coordinates", address, latitude, longitude],
    queryFn: () =>
      getCoordinates({
        data: {
          address,
          ...(latitude != null ? { latitude } : {}),
          ...(longitude != null ? { longitude } : {}),
        },
      }),
    enabled: Boolean(address) || (latitude != null && longitude != null),
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  if (isLoading) {
    return <div className={cn("mx-auto mt-6 w-full max-w-3xl animate-pulse rounded-lg bg-current/10", heightClass)} />;
  }

  if (!data) {
    return (
      <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-2 rounded-lg border border-current/20 p-6">
        <MapPin className="size-5" />
        <span className="text-sm">Consulte a localização pelo botão abaixo.</span>
      </div>
    );
  }

  const delta = 0.012;
  const bbox = [
    data.longitude - delta,
    data.latitude - delta,
    data.longitude + delta,
    data.latitude + delta,
  ].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${data.latitude}%2C${data.longitude}`;

  return (
    <div className={cn("mx-auto mt-6 w-full max-w-3xl overflow-hidden rounded-lg border border-current/10 shadow-sm", heightClass)}>
      <iframe
        title={`Mapa de ${address}`}
        src={src}
        className="size-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}