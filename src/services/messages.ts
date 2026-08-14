import { supabase } from "@/integrations/supabase/client";
import type { GuestMessage, MessageStatus } from "@/types";

export async function listMessages(coupleId: string): Promise<GuestMessage[]> {
  const { data, error } = await supabase
    .from("guest_messages")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setMessageStatus(id: string, status: MessageStatus) {
  const { error } = await supabase.from("guest_messages").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from("guest_messages").delete().eq("id", id);
  if (error) throw error;
}

/** Envio público (visitante) — só funciona em sites publicados. */
export async function submitGuestMessage(input: {
  slug: string;
  authorName: string;
  message: string;
  photoUrl?: string;
}) {
  const { error } = await supabase.rpc("submit_guest_message", {
    _slug: input.slug,
    _author_name: input.authorName,
    _message: input.message,
    ...(input.photoUrl ? { _photo_url: input.photoUrl } : {}),
  });
  if (error) throw error;
}

export async function trackSiteEvent(slug: string, eventType: string) {
  await supabase.rpc("track_site_event", { _slug: slug, _event_type: eventType });
}
