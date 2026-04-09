// ——— Brevo Transactional Email (HTTP API) ———
// Skips sending if BREVO_API_KEY is not configured (dev mode).

const BREVO_API = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.BREVO_SENDER_EMAIL ?? "noreply@lunark.store";
const FROM_NAME = "Lunark";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@lunark.store";

interface BrevoPayload {
  sender: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

async function send(payload: BrevoPayload): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log("[Email] BREVO_API_KEY not set — skipping send");
    return false;
  }

  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Email] Brevo error:", res.status, text);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

// ——— Contact form → admin notification ———

interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactNotification(data: ContactData) {
  return send({
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: ADMIN_EMAIL, name: "Admin" }],
    subject: `[Lunark] Contacto: ${data.subject}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#111">Nova mensagem de contacto</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;color:#555">Nome</td><td style="padding:8px">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#555">Email</td><td style="padding:8px">${escapeHtml(data.email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#555">Assunto</td><td style="padding:8px">${escapeHtml(data.subject)}</td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px">
          <p style="white-space:pre-wrap;margin:0">${escapeHtml(data.message)}</p>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#999">Enviado através do formulário de contacto do Lunark.</p>
      </div>
    `,
  });
}

// ——— Order confirmation → customer ———

interface OrderItem {
  name: string;
  size: string;
  price: number;
  quantity: number;
}

interface OrderData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  total: number;
}

export async function sendOrderConfirmation(data: OrderData) {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${escapeHtml(item.size)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>`
    )
    .join("");

  return send({
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: data.customerEmail, name: data.customerName }],
    subject: `Lunark — Confirmação da encomenda #${data.orderId.slice(0, 8)}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#111">Obrigado pela tua encomenda!</h2>
        <p>Olá <strong>${escapeHtml(data.customerName)}</strong>, recebemos a tua encomenda.</p>

        <p style="font-size:14px;color:#555">Referência: <strong>#${escapeHtml(data.orderId.slice(0, 8))}</strong></p>

        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Produto</th>
              <th style="padding:8px;text-align:center">Tamanho</th>
              <th style="padding:8px;text-align:center">Qtd</th>
              <th style="padding:8px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px 8px;font-weight:bold;text-align:right">Total</td>
              <td style="padding:12px 8px;font-weight:bold;text-align:right">${data.total.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top:24px;color:#555">Receberás atualizações sobre o estado da encomenda.</p>
        <p style="margin-top:32px;font-size:12px;color:#999">Lunark — Moda com estilo</p>
      </div>
    `,
  });
}

// ——— HTML escaping to prevent XSS in emails ———

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
