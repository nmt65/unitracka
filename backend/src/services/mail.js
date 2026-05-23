import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

export function isSmtpConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!transporter) {
    const isGmail = /gmail/i.test(env.smtp.host);
    const smtpPass = isGmail ? env.smtp.pass.replace(/\s+/g, "") : env.smtp.pass;
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
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
  return message;
}

export async function sendMailSafe(message) {
  if (!isSmtpConfigured()) return { sent: false, reason: "SMTP neconfigurat" };
  try {
    await getTransporter().sendMail({ from: env.smtp.from, ...message });
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
      `<p>Salut, ${safeName},</p>`,
      "<p>Ai cerut resetarea parolei pentru contul tău. Apasă butonul de mai jos și setează o parolă nouă.</p>",
      `<p><a href=\"${resetUrl}\" style=\"display:inline-block;background:#6354d9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700\">Resetează parola</a></p>`,
      `<p style=\"font-size:13px;color:#4b5563\">Linkul expiră în ${env.resetTokenMinutes} minute. Dacă butonul nu merge, deschide manual: <br><span style=\"word-break:break-all\">${resetUrl}</span></p>`,
      "<p style=\"font-size:13px;color:#4b5563\">Dacă nu ai cerut resetarea, poți ignora acest mesaj.</p>",
      "</div>"
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
      "Intră în workspace-ul UniTrack pentru sortare și evaluare."
    ].join("\n")
  });
}

export async function sendApplicationStatusEmail(student, institution, status) {
  return sendMailSafe({
    to: student.email,
    subject: `Status aplicație actualizat - ${institution.name}`,
    text: [
      `${institution.name} a actualizat statusul aplicației tale.`,
      "",
      `Status nou: ${status}`,
      "",
      "Intră în UniTrack pentru detalii."
    ].join("\n")
  });
}
