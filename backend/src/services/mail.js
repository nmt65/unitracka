import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

export function isSmtpConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }
  return transporter;
}

export async function sendMailSafe(message) {
  if (!isSmtpConfigured()) return { sent: false, reason: "SMTP neconfigurat" };
  try {
    await getTransporter().sendMail({ from: env.smtp.from, ...message });
    return { sent: true };
  } catch (error) {
    console.warn(`Email netrimis: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

export async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${env.appUrl.replace(/\/$/, "")}/?reset_token=${encodeURIComponent(token)}`;
  return sendMailSafe({
    to: user.email,
    subject: "Resetare parolă UniTrack",
    text: [
      `Salut, ${user.name || "utilizator UniTrack"},`,
      "",
      "Ai cerut resetarea parolei pentru contul tău.",
      `Link resetare: ${resetUrl}`,
      `Token: ${token}`,
      "",
      `Linkul expiră în ${env.resetTokenMinutes} minute.`,
      "Dacă nu ai cerut resetarea, ignoră acest mesaj."
    ].join("\n")
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
