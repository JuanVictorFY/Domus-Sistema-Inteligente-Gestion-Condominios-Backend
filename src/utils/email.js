import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Domus - Condominios <onboarding@resend.dev>';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    console.log(`[Email] ✅ Enviado → ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] ❌ Error → ${to}: ${err.message}`);
    return false;
  }
};

export const sendEmailBackground = (options) => {
  setImmediate(() => sendEmail(options));
};
