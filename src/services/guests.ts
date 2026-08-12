import { supabase } from "@/integrations/supabase/client";
import type { Guest, Rsvp } from "@/types";

export async function listGuests(coupleId: string): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type GuestInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  group_name?: string | null;
  plus_one_allowed?: boolean;
  plus_one_name?: string | null;
  status?: Guest["status"];
  notes?: string | null;
};

export async function createGuest(coupleId: string, input: GuestInput): Promise<Guest> {
  const { data, error } = await supabase
    .from("guests")
    .insert({ couple_id: coupleId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateGuest(id: string, input: Partial<GuestInput>): Promise<Guest> {
  const { data, error } = await supabase
    .from("guests")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw error;
}

export type RsvpWithGuest = Rsvp & { guests: Pick<Guest, "id" | "name" | "email"> | null };

export async function listRsvps(coupleId: string): Promise<RsvpWithGuest[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*, guests(id, name, email)")
    .eq("couple_id", coupleId)
    .order("responded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RsvpWithGuest[];
}

export type SubmitRsvpInput = {
  slug: string;
  name: string;
  email: string;
  response: "attending" | "not_attending";
  guestsCount: number;
  plusOneName?: string;
  dietary?: string;
  message?: string;
};

export async function submitRsvp(input: SubmitRsvpInput): Promise<void> {
  const { error } = await supabase.rpc("submit_rsvp", {
    _slug: input.slug,
    _name: input.name,
    _email: input.email,
    _response: input.response,
    _guests_count: input.guestsCount,
    ...(input.plusOneName ? { _plus_one_name: input.plusOneName } : {}),
    ...(input.dietary ? { _dietary: input.dietary } : {}),
    ...(input.message ? { _message: input.message } : {}),
  });
  if (error) throw error;
}

export function guestStats(guests: Guest[]) {
  return {
    total: guests.length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    pending: guests.filter((g) => g.status === "pending").length,
    declined: guests.filter((g) => g.status === "declined").length,
  };
}
