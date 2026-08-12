import { useQuery } from "@tanstack/react-query";
import { getMyCouple, getSettings, getWedding, listSections } from "@/services/couples";
import { listGuests } from "@/services/guests";
import { listGifts, listOrders } from "@/services/gifts";
import { listPhotos } from "@/services/storage";

export function useCouple() {
  return useQuery({ queryKey: ["couple"], queryFn: getMyCouple });
}

export function useWedding(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["wedding", coupleId],
    queryFn: () => getWedding(coupleId!),
    enabled: Boolean(coupleId),
  });
}

export function useSettings(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["settings", coupleId],
    queryFn: () => getSettings(coupleId!),
    enabled: Boolean(coupleId),
  });
}

export function useSections(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["sections", coupleId],
    queryFn: () => listSections(coupleId!),
    enabled: Boolean(coupleId),
  });
}

export function useGuests(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["guests", coupleId],
    queryFn: () => listGuests(coupleId!),
    enabled: Boolean(coupleId),
  });
}

export function useGifts(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["gifts", coupleId],
    queryFn: () => listGifts(coupleId!),
    enabled: Boolean(coupleId),
  });
}

export function useOrders(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["orders", coupleId],
    queryFn: () => listOrders(coupleId!),
    enabled: Boolean(coupleId),
  });
}

export function usePhotos(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["photos", coupleId],
    queryFn: () => listPhotos(coupleId!),
    enabled: Boolean(coupleId),
  });
}
