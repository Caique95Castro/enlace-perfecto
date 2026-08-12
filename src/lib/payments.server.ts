import type { CreatePaymentResult, PaymentMethod } from "./payments.functions";

/**
 * Ponto único de integração com o Mercado Pago.
 * Pendente: criar a preferência de checkout e devolver a URL.
 */
export async function createMercadoPagoPreference(
  orderId: string,
  method: PaymentMethod,
  _accessToken: string,
): Promise<CreatePaymentResult> {
  void orderId;
  void method;
  return {
    status: "pending_integration",
    checkoutUrl: null,
    message: "Integração com o Mercado Pago pendente de implementação.",
  };
}
