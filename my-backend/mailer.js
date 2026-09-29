// Sends email through Brevo's HTTP API when BREVO_API_KEY is set (production), otherwise through
// Gmail SMTP (local dev). Render's free web services can't open outbound SMTP connections, so
// production needs an HTTP-based provider — Gmail SMTP there just hangs until the request times out.
const nodemailer = require('nodemailer');

const SEND_TIMEOUT_MS = 10 * 1000;

// Sender address — must be a verified sender in Brevo when using Brevo
const fromEmail = () => process.env.EMAIL_FROM || process.env.GMAIL_USER;

// Gmail transporter — authenticates with an App Password, not the account password
// Timeouts keep a blocked or slow SMTP connection from hanging the caller
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
});

async function sendWithBrevo({ to, subject, text }) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: 'VigilKura', email: fromEmail() },
            to: [{ email: to }],
            subject,
            textContent: text,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
        throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    }
}

async function sendWithGmail({ to, subject, text }) {
    await gmailTransporter.sendMail({
        from: `"VigilKura" <${fromEmail()}>`,
        to,
        subject,
        text,
    });
}

// Send a plain-text email — throws if it couldn't be sent
// Logs the outcome either way so Render's logs show whether email is actually going out
async function sendEmail({ to, subject, text }) {
    const provider = process.env.BREVO_API_KEY ? 'Brevo' : 'Gmail';
    try {
        if (provider === 'Brevo') await sendWithBrevo({ to, subject, text });
        else await sendWithGmail({ to, subject, text });
        console.log(`Email sent via ${provider} → to: ${to} — "${subject}"`);
    } catch (err) {
        console.error(`Email via ${provider} failed → to: ${to} — ${err.message}`);
        throw err;
    }
}

module.exports = { sendEmail };
