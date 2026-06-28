interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn('[EMAIL] Brevo API not configured');
    return false;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'Bengaliboxd' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[EMAIL] Brevo API error:', res.status, err.message || err);
      return false;
    }

    return true;
  } catch (err: unknown) {
    console.error('[EMAIL] Brevo API request failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
