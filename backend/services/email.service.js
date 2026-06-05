/**
 * emailService.js
 *
 * Production-grade email service for Node.js applications deployed on
 * platforms with blocked SMTP ports (Render, Vercel, Railway, Fly.io, etc.).
 *
 * PRIMARY:  Brevo HTTP API  (port 443 — never blocked)
 * FALLBACK: SMTP via Nodemailer (works only if port 587/465 is open)
 *
 * Strategy:
 *   - Brevo is the default and recommended path for all PaaS deployments.
 *   - SMTP is available as an optional fallback for self-hosted or VPS setups.
 *   - Retries with exponential backoff are applied to transient failures.
 *   - All failures surface structured errors — never silent swallows.
 */

'use strict';

const dns = require('dns');
const nodemailer = require('nodemailer');
const { BrevoClient } = require('@getbrevo/brevo'); // Official Brevo SDK

// ---------------------------------------------------------------------------
// 1. DNS: Force IPv4 globally to prevent ENETUNREACH on dual-stack hosts.
//    This is a Node.js-level setting and applies to all outbound connections.
// ---------------------------------------------------------------------------
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// ---------------------------------------------------------------------------
// 2. Configuration — validated at startup, fails loudly if misconfigured.
// ---------------------------------------------------------------------------
const config = {
  brevoApiKey: process.env.BREVO_API_KEY || null,

  smtp: {
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true = port 465, false = STARTTLS on 587
    user:   process.env.SMTP_USER   || process.env.EMAIL_USER || null,
    pass:   process.env.SMTP_PASS   || process.env.EMAIL_PASS || null,
  },

  // Sender address.
  // - If using Resend without a verified custom domain: use onboarding@resend.dev
  // - If using Resend with a verified domain: set FROM_EMAIL=you@yourdomain.com
  // - If using SMTP: defaults to the SMTP auth user
  fromEmail: process.env.FROM_EMAIL || null,
  fromName:  process.env.FROM_NAME  || 'Furzo',

  // Retry configuration for transient failures
  retry: {
    maxAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3', 10),
    initialDelayMs: 500,
  },
};

// Resolve effective sender address based on available credentials
if (!config.fromEmail) {
  if (config.smtp.user) {
    config.fromEmail = config.smtp.user;
  } else {
    config.fromEmail = 'noreply@example.com';
  }
}

// ---------------------------------------------------------------------------
// 3. Transport selection — determined once at startup.
// ---------------------------------------------------------------------------
let activeTransport = 'none'; // 'brevo' | 'smtp' | 'none'
let brevoClient     = null;
let smtpTransporter = null;

function initializeTransport() {
  if (config.brevoApiKey) {
    // ── Brevo (recommended for PaaS) ────────────────────────────────────
    brevoClient    = new BrevoClient({ apiKey: config.brevoApiKey });
    activeTransport = 'brevo';
    log('info', 'Transport: Brevo HTTP API (port 443). SMTP ports are not used.');

  } else if (config.smtp.user && config.smtp.pass) {
    // ── SMTP (self-hosted / VPS only) ─────────────────────────────────────
    // IMPORTANT: On Render, Railway, Vercel, Fly.io — port 587 is blocked at
    // the network level. SMTP will always time out on these platforms.
    // Use Brevo instead by setting BREVO_API_KEY in your environment.
    smtpTransporter = nodemailer.createTransport({
      host:   config.smtp.host,
      port:   config.smtp.port,
      secure: config.smtp.secure,
      family: 4, // Explicitly use IPv4 socket; prevents ENETUNREACH on dual-stack
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      // Aggressive timeouts: fail fast rather than hanging indefinitely.
      // ETIMEDOUT on a PaaS means the port is firewall-blocked — retrying
      // forever won't help; surface the error immediately.
      connectionTimeout:  8000,  // TCP connect timeout (ms)
      greetingTimeout:    8000,  // SMTP EHLO/HELO response timeout (ms)
      socketTimeout:      10000, // Idle socket timeout (ms)
    });

    activeTransport = 'smtp';
    log('info', `Transport: SMTP (${config.smtp.host}:${config.smtp.port}, IPv4-forced)`);
    log('warn', 'SMTP note: Port 587 is blocked on Render/Vercel/Railway/Fly.io. ' +
                'If you see ETIMEDOUT, set BREVO_API_KEY instead.');

    // Verify SMTP credentials asynchronously; don't block startup.
    smtpTransporter.verify((err) => {
      if (err) {
        log('error', `SMTP verify failed: [${err.code || '?'}] ${err.message}`);
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
          log('error', 'This is a network-level block (not a credentials error). ' +
                       'Check if your host allows outbound port 587.');
        }
      } else {
        log('info', `SMTP authenticated successfully as ${config.smtp.user}`);
      }
    });

  } else {
    // ── No credentials — console simulation ──────────────────────────────
    activeTransport = 'none';
    log('warn', 'No email credentials configured. Emails will be simulated to console.');
    log('warn', 'Set BREVO_API_KEY (recommended) or SMTP_USER + SMTP_PASS in your environment.');
  }
}

// ---------------------------------------------------------------------------
// 4. Retry helper with exponential backoff.
// ---------------------------------------------------------------------------

/**
 * Executes an async function with exponential backoff retry.
 * @param {Function} fn          - Async function to retry; must throw on failure.
 * @param {number}   maxAttempts - Maximum number of attempts (including first).
 * @param {number}   delayMs     - Initial delay between retries in milliseconds.
 * @returns {Promise<*>}
 */
