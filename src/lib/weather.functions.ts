import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchWeatherForDate } from "@/lib/weather";

/**
 * Previsão do tempo para o dia do casamento (pública, sem chave de API).
 * Usa Open-Meteo: previsão real até 16 dias antes; fora disso, média histórica da data.
 */
export const getWeddingWeather = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        address: z.string().max(300).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => fetchWeatherForDate(data));
