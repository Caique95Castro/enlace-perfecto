import { supabase } from "@/integrations/supabase/client";
import type { GiftItem, GiftOrder, Payment } from "@/types";

export async function listGifts(coupleId: string): Promise<GiftItem[]> {
  const { data, error } = await supabase
    .from("gift_items")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type GiftInput = {
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  type: "physical" | "quota";
  quantity: number;
  available_quantity?: number;
  active?: boolean;
};

export async function createGift(coupleId: string, input: GiftInput): Promise<GiftItem> {
  const { data, error } = await supabase
    .from("gift_items")
    .insert({
      couple_id: coupleId,
      ...input,
      available_quantity: input.available_quantity ?? input.quantity,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateGift(id: string, input: Partial<GiftInput>): Promise<GiftItem> {
  const { data, error } = await supabase
    .from("gift_items")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGift(id: string): Promise<void> {
  const { error } = await supabase.from("gift_items").delete().eq("id", id);
  if (error) throw error;
}

export type OrderWithGift = GiftOrder & {
  gift_items: Pick<GiftItem, "id" | "name" | "type"> | null;
  payments: Pick<Payment, "id" | "status" | "payment_method" | "paid_at">[] | null;
};

export async function listOrders(coupleId: string): Promise<OrderWithGift[]> {
  const { data, error } = await supabase
    .from("gift_orders")
    .select("*, gift_items(id, name, type), payments(id, status, payment_method, paid_at)")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderWithGift[];
}

export async function listPayments(coupleId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Cria o pedido do presente (visitante). O pagamento nasce sempre pendente. */
export async function createGiftOrder(input: {
  giftItemId: string;
  name: string;
  email: string;
  quantity: number;
  message?: string;
}): Promise<{ orderId: string; amount: number }> {
  const { data, error } = await supabase.rpc("create_gift_order", {
    _gift_item_id: input.giftItemId,
    _guest_name: input.name,
    _guest_email: input.email,
    _quantity: input.quantity,
    ...(input.message ? { _message: input.message } : {}),
  });
  if (error) throw error;
  const payload = data as { order_id: string; amount: number };
  return { orderId: payload.order_id, amount: Number(payload.amount) };
}

export function orderStats(orders: OrderWithGift[]) {
  const paid = orders.filter((o) => o.status === "paid");
  return {
    total: orders.length,
    paid: paid.length,
    pending: orders.filter((o) => o.status === "pending").length,
    amountReceived: paid.reduce((sum, o) => sum + Number(o.amount), 0),
  };
}
