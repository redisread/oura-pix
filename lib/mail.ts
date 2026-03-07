/**
 * Resend Email Integration
 * Handles email sending and templates
 */
import { Resend } from 'resend';
import { getCloudflareContext, type CloudflareEnv } from './cloudflare-context';

async function getResend(env?: CloudflareEnv): Promise<{ resend: Resend; fromEmail: string; fromName: string }> {
  const resolvedEnv = env ?? (await getCloudflareContext()).env;
  if (!resolvedEnv.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY environment variable');
  }
  return {
    resend: new Resend(resolvedEnv.RESEND_API_KEY),
    fromEmail: resolvedEnv.FROM_EMAIL || 'noreply@ourapix.jiahongw.com',
    fromName: resolvedEnv.FROM_NAME || 'OuraPix',
  };
}

/**
 * Email recipient
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  type: string; // MIME type
}

/**
 * Send email options
 */
export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: SendEmailOptions, env?: CloudflareEnv): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { resend, fromEmail: defaultFromEmail, fromName: defaultFromName } = await getResend(env);

  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
  const fromEmail = options.from?.email || defaultFromEmail;
  const fromName = options.from?.name || defaultFromName;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toAddresses.map((r) => r.name ? `${r.name} <${r.email}>` : r.email),
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
      ...(options.replyTo && {
        replyTo: options.replyTo.name
          ? `${options.replyTo.name} <${options.replyTo.email}>`
          : options.replyTo.email,
      }),
      ...(options.attachments && {
        attachments: options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Email template data
 */
export interface GenerationCompleteData {
  userName: string;
  productName: string;
  generationId: string;
  previewUrl?: string;
  downloadUrl?: string;
  createdAt: Date;
}

/**
 * Generation complete notification template
 */
export function generateCompleteTemplate(data: GenerationCompleteData): string {
  const formattedDate = data.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Product Detail Page is Ready</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .product-name {
      font-weight: 600;
      color: #667eea;
    }
    .details {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .details-row:last-child {
      margin-bottom: 0;
    }
    .label {
      color: #666;
    }
    .value {
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 0 10px;
    }
    .button-secondary {
      display: inline-block;
      background-color: #f8f9fa;
      color: #333;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 0 10px;
      border: 1px solid #ddd;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Content is Ready!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${escapeHtml(data.userName)},</p>
      <p>Great news! We've successfully generated your product detail page for <span class="product-name">${escapeHtml(data.productName)}</span>.</p>

      <div class="details">
        <div class="details-row">
          <span class="label">Product:</span>
          <span class="value">${escapeHtml(data.productName)}</span>
        </div>
        <div class="details-row">
          <span class="label">Generated on:</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="details-row">
          <span class="label">Generation ID:</span>
          <span class="value">#${data.generationId}</span>
        </div>
      </div>

      <div class="button-container">
        ${data.previewUrl ? `<a href="${data.previewUrl}" class="button">View Result</a>` : ''}
        ${data.downloadUrl ? `<a href="${data.downloadUrl}" class="button-secondary">Download</a>` : ''}
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Need to make changes? You can regenerate or edit your content anytime from your dashboard.
      </p>
    </div>
    <div class="footer">
      <p>OuraPix - AI-Powered Product Content Generation</p>
      <p>
        <a href="https://ourapix.jiahongw.com/dashboard">Dashboard</a> |
        <a href="https://ourapix.jiahongw.com/help">Help Center</a> |
        <a href="https://ourapix.jiahongw.com/contact">Contact Us</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        You're receiving this email because you requested a product detail page generation on OuraPix.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send generation complete notification
 */
export async function sendGenerationCompleteEmail(
  to: EmailRecipient,
  data: GenerationCompleteData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = generateCompleteTemplate(data);

  return sendEmail({
    to,
    subject: `Your product detail page for "${data.productName}" is ready!`,
    html,
    text: `Hi ${data.userName},\n\nYour product detail page for "${data.productName}" has been successfully generated.\n\nView it here: ${data.previewUrl || 'https://ourapix.jiahongw.com/dashboard'}\n\nThanks,\nThe OuraPix Team`,
  });
}

/**
 * Welcome email template data
 */
export interface WelcomeData {
  userName: string;
  dashboardUrl: string;
}

/**
 * Welcome email template
 */
export function welcomeTemplate(data: WelcomeData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OuraPix</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to OuraPix!</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(data.userName)},</p>
      <p>Welcome to OuraPix! We're excited to help you create amazing product detail pages with AI.</p>
      <p>Get started by uploading your first product:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
      </div>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>OuraPix - AI-Powered Product Content Generation</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: EmailRecipient,
  data: WelcomeData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = welcomeTemplate(data);

  return sendEmail({
    to,
    subject: 'Welcome to OuraPix!',
    html,
    text: `Hi ${data.userName},\n\nWelcome to OuraPix! We're excited to help you create amazing product detail pages with AI.\n\nGet started: ${data.dashboardUrl}\n\nThanks,\nThe OuraPix Team`,
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Password reset email template data
 */
export interface PasswordResetData {
  userName: string;
  resetUrl: string;
}

/**
 * Password reset email template
 */
export function passwordResetTemplate(data: PasswordResetData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #f59e0b;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${escapeHtml(data.userName)},</p>
      <p>We received a request to reset your password for your OuraPix account. Click the button below to create a new password:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>

      <div class="warning">
        <p style="margin: 0;"><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>

      <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser:</p>
      <p style="color: #f59e0b; word-break: break-all; font-size: 14px;">${data.resetUrl}</p>
    </div>
    <div class="footer">
      <p>OuraPix - AI-Powered Product Content Generation</p>
      <p>
        <a href="https://ourapix.jiahongw.com/help">Help Center</a> |
        <a href="https://ourapix.jiahongw.com/contact">Contact Us</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        If you didn't request this email, please ignore it or contact support if you have concerns.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: EmailRecipient,
  data: PasswordResetData,
  env?: CloudflareEnv
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = passwordResetTemplate(data);

  return sendEmail({
    to,
    subject: 'Reset Your OuraPix Password',
    html,
    text: `Hi ${data.userName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${data.resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.\n\nThanks,\nThe OuraPix Team`,
  }, env);
}

/**
 * Trial ending email template data
 */
export interface TrialEndingData {
  userName: string;
  planName: string;
  endDate: string;
  updatePaymentUrl: string;
}

/**
 * Trial ending email template
 */
export function trialEndingTemplate(data: TrialEndingData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial is Ending Soon</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .highlight {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Trial is Ending Soon</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${escapeHtml(data.userName)},</p>
      <p>This is a friendly reminder that your <strong>${escapeHtml(data.planName)}</strong> trial will end on <strong>${data.endDate}</strong>.</p>

      <div class="highlight">
        <p style="margin: 0;"><strong>Keep Your Access:</strong> To continue enjoying all the premium features, please update your payment method before your trial ends.</p>
      </div>

      <p>After the trial ends, you'll still have access to:</p>
      <ul>
        <li>All your generated content</li>
        <li>Free plan features (10 generations/month)</li>
        <li>Your account settings and history</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.updatePaymentUrl}" class="button">Update Payment Method</a>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you have any questions about your subscription, feel free to contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>OuraPix - AI-Powered Product Content Generation</p>
      <p>
        <a href="https://ourapix.jiahongw.com/dashboard">Dashboard</a> |
        <a href="https://ourapix.jiahongw.com/help">Help Center</a> |
        <a href="https://ourapix.jiahongw.com/contact">Contact Us</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        You're receiving this email because you started a trial on OuraPix.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send trial ending notification email
 */
export async function sendTrialEndingEmail(
  to: EmailRecipient,
  data: TrialEndingData,
  env?: CloudflareEnv
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = trialEndingTemplate(data);

  return sendEmail({
    to,
    subject: `Your OuraPix ${data.planName} trial ends on ${data.endDate}`,
    html,
    text: `Hi ${data.userName},\n\nThis is a friendly reminder that your ${data.planName} trial will end on ${data.endDate}.\n\nTo continue enjoying all premium features, please update your payment method:\n${data.updatePaymentUrl}\n\nAfter the trial ends, you'll be downgraded to the Free plan (10 generations/month).\n\nThanks,\nThe OuraPix Team`,
  }, env);
}

/**
 * Payment failed email template data
 */
export interface PaymentFailedData {
  userName: string;
  amount: string;
  invoiceDate: string;
  retryUrl: string;
}

/**
 * Payment failed email template
 */
export function paymentFailedTemplate(data: PaymentFailedData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .warning {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${escapeHtml(data.userName)},</p>
      <p>We were unable to process your payment of <strong>${data.amount}</strong> on ${data.invoiceDate}.</p>

      <div class="warning">
        <p style="margin: 0;"><strong>Action Required:</strong> Please update your payment method to avoid interruption to your service. We'll automatically retry the payment in a few days.</p>
      </div>

      <p>This could be due to:</p>
      <ul>
        <li>Expired credit card</li>
        <li>Insufficient funds</li>
        <li>Bank declined the transaction</li>
        <li>Incorrect billing information</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.retryUrl}" class="button">Update Payment Method</a>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you continue to experience issues, please contact our support team for assistance.
      </p>
    </div>
    <div class="footer">
      <p>OuraPix - AI-Powered Product Content Generation</p>
      <p>
        <a href="https://ourapix.jiahongw.com/dashboard">Dashboard</a> |
        <a href="https://ourapix.jiahongw.com/help">Help Center</a> |
        <a href="https://ourapix.jiahongw.com/contact">Contact Us</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        You're receiving this email because a payment on your OuraPix account failed.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send payment failed notification email
 */
export async function sendPaymentFailedEmail(
  to: EmailRecipient,
  data: PaymentFailedData,
  env?: CloudflareEnv
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = paymentFailedTemplate(data);

  return sendEmail({
    to,
    subject: 'Payment Failed - Update Your Payment Method',
    html,
    text: `Hi ${data.userName},\n\nWe were unable to process your payment of ${data.amount} on ${data.invoiceDate}.\n\nPlease update your payment method to avoid service interruption:\n${data.retryUrl}\n\nWe'll automatically retry the payment in a few days.\n\nThanks,\nThe OuraPix Team`,
  }, env);
}
