// One-time helper: authorizes VigilKura to send email as the Gmail account and prints a
// refresh token for GMAIL_REFRESH_TOKEN. Run locally, never on the server.
//
//   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/gmail-auth.js
//
// Needs a Google Cloud OAuth client of type "Desktop app" with the Gmail API enabled.
// Sign in as the account emails should come from (e.g. vigilkura@gmail.com).
const http = require('http');
require('dotenv').config();

const PORT = 5174;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send'; // send only — can't read the inbox

const { GMAIL_CLIENT_ID: clientId, GMAIL_CLIENT_SECRET: clientSecret } = process.env;
if (!clientId || !clientSecret) {
    console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET first (env vars or my-backend/.env).');
    process.exit(1);
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline', // ask for a refresh token
    prompt: 'consent', // always return one, even if authorized before
})}`;

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (!code && !error) {
        res.writeHead(404).end();
        return;
    }

    if (error) {
        res.end(`Authorization failed: ${error}. You can close this tab.`);
        console.error(`Authorization failed: ${error}`);
        server.close();
        return;
    }

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });
        const data = await tokenRes.json();
        if (!tokenRes.ok || !data.refresh_token) {
            throw new Error(data.error_description || data.error || 'No refresh token returned');
        }
        res.end('Done — the refresh token is in your terminal. You can close this tab.');
        console.log('\nGMAIL_REFRESH_TOKEN=' + data.refresh_token + '\n');
        console.log('Add it to Render (and my-backend/.env for local testing). Keep it secret.');
    } catch (err) {
        res.end(`Token exchange failed: ${err.message}. You can close this tab.`);
        console.error('Token exchange failed:', err.message);
    }
    server.close();
});

server.listen(PORT, () => {
    console.log('Open this link, sign in as the sending Gmail account, and allow "Send email on your behalf":\n');
    console.log(authUrl + '\n');
});
