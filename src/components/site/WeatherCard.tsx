import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets, Sun } from "lucide-react";
import { getWeddingWeather } from "@/lib/weather.functions";
import type { WeatherResult } from "@/lib/weather";

function iconFor(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code < 50) return CloudFog;
  if (code >= 95) return CloudLightning;
  return CloudRain;
}

/**
 * Card "Como vai estar o tempo" do site público. Falha em silêncio (não renderiza)
 * quando não há dados suficientes ou o serviço está indisponível.
 */
export function WeatherCard({
  date,
  address,
  latitude,
  longitude,
  primary,
}: {
  date: string | null | undefined;
  address: string;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  primary: string;
}) {
  const fetchWeather = useServerFn(getWeddingWeather);
  const enabled = Boolean(date) && (Boolean(address) || (latitude != null && longitude != null));
  // eslint-disable-next-line no-console
  console.log("[WeatherCard] enabled:", enabled, "date:", date, "address:", address, "lat:", latitude, "lon:", longitude);

  const { data, isLoading, error } = useQuery<WeatherResult>({
    queryKey: ["weather", date, address, latitude, longitude],
    queryFn: () =>
      fetchWeather({
        data: {
          date: date!,
          ...(address ? { address } : {}),
          ...(latitude != null ? { latitude } : {}),
          ...(longitude != null ? { longitude } : {}),
        },
      }),
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
  // eslint-disable-next-line no-console
  console.log("[WeatherCard] data:", data, "isLoading:", isLoading, "error:", error);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="mx-auto mt-6 h-24 max-w-md animate-pulse rounded-2xl border border-current/10 bg-white/40" />
    );
  }
  if (!data || !data.ok) return null;

  const Icon = iconFor(data.code);

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-current/10 bg-white/50 p-5 text-left shadow-sm backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">
        {data.kind === "forecast" ? "Como vai estar o tempo" : "Média histórica para esta data"}
      </p>
      <div className="mt-3 flex items-center gap-4">
        <Icon className="size-10 shrink-0" style={{ color: primary }} />
        <div className="min-w-0">
          <p className="font-medium">{data.label}</p>
          <p className="text-sm">
            {data.tempMin}° a {data.tempMax}°C
            {data.rainChance != null ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs opacity-80">
                <Droplets className="size-3.5" /> {data.rainChance}% chuva
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs opacity-80">{data.tip}</p>
        </div>
      </div>
      {data.kind === "climate" ? (
        <p className="mt-3 text-[11px] opacity-60">
          A previsão detalhada fica disponível a partir de 15 dias antes do casamento.
        </p>
      ) : null}
    </div>
  );
}
