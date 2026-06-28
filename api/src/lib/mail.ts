/**
 * Email Service using Resend
 */

import { Resend } from "resend";
import {
  DEFAULT_LOCALE,
  mailMessage,
  type Locale,
} from "@oura-pix/i18n";

interface Env {
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
}

interface UserInfo {
  email: string;
  name?: string;
}

interface ResetPasswordInfo {
  resetUrl: string;
  userName: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mailText(
  locale: Locale,
  key: string,
  values: Record<string, string | number> = {}
): string {
  return mailMessage(locale, key, values);
}

function mailHtml(
  locale: Locale,
  key: string,
  values: Record<string, string | number> = {}
): string {
  return escapeHtml(mailText(locale, key, values));
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  user: UserInfo,
  info: ResetPasswordInfo,
  env: Env,
  locale: Locale = DEFAULT_LOCALE
) {
  const resend = new Resend(env.RESEND_API_KEY);
  const displayName = user.name || info.userName || mailText(locale, "fallbackName");

  try {
    await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: user.email,
      subject: mailText(locale, "passwordResetSubject"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${mailHtml(locale, "passwordResetTitle")}</h2>
          <p>${mailHtml(locale, "passwordResetGreeting", { name: displayName })}</p>
          <p>${mailHtml(locale, "passwordResetIntro")}</p>
          <p>
            <a href="${escapeHtml(info.resetUrl)}"
               style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
              ${mailHtml(locale, "passwordResetButton")}
            </a>
          </p>
          <p>${mailHtml(locale, "passwordResetCopy")}</p>
          <p style="word-break: break-all; color: #666;">${escapeHtml(info.resetUrl)}</p>
          <p>${mailHtml(locale, "passwordResetExpiry")}</p>
          <p>${mailHtml(locale, "passwordResetIgnore")}</p>
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">${escapeHtml(env.FROM_NAME)}</p>
        </div>
      `,
    });

    console.info("[Mail] Password reset email sent to:", user.email);
  } catch (error) {
    console.error("[Mail] Failed to send password reset email:", error);
    throw error;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  user: UserInfo,
  env: Env,
  locale: Locale = DEFAULT_LOCALE
) {
  const resend = new Resend(env.RESEND_API_KEY);
  const displayName = user.name || mailText(locale, "fallbackName");

  try {
    await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: user.email,
      subject: mailText(locale, "welcomeSubject", { appName: env.FROM_NAME }),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${mailHtml(locale, "welcomeTitle", { appName: env.FROM_NAME })}</h2>
          <p>${mailHtml(locale, "welcomeGreeting", { name: displayName })}</p>
          <p>${mailHtml(locale, "welcomeIntro")}</p>
          <p>${mailHtml(locale, "welcomeGetStarted")}</p>
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">${escapeHtml(env.FROM_NAME)}</p>
        </div>
      `,
    });

    console.info("[Mail] Welcome email sent to:", user.email);
  } catch (error) {
    console.error("[Mail] Failed to send welcome email:", error);
  }
}
