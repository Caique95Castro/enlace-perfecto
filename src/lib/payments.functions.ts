/**
 * Camada de pagamentos — Mercado Pago.
 *
 * A integração real ainda NÃO está configurada: falta a credencial
 * MERCADOPAGO_ACCESS_TOKEN. Enquanto isso, nenhum pagamento é simulado —
 * o pedido permanece com status "pending" e o casal acompanha pelo painel.
 *
 * Quando a credencial existir, basta implementar `createMercadoPagoPreference`
 * abaixo; nada da interface precisa mudar.
 */
import { createServerFn } from "@tanstack/react-start";

export type PaymentMethod = "pix" | "credit_card" | "debit_card";

export type CreatePaymentResult = {
  status: "pending_integration" | "created";
  checkoutUrl: string | null;
  message: string;
};

export const createPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string; method: PaymentMethod }) => ({
    orderId: String(data.orderId),
    method: data.method,
  }))
  .handler(async ({ data }): Promise<CreatePaymentResult> => {
    const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
    if (!token) {
      return {
        status: "pending_integration",
        checkoutUrl: null,
        message:
          "Seu pedido foi registrado. O pagamento online ainda não está ativo: o casal entrará em contato para combinar o pagamento.",
      };
    }

    const { createMercadoPagoPreference } = await import("./payments.server");
    return createMercadoPagoPreference(data.orderId, data.method, token);
  });
