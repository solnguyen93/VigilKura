// Notification helpers — sends email (via Gmail/nodemailer) and SMS (via Twilio)
// Called from sessionRoutes when a bad word is detected or screen time is up
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Gmail transporter — authenticates with an App Password, not the account password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Twilio client — only initialized if credentials are present in env vars
// If missing (e.g. local dev without Twilio set up), SMS calls are skipped silently
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;


// Send an email and/or SMS notification to the parent
// notify: 'email' | 'phone' | 'both'
// type: 'detection' (bad word caught) | 'time-up' (screen time limit reached)
async function sendNotification({ notify, email, phone, childName, word, context, type = 'detection' }) {
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const isTimeUp = type === 'time-up';
    const isAbandoned = type === 'abandoned';

    // Build subject and body depending on notification type
    const subject = isTimeUp
        ? `VigilKura — Screen time is up for ${childName}`
        : isAbandoned
        ? `VigilKura — Monitoring was stopped for ${childName}`
        : `VigilKura Alert — "${word}" detected while monitoring ${childName}`;
    const body = isTimeUp
        ? [
            `Screen time is up for ${childName}.`,
            ``,
            `  Time: ${timeStr}`,
            ``,
            `Log in to VigilKura to review the session.`,
          ].join('\n')
        : isAbandoned
        ? [
            `Monitoring was stopped for ${childName}.`,
            ``,
            `  Time: ${timeStr}`,
            ``,
            `The browser tab was closed while monitoring was active.`,
            ``,
            `Log in to VigilKura to review the session.`,
          ].join('\n')
        : [
            `Bad language was detected while monitoring ${childName}.`,
            ``,
            `  Word:    "${word}"`,
            `  Time:    ${timeStr}`,
            `  Context: "${context}"`,
            ``,
            `Log in to VigilKura to review the full session transcript and history.`,
          ].join('\n');

    // SMS body is shorter since texts have character limits
    const smsBody = isTimeUp
        ? `VigilKura [${timeStr}]: Screen time is up for ${childName}.`
        : isAbandoned
        ? `VigilKura [${timeStr}]: Monitoring was stopped — ${childName} closed the browser tab.`
        : `VigilKura [${timeStr}]: "${word}" detected while monitoring ${childName}. Context: "${context}"`;

    const promises = [];

    // Queue email if requested and an email address is available
    if ((notify === 'email' || notify === 'both') && email) {
        promises.push(
            transporter.sendMail({
                from: `"VigilKura" <${process.env.GMAIL_USER}>`,
                to: email,
                subject,
                text: body,
            }).catch((err) => console.error('Email send failed:', err))
        );
    }

    // Queue SMS if requested, a phone number is set, and Twilio is configured
    if ((notify === 'phone' || notify === 'both') && phone && twilioClient) {
        console.log(`SMS attempt → to: ${phone}`);
        promises.push(
            twilioClient.messages.create({
                body: smsBody,
                messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
                to: phone,
            }).then(() => console.log('SMS sent successfully'))
              .catch((err) => console.error('SMS send failed:', err.message))
        );
    }

    // Send email and SMS concurrently
    await Promise.all(promises);
}

module.exports = { sendNotification };
