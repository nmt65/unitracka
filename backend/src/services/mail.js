import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

export function isSmtpConfigured() {
  return Boolean(
    env.mail.resendApiKey ||
    (env.smtp.host && env.smtp.user && env.smtp.pass)
  );
}

function isGmailSmtp() {
  return /gmail/i.test(env.smtp.host);
}

function mailFrom() {
  if (isGmailSmtp() && !String(env.smtp.from || "").includes(env.smtp.user)) {
    return `UniTrack <${env.smtp.user}>`;
  }
  return env.smtp.from;
}

function useResend() {
  return Boolean(env.mail.resendApiKey) &&
    (env.mail.provider === "auto" || env.mail.provider === "resend");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTransporter() {
  if (!transporter) {
    const isGmail = isGmailSmtp();
    const smtpPass = isGmail ? env.smtp.pass.replace(/\s+/g, "") : env.smtp.pass;
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      family: env.smtp.forceIpv4 ? 4 : undefined,
      auth: { user: env.smtp.user, pass: smtpPass },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
      socketTimeout: 20000
    });
  }
  return transporter;
}

function friendlyMailReason(error) {
  const message = error?.message || "Emailul nu a putut fi trimis.";
  if (/Invalid login|EAUTH|535|534|Username and Password/i.test(message)) {
    return "Autentificarea SMTP a fost respinsă. Pentru Gmail folosește App Password, nu parola normală a contului.";
  }
  if (/ETIMEDOUT|ECONNECTION|ECONNREFUSED|ENOTFOUND|timeout/i.test(message)) {
    return "Serverul SMTP nu a răspuns la timp. Verifică SMTP_HOST, SMTP_PORT și conexiunea Render.";
  }
  if (/ENETUNREACH|IPv6|2607:f8b0/i.test(message)) {
    return "Render nu poate ieși pe IPv6 către SMTP. Activează SMTP_FORCE_IPV4=true sau folosește un provider SMTP cu IPv4.";
  }
  return message;
}

async function sendWithResend(message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mail.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.mail.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = payload?.message || `HTTP ${response.status}`;
    throw new Error(`Resend: ${detail}`);
  }
}

export async function sendMailSafe(message) {
  if (!isSmtpConfigured()) return { sent: false, reason: "SMTP neconfigurat" };
  try {
    if (useResend()) {
      await sendWithResend(message);
    } else {
      await getTransporter().sendMail({ from: mailFrom(), ...message });
    }
    return { sent: true };
  } catch (error) {
    const reason = friendlyMailReason(error);
    console.warn(`Email netrimis: ${reason}`);
    return { sent: false, reason };
  }
}

export async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${env.appUrl.replace(/\/$/, "")}/?reset_token=${encodeURIComponent(token)}`;
  const safeName = user.name || "utilizator UniTrack";
  const safeHtmlName = escapeHtml(safeName);
  return sendMailSafe({
    to: user.email,
    subject: "Resetare parolă UniTrack",
    text: [
      `Salut, ${safeName},`,
      "",
      "Ai cerut resetarea parolei pentru contul tău.",
      `Link resetare: ${resetUrl}`,
      "",
      `Linkul expiră în ${env.resetTokenMinutes} minute.`,
      "Dacă nu ai cerut resetarea, ignoră acest mesaj."
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.55;color:#111827;max-width:560px\">",
      `<h2 style=\"margin:0 0 12px\">Resetare parolă UniTrack</h2>`,
      `<p>Salut, ${safeHtmlName},</p>`,
      "<p>Ai cerut resetarea parolei pentru contul tău. Apasă butonul de mai jos și setează o parolă nouă.</p>",
      `<p><a href=\"${resetUrl}\" style=\"display:inline-block;background:#6354d9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700\">Resetează parola</a></p>`,
      `<p style=\"font-size:13px;color:#4b5563\">Linkul expiră în ${env.resetTokenMinutes} minute. Dacă butonul nu merge, deschide manual: <br><span style=\"word-break:break-all\">${resetUrl}</span></p>`,
      "<p style=\"font-size:13px;color:#4b5563\">Dacă nu ai cerut resetarea, poți ignora acest mesaj.</p>",
      "</div>"
    ].join("")
  });
}

export async function sendEmailVerificationCode(user, code) {
  const safeName = user.name || "utilizator UniTrack";
  const safeHtmlName = escapeHtml(safeName);
  return sendMailSafe({
    to: user.email,
    subject: `${code} este codul tău UniTrack`,
    text: [
      `Salut, ${safeName},`,
      "",
      `Codul tău de verificare este: ${code}`,
      "",
      `Codul expiră în ${env.emailVerificationMinutes} minute.`,
      "Dacă nu ai creat sau accesat acest cont, ignoră mesajul."
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.55;color:#102024;max-width:560px;margin:auto\">",
      "<div style=\"border:1px solid #cfe0df;border-radius:12px;padding:28px;background:#ffffff\">",
      "<p style=\"margin:0 0 8px;color:#0f8f84;font-weight:800\">UNITRACK SECURITY</p>",
      "<h2 style=\"margin:0 0 14px\">Verifică adresa de email</h2>",
      `<p>Salut, ${safeHtmlName}. Introdu codul de mai jos în UniTrack:</p>`,
      `<div style=\"margin:22px 0;padding:16px;border-radius:10px;background:#eaf8f6;color:#08786f;font-size:30px;font-weight:900;letter-spacing:8px;text-align:center\">${code}</div>`,
      `<p style=\"font-size:13px;color:#506a6f\">Codul expiră în ${env.emailVerificationMinutes} minute și poate fi folosit o singură dată.</p>`,
      "<p style=\"font-size:13px;color:#506a6f\">Dacă nu ai creat sau accesat acest cont, poți ignora mesajul.</p>",
      "</div></div>"
    ].join("")
  });
}

export async function sendApplicationSubmittedEmail(user, student, institution, application) {
  return sendMailSafe({
    to: user.email,
    subject: `Aplicație nouă - ${application.program}`,
    text: [
      `${student.name} a trimis o aplicație către ${institution.name}.`,
      "",
      `Program: ${application.program}`,
      `Facultate: ${application.faculty || "-"}`,
      `Scor admitere: ${application.admissionScore ?? "-"}`,
      "",
      `Workspace: ${env.appUrl.replace(/\/$/, "")}`,
      "",
      "Intră în workspace-ul UniTrack pentru sortare, verificarea documentelor și feedback către candidat."
    ].join("\n")
  });
}

export async function sendApplicationStatusEmail(student, institution, status, reviewerNotes = "") {
  return sendMailSafe({
    to: student.email,
    subject: `Status aplicație actualizat - ${institution.name}`,
    text: [
      `${institution.name} a actualizat statusul aplicației tale.`,
      "",
      `Status nou: ${status}`,
      reviewerNotes ? `Feedback: ${reviewerNotes}` : "",
      "",
      `Intră în UniTrack pentru detalii: ${env.appUrl.replace(/\/$/, "")}`
    ].filter(Boolean).join("\n")
  });
}
