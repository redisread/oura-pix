/**
 * Cloudflare Email Integration
 * Handles email sending and templates
 */

/**
 * Email configuration
 */
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ourapix.com';
const FROM_NAME = process.env.FROM_NAME || 'OuraPix';

/**
 * Validate environment variables
 */
function validateConfig(): void {
  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN environment variable');
  }
  if (!CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID environment variable');
  }
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
 * Send email using Cloudflare Email API
 * @param options - Email options
 * @returns Send result
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  validateConfig();

  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  const payload = {
    personalizations: [
      {
        to: toAddresses.map((r) => ({ email: r.email, name: r.name })),
      },
    ],
    from: {
      email: options.from?.email || FROM_EMAIL,
      name: options.from?.name || FROM_NAME,
    },
    subject: options.subject,
    content: [
      {
        type: 'text/html',
        value: options.html,
      },
      ...(options.text
        ? [
            {
              type: 'text/plain',
              value: options.text,
            },
          ]
        : []),
    ],
    ...(options.replyTo && {
      reply_to: {
        email: options.replyTo.email,
        name: options.replyTo.name,
      },
    }),
    ...(options.attachments && {
      attachments: options.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        type: att.type,
        disposition: 'attachment',
      })),
    }),
  };

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/email/routes/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json() as {
      success: boolean;
      errors?: { message: string }[];
      result?: { messageId: string };
    };

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.errors?.[0]?.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data.result?.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
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
 * @param data - Template data
 * @returns HTML content
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
        <a href="https://ourapix.com/dashboard">Dashboard</a> |
        <a href="https://ourapix.com/help">Help Center</a> |
        <a href="https://ourapix.com/contact">Contact Us</a>
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
 * @param to - Recipient email
 * @param data - Template data
 * @returns Send result
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
    text: `Hi ${data.userName},\n\nYour product detail page for "${data.productName}" has been successfully generated.\n\nView it here: ${data.previewUrl || 'https://ourapix.com/dashboard'}\n\nThanks,\nThe OuraPix Team`,
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
 * @param data - Template data
 * @returns HTML content
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
 * @param to - Recipient email
 * @param data - Template data
 * @returns Send result
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
 * @param text - Input text
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const div = { toString: () => text };
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
 * @param data - Template data
 * @returns HTML content
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
        <a href="https://ourapix.com/help">Help Center</a> |
        <a href="https://ourapix.com/contact">Contact Us</a>
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
 * @param to - Recipient email
 * @param data - Template data
 * @returns Send result
 */
export async function sendPasswordResetEmail(
  to: EmailRecipient,
  data: PasswordResetData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = passwordResetTemplate(data);

  return sendEmail({
    to,
    subject: 'Reset Your OuraPix Password',
    html,
    text: `Hi ${data.userName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${data.resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.\n\nThanks,\nThe OuraPix Team`,
  });
}
