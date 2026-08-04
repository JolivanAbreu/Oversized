const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  // Timeouts curtos: uma falha de SMTP nunca deve travar uma requisição HTTP
  // por minutos — o chamador decide o fallback (ver services/*.js, que tratam
  // envio de e-mail como best-effort e nunca deixam a falha propagar).
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || '"Blusã Oversized Store" <naoresponda@blusaoversized.com.br>',
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
