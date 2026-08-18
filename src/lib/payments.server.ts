import type { CreatePaymentResult, PaymentMethod } from "./payments.functions";

/**
 * Integração real com o Mercado Pago (Checkout Pro).
 * Cria a preferência de pagamento do pedido e devolve a URL de checkout.
 * O pedido só é considerado pago quando o webhook confirma — nunca aqui.
 */
export async function createMercadoPagoPreference(
  orderId: string,
  method: PaymentMethod,
  accessToken: string,
  origin: string,
): Promise<CreatePaymentResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error } = await supabaseAdmin
    .from("gift_orders")
    .select("id, amount, quantity, guest_name, guest_email, status, gift_items(name)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return {
      status: "error",
      checkoutUrl: null,
      message: "Não encontramos esse pedido. Tente novamente.",
    };
  }
  if (order.status === "paid") {
    return { status: "created", checkoutUrl: null, message: "Este presente já foi pago." };
  }

  const giftName = (order.gift_items as { name: string } | null)?.name ?? "Presente";
  const body = {
    items: [
      {
        id: order.id,
        title: giftName,
        quantity: 1,
        unit_price: Number(order.amount),
        currency_id: "BRL",
      },
    ],
    payer: { name: order.guest_name, email: order.guest_email },
    external_reference: order.id,
    metadata: { order_id: order.id },
    notification_url: `${origin}/api/public/payments/mercadopago-webhook`,
    back_urls: {
      success: `${origin}/pagamento/retorno?order=${order.id}`,
      pending: `${origin}/pagamento/retorno?order=${order.id}`,
      failure: `${origin}/pagamento/retorno?order=${order.id}`,
    },
    auto_return: "approved",
    payment_methods:
      method === "pix"
        ? { excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }] }
        : { excluded_payment_types: [{ id: "ticket" }] },
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "x-idempotency-key": `order-${order.id}-${method}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("[mercadopago] preferência recusada", res.status, await res.text());
    return {
      status: "error",
      checkoutUrl: null,
      message: "Não conseguimos abrir o pagamento agora. Tente novamente em instantes.",
    };
  }

  const pref = (await res.json()) as { id: string; init_point?: string; sandbox_init_point?: string };
  const checkoutUrl = pref.init_point ?? pref.sandbox_init_point ?? null;

  await supabaseAdmin
    .from("payments")
    .update({ gateway_payment_id: pref.id, payment_method: method })
    .eq("order_id", order.id);

  await supabaseAdmin.from("audit_logs").insert({
    action: "payment_checkout_created",
    entity: "gift_order",
    entity_id: order.id,
    metadata: { preference_id: pref.id, method },
  });

  return {
    status: "created",
    checkoutUrl,
    message: "Redirecionando para o pagamento seguro.",
  };
}
