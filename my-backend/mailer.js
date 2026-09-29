// Sends email from the VigilKura Gmail account.
//
// Production (Render): the Gmail API over HTTPS. Render's free web services block outbound SMTP,
// so Gmail over SMTP just hangs there — but ordinary HTTPS requests to Google work. Used when
// GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are set
// (get the refresh token once with `node scripts/gmail-auth.js`).
//
// Local dev: Gmail SMTP with an App Password (GMAIL_USER + GMAIL_APP_PASSWORD) as a fallback.
const nodemailer = require('nodemailer');

const SEND_TIMEOUT_MS = 10 * 1000;

// Sender address — must be the Gmail account the refresh token belongs to
const fromEmail = () => process.env.EMAIL_FROM || process.env.GMAIL_USER;

const useGmailApi = () =>
    !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);

// ---- Gmail API ----

// Access tokens last about an hour — reuse one until shortly before it expires
let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
    if (cachedToken && Date.now() < cachedTokenExpiresAt - 60 * 1000) return cachedToken;
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Google token ${res.status}: ${data.error_description || data.error}`);
    cachedToken = data.access_token;
    cachedTokenExpiresAt = Date.now() + data.expires_in * 1000;
    return cachedToken;
}

// Encode a header value that may contain non-ASCII (e.g. the — in subjects)
const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;

// Build a plain-text RFC 2822 message, base64url-encoded as the Gmail API expects
function buildRawMessage({ to, subject, text }) {
    const message = [
        `From: ${encodeHeader('VigilKura')} <${fromEmail()}>`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(text, 'utf8').toString('base64'),
    ].join('\r\n');
    return Buffer.from(message, 'utf8').toString('base64url');
}

async function sendWithGmailApi({ to, subject, text }) {
    const accessToken = await getAccessToken();
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ raw: buildRawMessage({ to, subject, text }) }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Gmail API ${res.status}: ${await res.text()}`);
}

// ---- Gmail SMTP (local dev fallback) ----

// Authenticates with an App Password, not the account password
// Timeouts keep a blocked or slow SMTP connection from hanging the caller
const smtpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
});

async function sendWithSmtp({ to, subject, text }) {
    await smtpTransporter.sendMail({ from: `"VigilKura" <${fromEmail()}>`, to, subject, text });
}

// Send a plain-text email — throws if it couldn't be sent
// Logs the outcome either way so Render's logs show whether email is actually going out
async function sendEmail({ to, subject, text }) {
    const provider = useGmailApi() ? 'Gmail API' : 'Gmail SMTP';
    try {
        if (useGmailApi()) await sendWithGmailApi({ to, subject, text });
        else await sendWithSmtp({ to, subject, text });
        console.log(`Email sent via ${provider} → to: ${to} — "${subject}"`);
    } catch (err) {
        console.error(`Email via ${provider} failed → to: ${to} — ${err.message}`);
        throw err;
    }
}

module.exports = { sendEmail };
