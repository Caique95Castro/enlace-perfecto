import { createHmac, timingSafeEqual } from "crypto";

/**
 * Confirma pagamentos vindos do gateway.
 * Só é executado quando a credencial do webhook estiver configurada.
 */
export async function handleMercadoPagoWebhook(
  body: string,
  signature: string,
  secret: string,
): Promise<Response> {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const sig = Buffer.from(signature);
  const exp = Buffer.from(expected);
  if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
    return new Response("Assinatura inválida", { status: 401 });
  }

  const payload = JSON.parse(body) as {
    data?: { id?: string };
    metadata?: { order_id?: string };
    status?: string;
    payment_method_id?: string;
  };

  const orderId = payload.metadata?.order_id;
  if (!orderId) return new Response("Pedido não informado", { status: 400 });

  const approved = payload.status === "approved";
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin
    .from("payments")
    .update({
      status: approved ? "approved" : "pending",
      gateway_payment_id: payload.data?.id ?? null,
      paid_at: approved ? new Date().toISOString() : null,
    })
    .eq("order_id", orderId);

  if (approved) {
    await supabaseAdmin.from("gift_orders").update({ status: "paid" }).eq("id", orderId);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
