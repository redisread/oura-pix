/**
 * Email Service using Resend
 */

import { Resend } from "resend";

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

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  user: UserInfo,
  info: ResetPasswordInfo,
  env: Env
) {
  const resend = new Resend(env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <p>
            <a href="${info.resetUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${info.resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">${env.FROM_NAME}</p>
        </div>
      `,
    });

    console.log("[Mail] Password reset email sent to:", user.email);
  } catch (error) {
    console.error("[Mail] Failed to send password reset email:", error);
    throw error;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(user: UserInfo, env: Env) {
  const resend = new Resend(env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: user.email,
      subject: `Welcome to ${env.FROM_NAME}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${env.FROM_NAME}!</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Thank you for joining us. We're excited to have you on board!</p>
          <p>Get started by exploring our features and creating your first AI-generated product detail page.</p>
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">${env.FROM_NAME}</p>
        </div>
      `,
    });

    console.log("[Mail] Welcome email sent to:", user.email);
  } catch (error) {
    console.error("[Mail] Failed to send welcome email:", error);
  }
}
