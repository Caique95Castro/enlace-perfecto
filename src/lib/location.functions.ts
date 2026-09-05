import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { geocodeAddress } from "@/lib/weather";

export const getLocationCoordinates = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        address: z.string().min(2).max(300),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.latitude != null && data.longitude != null) {
      return { latitude: data.latitude, longitude: data.longitude };
    }

    const result = await geocodeAddress(data.address).catch(() => null);
    return result ? { latitude: result.lat, longitude: result.lon } : null;
  });