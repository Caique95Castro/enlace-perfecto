/**
 * Envio de e-mails transacionais via Resend.
 * Se a credencial não estiver configurada, o envio é apenas registrado no log
 * e o fluxo continua — nenhum e-mail é simulado para o usuário.
 */
type SendArgs = { to: string; subject: string; html: string };

const FROM = process.env["RESEND_FROM"] || "Meu Casamento <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: SendArgs): Promise<boolean> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) {
    console.warn("[email] RESEND_API_KEY ausente — e-mail não enviado:", subject, to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error("[email] Falha no envio:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Erro inesperado:", error);
    return false;
  }
}

function layout(title: string, body: string) {
  return `<div style="font-family:Georgia,serif;background:#fbf8f4;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
    <h1 style="font-size:22px;color:#8a6f52;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:28px;font-size:12px;color:#999">Meu Casamento</p>
  </div>
</div>`;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function giftConfirmationToGuest(args: {
  guestName: string;
  giftName: string;
  amount: number;
  coupleName: string;
}) {
  return {
    subject: "Seu presente foi enviado com sucesso",
    html: layout(
      "Presente confirmado 💝",
      `<p>Olá, ${args.guestName}!</p>
       <p>Recebemos a confirmação do seu presente para <strong>${args.coupleName}</strong>.</p>
       <ul style="font-size:15px;color:#444">
         <li>Presente: <strong>${args.giftName}</strong></li>
         <li>Valor: <strong>${money(args.amount)}</strong></li>
         <li>Data: ${new Date().toLocaleDateString("pt-BR")}</li>
         <li>Status: <strong>Aprovado</strong></li>
       </ul>
       <p>Muito obrigado pelo carinho!</p>`,
    ),
  };
}

export function giftNotificationToCouple(args: {
  guestName: string;
  giftName: string;
  amount: number;
  message?: string | null;
}) {
  return {
    subject: "Você recebeu um novo presente!",
    html: layout(
      "Novo presente recebido 🎁",
      `<ul style="font-size:15px;color:#444">
         <li>Convidado: <strong>${args.guestName}</strong></li>
         <li>Presente: <strong>${args.giftName}</strong></li>
         <li>Valor: <strong>${money(args.amount)}</strong></li>
         <li>Data: ${new Date().toLocaleDateString("pt-BR")}</li>
         <li>Status: <strong>Aprovado</strong></li>
       </ul>
       ${args.message ? `<p style="font-style:italic">"${args.message}"</p>` : ""}`,
    ),
  };
}

export function rsvpConfirmationToGuest(args: {
  guestName: string;
  attending: boolean;
  coupleName: string;
}) {
  return {
    subject: args.attending ? "Presença confirmada!" : "Recebemos sua resposta",
    html: layout(
      args.attending ? "Presença confirmada 🤍" : "Resposta registrada",
      `<p>Olá, ${args.guestName}!</p>
       <p>${
         args.attending
           ? `Sua presença no casamento de <strong>${args.coupleName}</strong> está confirmada. Mal podemos esperar!`
           : `Registramos que você não poderá comparecer ao casamento de <strong>${args.coupleName}</strong>. Sentiremos sua falta.`
       }</p>`,
    ),
  };
}
