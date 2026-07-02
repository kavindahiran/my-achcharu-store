import { Resend } from 'resend'

const FROM    = process.env.EMAIL_FROM ?? 'My Achcharu <orders@myachcharu.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Lazy init — safe when RESEND_API_KEY is not yet configured
let _resend: Resend | null = null
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set in .env')
  if (!_resend) _resend = new Resend(key)
  return _resend
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e7e5e4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / Brand -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:32px;">🫙</span>
              <div style="color:#f59e0b;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">
                My Achcharu
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1c1917;border:1px solid #292524;border-radius:16px;overflow:hidden;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;color:#57534e;font-size:12px;line-height:1.6;">
              My Achcharu · Doha, Qatar<br />
              Questions? Reply to this email or WhatsApp us at +974 3112 0638
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function divider() {
  return `<tr><td style="padding:0 28px;"><div style="height:1px;background:#292524;"></div></td></tr>`
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:6px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#78716c;font-size:13px;width:120px;">${label}</td>
            <td style="color:#e7e5e4;font-size:13px;text-align:right;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`
}

// ─── Email: Order Confirmed ───────────────────────────────────────────────────

export type OrderEmailData = {
  to:          string
  customerName:string
  orderNumber: string
  totalQAR:    number
  fruits:      string        // e.g. "Green Mango, Pineapple"
  spice:       string        // e.g. "Authentic (Medium-Hot)"
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  zone:        string
  estimatedTime?: string     // optional override e.g. "45–60 minutes"
}

export async function sendOrderConfirmed(data: OrderEmailData) {
  const confirmationUrl = `${APP_URL}/orders`
  const eta = data.estimatedTime ?? '45–60 minutes'

  const body = `
    <!-- Header stripe -->
    <tr>
      <td style="background:#16a34a;padding:24px 28px;">
        <div style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">
          Order Confirmed
        </div>
        <div style="color:#dcfce7;font-size:24px;font-weight:700;">
          Your achcharu is on its way! 🎉
        </div>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:24px 28px 16px;">
        <p style="margin:0;color:#d6d3d1;font-size:15px;line-height:1.6;">
          Dear ${escHtml(data.customerName)},
        </p>
        <p style="margin:12px 0 0;color:#d6d3d1;font-size:15px;line-height:1.6;">
          Great news — we've confirmed your order and our team is now preparing your custom achcharu jar with care.
          Expect your delivery in approximately <strong style="color:#f59e0b;">${eta}</strong>.
        </p>
      </td>
    </tr>

    ${divider()}

    <!-- Order details -->
    <tr><td style="padding:20px 28px 4px;color:#a8a29e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Order Details</td></tr>
    ${row('Order No.', `<strong style="color:#f59e0b;font-family:monospace;">${escHtml(data.orderNumber)}</strong>`)}
    ${row('Fruits', escHtml(data.fruits))}
    ${row('Spice Level', escHtml(data.spice))}
    ${row('Payment', data.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Bank Transfer')}
    ${row('Zone', escHtml(data.zone))}
    <tr><td style="padding:4px 28px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#78716c;font-size:13px;width:120px;">Total</td>
          <td style="color:#f59e0b;font-size:20px;font-weight:700;text-align:right;">QAR ${data.totalQAR.toFixed(2)}</td>
        </tr>
      </table>
    </td></tr>

    ${divider()}

    <!-- CTA -->
    <tr>
      <td style="padding:24px 28px;">
        ${data.paymentMethod === 'CASH_ON_DELIVERY'
          ? `<p style="margin:0 0 20px;color:#d6d3d1;font-size:14px;line-height:1.6;">
               Please have <strong>QAR ${data.totalQAR.toFixed(2)}</strong> ready in cash when our delivery person arrives.
             </p>`
          : `<p style="margin:0 0 20px;color:#d6d3d1;font-size:14px;line-height:1.6;">
               If you haven't uploaded your bank transfer receipt yet, please do so to avoid any delay.
             </p>`
        }
        <a href="${confirmationUrl}" style="display:inline-block;background:#f59e0b;color:#0c0a09;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px;">
          View My Orders →
        </a>
      </td>
    </tr>

    <!-- Sign-off -->
    <tr>
      <td style="padding:0 28px 28px;">
        <p style="margin:0;color:#78716c;font-size:13px;line-height:1.6;">
          Thank you for choosing My Achcharu. We look forward to delivering a taste of home to your door.
        </p>
        <p style="margin:12px 0 0;color:#78716c;font-size:13px;">
          Warm regards,<br />
          <strong style="color:#a8a29e;">The My Achcharu Team</strong>
        </p>
      </td>
    </tr>
  `

  return getResend().emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Your order ${data.orderNumber} is confirmed! 🫙`,
    html:    layout('Order Confirmed — My Achcharu', body),
  })
}

// ─── Email: Out for Delivery ──────────────────────────────────────────────────

export async function sendOutForDelivery(data: OrderEmailData) {
  const body = `
    <!-- Header stripe -->
    <tr>
      <td style="background:#7c3aed;padding:24px 28px;">
        <div style="color:#ede9fe;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">
          Out for Delivery
        </div>
        <div style="color:#ffffff;font-size:24px;font-weight:700;">
          Your achcharu is on its way! 🛵
        </div>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:24px 28px 16px;">
        <p style="margin:0;color:#d6d3d1;font-size:15px;line-height:1.6;">
          Dear ${escHtml(data.customerName)},
        </p>
        <p style="margin:12px 0 0;color:#d6d3d1;font-size:15px;line-height:1.6;">
          Your custom achcharu jar has left our kitchen and is heading your way right now.
          Please ensure someone is available to receive the delivery at your address in
          <strong style="color:#f59e0b;">${escHtml(data.zone)}</strong>.
        </p>
      </td>
    </tr>

    ${divider()}

    <tr><td style="padding:20px 28px 4px;color:#a8a29e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Order Summary</td></tr>
    ${row('Order No.', `<strong style="color:#f59e0b;font-family:monospace;">${escHtml(data.orderNumber)}</strong>`)}
    ${row('Contents', escHtml(data.fruits))}
    ${row('Payment', data.paymentMethod === 'CASH_ON_DELIVERY' ? `Cash on Delivery — <strong>QAR ${data.totalQAR.toFixed(2)}</strong>` : `Bank Transfer — QAR ${data.totalQAR.toFixed(2)}`)}

    ${divider()}

    <!-- Contact -->
    <tr>
      <td style="padding:24px 28px 28px;">
        <p style="margin:0 0 8px;color:#d6d3d1;font-size:14px;line-height:1.6;">
          Need to reach us? WhatsApp or call our delivery team:
        </p>
        <a href="https://wa.me/97431120638" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:10px 24px;border-radius:10px;">
          💬 WhatsApp Us
        </a>
        <p style="margin:20px 0 0;color:#78716c;font-size:13px;line-height:1.6;">
          Thank you for your order. We hope you enjoy every bite! 🌶️
        </p>
        <p style="margin:12px 0 0;color:#78716c;font-size:13px;">
          Warm regards,<br />
          <strong style="color:#a8a29e;">The My Achcharu Team</strong>
        </p>
      </td>
    </tr>
  `

  return getResend().emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Your order ${data.orderNumber} is on its way! 🛵`,
    html:    layout('Out for Delivery — My Achcharu', body),
  })
}

