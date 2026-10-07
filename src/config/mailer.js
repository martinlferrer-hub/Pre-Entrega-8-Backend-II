import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_PORT === 465,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS
  }
});

export const sendTicketConfirmation = async ({ to, firstName, event, ticket }) => {
  const info = await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: `Inscripción confirmada: ${event.title}`,
    text: [
      `Hola ${firstName || ""},`,
      "",
      "Tu inscripción fue confirmada.",
      `Evento: ${event.title}`,
      `Fecha: ${new Date(event.date).toLocaleString("es-MX")}`,
      `Lugar: ${event.location}`,
      `Cantidad: ${ticket.quantity}`,
      `Código de reserva: ${ticket.reservationCode}`,
      "",
      "Conservá este código para futuras consultas."
    ].join("\n"),
    html: `
      <h2>Inscripción confirmada</h2>
      <p>Hola ${firstName || ""}, tu inscripción fue confirmada.</p>
      <ul>
        <li><strong>Evento:</strong> ${event.title}</li>
        <li><strong>Fecha:</strong> ${new Date(event.date).toLocaleString("es-MX")}</li>
        <li><strong>Lugar:</strong> ${event.location}</li>
        <li><strong>Cantidad:</strong> ${ticket.quantity}</li>
        <li><strong>Código de reserva:</strong> ${ticket.reservationCode}</li>
      </ul>
    `
  });

  return info;
};

