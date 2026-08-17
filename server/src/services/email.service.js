import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { escapeHtml } from '../utils/helpers.js';

let transporter = null;

const getTransporter = () => {
  if (!env.mail.configured) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: { user: env.mail.user, pass: env.mail.password },
  });
  return transporter;
};

export const isMailConfigured = () => env.mail.configured;

/**
 * Sends an email if SMTP is configured. When it is not, the attempt is logged
 * and `{ sent: false }` is returned — form submissions are still persisted to
 * Firestore, so no enquiry is ever lost because email is unavailable.
 */
export const sendMail = async ({ to, subject, html, text, replyTo }) => {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { sent: false, reason: 'no-recipient' };

  const mailer = getTransporter();
  if (!mailer) {
    logger.info('Email not sent (SMTP not configured)', { to: recipients, subject });
    return { sent: false, reason: 'smtp-not-configured' };
  }

  try {
    const info = await mailer.sendMail({
      from: env.mail.from,
      to: recipients.join(','),
      subject,
      text: text || html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html,
      replyTo,
    });
    logger.info('Email sent', { to: recipients, subject, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    // Never fail a user-facing request because of a mail transport problem.
    logger.error('Email delivery failed', error);
    return { sent: false, reason: error?.message || 'send-failed' };
  }
};

const row = (label, value) => `
  <tr>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827;white-space:nowrap;vertical-align:top;">${escapeHtml(
      label,
    )}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${escapeHtml(
      value,
    ).replace(/\n/g, '<br/>')}</td>
  </tr>`;

export const buildSubmissionEmail = ({ heading, intro, fields = {}, footer }) => {
  const rows = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => row(label, String(value)))
    .join('');

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr><td style="background:#0f172a;padding:20px 24px;">
      <h1 style="margin:0;font-size:18px;line-height:1.4;color:#ffffff;">${escapeHtml(heading)}</h1>
    </td></tr>
    ${
      intro
        ? `<tr><td style="padding:20px 24px 0;color:#374151;font-size:14px;line-height:1.6;">${escapeHtml(
            intro,
          )}</td></tr>`
        : ''
    }
    <tr><td style="padding:20px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows}</table>
    </td></tr>
    ${
      footer
        ? `<tr><td style="padding:0 24px 24px;color:#6b7280;font-size:12px;line-height:1.6;">${escapeHtml(
            footer,
          )}</td></tr>`
        : ''
    }
  </table>
</body></html>`;
};

/** Notifies the internal team about a new enquiry. Non-blocking by design. */
export const notifyTeam = async ({ subject, heading, intro, fields, replyTo }) => {
  if (!env.mail.notifyTo.length) {
    logger.debug('No EMAIL_NOTIFY_TO configured; skipping team notification.');
    return { sent: false, reason: 'no-recipient' };
  }
  return sendMail({
    to: env.mail.notifyTo,
    subject,
    html: buildSubmissionEmail({ heading, intro, fields }),
    replyTo,
  });
};

/** Confirms receipt to the person who submitted the form. */
export const sendAcknowledgement = async ({ to, name, subject, heading, intro, fields, brand }) => {
  if (!to) return { sent: false, reason: 'no-recipient' };
  return sendMail({
    to,
    subject,
    html: buildSubmissionEmail({
      heading,
      intro: intro || `Hi ${name || 'there'}, thank you for getting in touch.`,
      fields,
      footer: `${brand || 'Our team'} will reply as soon as possible. This is an automated confirmation — please do not reply directly.`,
    }),
  });
};