// ─── Email: New Order Alert (admin) ──────────────────────────────────────────

export type NewOrderAlertData = {
  orderNumber:   string
  totalQAR:      number
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  recipientName: string
  contactPhone:  string
  zone:          string
  fruits:        string
  spice:         string
  customerEmail: string | null
}

export async function sendNewOrderAlert(data: NewOrderAlertData) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return  // skip if admin email not configured

  const adminUrl = `${APP_URL}/admin/orders`

  const body = `
    <!-- Header stripe -->
    <tr>
      <td style="background:#b45309;padding:24px 28px;">
        <div style="color:#fef3c7;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">
          New Order Received
        </div>
        <div style="color:#ffffff;font-size:24px;font-weight:700;">
          🛒 ${escHtml(data.orderNumber)}
        </div>
      </td>
    </tr>

    <!-- Details -->
    <tr><td style="padding:20px 28px 4px;color:#a8a29e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Order Details</td></tr>
    ${row('Customer', escHtml(data.recipientName))}
    ${row('Phone', escHtml(data.contactPhone))}
    ${data.customerEmail ? row('Email', escHtml(data.customerEmail)) : ''}
    ${row('Zone', escHtml(data.zone))}
    ${row('Fruits', escHtml(data.fruits))}
    ${row('Spice', escHtml(data.spice))}
    ${row('Payment', data.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Bank Transfer')}
    <tr><td style="padding:4px 28px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#78716c;font-size:13px;width:120px;">Total</td>
          <td style="color:#f59e0b;font-size:20px;font-weight:700;text-align:right;">QAR ${data.totalQAR.toFixed(2)}</td>
        </tr>
      </table>
    </td></tr>

    ${divider()}

    <tr>
      <td style="padding:24px 28px 28px;">
        <a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:#0c0a09;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px;">
          View in Admin Dashboard →
        </a>
      </td>
    </tr>
  `

  return getResend().emails.send({
    from:    FROM,
    to:      adminEmail,
    subject: `New order ${data.orderNumber} — QAR ${data.totalQAR.toFixed(2)} 🛒`,
    html:    layout('New Order — My Achcharu', body),
  })
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function escHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
