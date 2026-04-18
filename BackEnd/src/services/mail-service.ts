import nodemailer from "nodemailer";

import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

type MailTransport = {
  mode: "smtp" | "ethereal" | "json";
  transporter: any;
};

let transportPromise: Promise<MailTransport> | null = null;

async function createMailTransport(): Promise<MailTransport> {
  if (env.isProduction && !env.SMTP_HOST) {
    throw new AppError(
      503,
      "Email delivery is not configured for production. Set SMTP_HOST and related credentials.",
      "EMAIL_NOT_CONFIGURED",
    );
  }

  if (env.SMTP_HOST) {
    return {
      mode: "smtp",
      transporter: nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
              }
            : undefined,
      }),
    };
  }

  if (env.NODE_ENV === "test") {
    return {
      mode: "json",
      transporter: nodemailer.createTransport({
        jsonTransport: true,
      }),
    };
  }

  try {
    const account = await nodemailer.createTestAccount();

    return {
      mode: "ethereal",
      transporter: nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      }),
    };
  } catch {
    return {
      mode: "json",
      transporter: nodemailer.createTransport({
        jsonTransport: true,
      }),
    };
  }
}

async function getMailTransport() {
  transportPromise ??= createMailTransport();
  return transportPromise;
}

export async function sendVerificationEmail(options: {
  email: string;
  name: string;
  token: string;
}) {
  const { mode, transporter } = await getMailTransport();
  const verificationUrl = `${env.FRONTEND_ORIGIN.replace(/\/$/, "")}/verify?token=${encodeURIComponent(options.token)}`;

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: options.email,
    subject: "Verify your Analytixx account",
    text: [
      `Hi ${options.name},`,
      "",
      "Verify your email to activate your Analytixx account:",
      verificationUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>Hi ${options.name},</p>
        <p>Verify your email to activate your Analytixx account.</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  return {
    deliveryMode: mode,
    previewUrl: nodemailer.getTestMessageUrl(info) ?? null,
    verificationUrl,
  };
}
