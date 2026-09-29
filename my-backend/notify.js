// Notification helper — emails the parent (via mailer.js)
// Called from sessionRoutes when a bad word is detected, screen time is up, or the tab is closed
const { sendEmail } = require('./mailer');

// Email the parent about a monitoring event
// type: 'detection' (bad word caught) | 'time-up' (screen time limit reached) | 'abandoned' (tab closed)
async function sendNotification({ email, childName, word, context, type = 'detection' }) {
    if (!email) return;

    const timeStr = new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const isTimeUp = type === 'time-up';
    const isAbandoned = type === 'abandoned';

    // Build subject and body depending on notification type
    const subject = isTimeUp
        ? `VigilKura — Screen time is up for ${childName}`
        : isAbandoned
        ? `VigilKura — Monitoring was interrupted for ${childName}`
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
            `Monitoring was interrupted for ${childName}.`,
            ``,
            `  Time: ${timeStr}`,
            ``,
            `The browser tab was closed while monitoring was active and wasn't reopened.`,
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

    // mailer.js already logs the failure — an alert that can't be sent shouldn't break the request
    await sendEmail({ to: email, subject, text: body }).catch(() => {});
}

module.exports = { sendNotification };