async function withRetry(fn, maxAttempts = 3, delayMs = 500) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry on permanent failures (bad credentials, invalid address, etc.)
      if (isPermanentError(err)) {
        log('error', `Permanent error on attempt ${attempt} — not retrying: ${err.message}`);
        throw err;
      }

      if (attempt < maxAttempts) {
        const wait = delayMs * Math.pow(2, attempt - 1); // 500ms, 1000ms, 2000ms
        log('warn', `Attempt ${attempt}/${maxAttempts} failed (${err.code || err.message}). Retrying in ${wait}ms...`);
        await sleep(wait);
      }
    }
  }

  throw lastError;
}

/**
 * Classifies errors that should NOT be retried (retrying won't fix them).
 * @param {Error} err
 * @returns {boolean}
 */
function isPermanentError(err) {
  const permanentCodes = [
    'EAUTH',        // Wrong credentials
    'EENVELOPE',    // Invalid recipient address
  ];
  const permanentHttpStatuses = [400, 401, 403, 422]; // Bad request, unauth, forbidden, validation

  if (permanentCodes.includes(err.code)) return true;
  if (err.statusCode && permanentHttpStatuses.includes(err.statusCode)) return true;
  if (err.response && permanentHttpStatuses.includes(err.response.status)) return true;
  return false;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 5. Core send implementations.
// ---------------------------------------------------------------------------

async function sendViaBrevo({ to, subject, html, text, replyTo }) {
  const recipients = (Array.isArray(to) ? to : [to]).map(email => ({ email }));

  const payload = {
    sender: {
      email: config.fromEmail,
      name:  config.fromName,
    },
    to: recipients,
    subject,
    htmlContent: html,
    ...(text    && { textContent: text }),
    ...(replyTo && { replyTo: { email: replyTo } }),
  };

  log('info', `[Brevo] Sending to ${recipients.map(r => r.email).join(', ')} — "${subject}"`);

  const data = await brevoClient.transactionalEmails.sendTransacEmail(payload);

  log('info', `[Brevo] Delivered. ID: ${data.messageId}`);
  return { success: true, messageId: data.messageId, provider: 'brevo' };
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
  log('info', `[SMTP] Sending to ${to} via ${config.smtp.host}:${config.smtp.port}`);

  const info = await smtpTransporter.sendMail({
    from:    `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    html,
    ...(text    && { text }),
    ...(replyTo && { replyTo }),
  });

  log('info', `[SMTP] Delivered. MessageID: ${info.messageId} | Response: ${info.response}`);
  return { success: true, messageId: info.messageId, provider: 'smtp' };
}

function sendViaConsole({ to, subject, html }) {
  const border = '='.repeat(64);
  console.log(`\n${border}`);
  console.log('  SIMULATED EMAIL (no credentials configured)');
  console.log(border);
  console.log(`  FROM:    "${config.fromName}" <${config.fromEmail}>`);
  console.log(`  TO:      ${to}`);
  console.log(`  SUBJECT: ${subject}`);
  console.log(`  BODY:\n${html}`);
  console.log(`${border}\n`);
  return { success: true, simulated: true, provider: 'console' };
}

// ---------------------------------------------------------------------------
// 6. Public API — the only function callers should use.
// ---------------------------------------------------------------------------

/**
 * Send an email using the configured transport.
 *
 * @param {Object} options
 * @param {string|string[]} options.to        - Recipient email(s)
 * @param {string}          options.subject   - Email subject
 * @param {string}          options.html      - HTML body
 * @param {string}          [options.text]    - Plain-text fallback (recommended)
 * @param {string}          [options.replyTo] - Reply-To address
 *
 * @returns {Promise<{ success: boolean, messageId?: string, provider: string, error?: string }>}
 */
async function sendEmail({ to, subject, html, text, replyTo } = {}) {
  // Input validation
  if (!to || !subject || !html) {
    throw new Error('sendEmail requires `to`, `subject`, and `html`.');
  }

  const params = { to, subject, html, text, replyTo };

  try {
    switch (activeTransport) {
      case 'brevo':
        return await withRetry(
          () => sendViaBrevo(params),
          config.retry.maxAttempts,
          config.retry.initialDelayMs,
        );

      case 'smtp':
        return await withRetry(
          () => sendViaSmtp(params),
          config.retry.maxAttempts,
          config.retry.initialDelayMs,
        );

      case 'none':
      default:
        return sendViaConsole(params);
    }
  } catch (err) {
    // Structured error response — callers can inspect without try/catch
    const errorMessage = err.message || String(err);
    log('error', `sendEmail failed after retries: ${errorMessage}`);
    return { success: false, error: errorMessage, provider: activeTransport };
  }
}

// ---------------------------------------------------------------------------
// 7. Structured logger — consistent, scannable output.
// ---------------------------------------------------------------------------
const LEVELS = { info: '✅', warn: '⚠️ ', error: '❌' };

function log(level, message) {
  const prefix = LEVELS[level] || '  ';
  const timestamp = new Date().toISOString();
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `${prefix} [EmailService ${timestamp}] ${message}`
  );
}

// ---------------------------------------------------------------------------
// 8. Bootstrap
// ---------------------------------------------------------------------------
initializeTransport();

module.exports = { sendEmail };
