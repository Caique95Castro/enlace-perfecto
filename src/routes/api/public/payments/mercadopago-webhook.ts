import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook do gateway de pagamento (Mercado Pago).
 * Um pedido só vira "pago" aqui, nunca pelo retorno do navegador.
 * A validação de assinatura depende da credencial MERCADOPAGO_WEBHOOK_SECRET,
 * ainda não configurada — por isso o webhook rejeita chamadas até lá.
 */
export const Route = createFileRoute("/api/public/payments/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
        if (!secret) {
          return new Response(
            JSON.stringify({ error: "Integração de pagamentos não configurada." }),
            { status: 503, headers: { "content-type": "application/json" } },
          );
        }

        const signature = request.headers.get("x-signature");
        if (!signature) {
          return new Response("Assinatura ausente", { status: 401 });
        }

        const { handleMercadoPagoWebhook } = await import("@/lib/payments-webhook.server");
        return handleMercadoPagoWebhook(await request.text(), signature, secret);
      },
    },
  },
});
