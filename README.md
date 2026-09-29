# VigilKura

**Live demo:** https://vigilkura.onrender.com

A web app that listens through the browser microphone during a child's screen time, shows a live transcript, and emails parents when it hears words they've flagged. Parents set a word list and a session time limit for each child. Kid Mode takes over the tab so monitoring can't be stopped without a PIN, and you're alerted if the tab is closed. Past sessions are saved as transcripts, optionally translated into the parent's language with OpenAI.

## Features

- Real-time word detection via browser speech recognition (Chrome, English)
- Live transcript while monitoring, with flagged words blurred
- Custom word list per child with default profanity list
- Email alerts on detection or when the session time limit is reached
- Configurable minimum time between alerts to prevent notification spam
- Parent emailed if the browser tab is closed during monitoring and not reopened within 45 seconds (on by default, per child)
- Per-session screen time limit with a warning before time is up
- Session history with full transcripts, filterable by child and time period
- Multi-child support with per-child settings
- Kid Mode — takes over the browser tab, hides results, and blocks the back button during monitoring
- PIN or password required to stop monitoring
- Transcript translation at session end (OpenAI)
- Forgot/reset password via email

## Tech Stack

**Frontend:** React, Material UI, Web Speech API  
**Backend:** Node.js, Express, PostgreSQL  
**Services:** OpenAI (translation), Gmail API (email)

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- A `.env` file in `my-backend/` (see below)

### 1. Clone the repo

```bash
git clone https://github.com/solnguyen93/VigilKura
cd VigilKura
```

### 2. Set up the database

```bash
createdb vigilkura
psql vigilkura
\i my-backend/setup.sql
\q
```

### 3. Configure environment variables

Create `my-backend/.env`:

```
PORT=5000

# PostgreSQL
PGUSER=your_pg_user
PGPASSWORD=your_pg_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=vigilkura

# JWT
JWT_SECRET=your_jwt_secret

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# OpenAI (for session transcript translation)
OPENAI_API_KEY=your_openai_key

# Email (notifications and password reset) — sent from a Gmail account
# Production uses the Gmail API over HTTPS, since Render's free web services block SMTP.
# Used when all three GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN are set; see "Email setup" below.
GMAIL_CLIENT_ID=your_oauth_client_id
GMAIL_CLIENT_SECRET=your_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
EMAIL_FROM=your_gmail@gmail.com             # must be the account the refresh token is for
# Local fallback without the Gmail API: Gmail SMTP with an App Password
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

The frontend reads the backend URL from `my-frontend/.env` (defaults to `http://localhost:5000` if unset). Copy the example to get started:

```bash
cp my-frontend/.env.example my-frontend/.env
```

### Email setup (Gmail API)

1. In [Google Cloud Console](https://console.cloud.google.com/), signed in as the sending Gmail account, create a project and enable the **Gmail API**.
2. Under **Google Auth Platform**, configure the consent screen (External), then under **Audience** click **Publish app** — apps left in "Testing" get refresh tokens that expire after 7 days.
3. Under **Clients**, create an OAuth client of type **Desktop app** and copy its client ID and secret.
4. Run `npm run gmail-auth` in `my-backend/` with `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` set, open the link, sign in as the sending account, and allow sending. Google may warn the app isn't verified — choose **Advanced → Go to (app)**, since it's your own app.
5. Copy the printed `GMAIL_REFRESH_TOKEN` into your `.env` and your host's environment settings.

The token only allows sending email (`gmail.send`), not reading the inbox.

### 4. Install dependencies and start

**Backend:**
```bash
cd my-backend
npm install
npm start
```

**Frontend:**
```bash
cd my-frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:5000`.

## Deployment

The live demo runs on free tiers:

- **Frontend:** Render static site (https://vigilkura.onrender.com)
- **Backend:** Render web service. It sleeps when idle, so the first request after a quiet period can take 20 to 30 seconds.
- **Database:** Neon (serverless PostgreSQL)

In production (`NODE_ENV=production`) the backend connects with `DATABASE_URL` over SSL instead of the `PG*` variables above, so set `DATABASE_URL` to your Neon connection string in the backend's environment settings.

## Demo Account

A test account is available on the sign-in page:

- **Username:** testuser  
- **Password:** password  
- **PIN:** 0000

The demo account is shared, so its profile, password, and PIN are locked and it never sends email alerts. The microphone works as usual on the demo account, and it also gets a text box while monitoring to simulate speech by typing — handy for trying word detection without a mic.

## Tips for best results

- Use Chrome — the Web Speech API only works there
- To focus on your own child, have them use headphones or a headset — the mic mainly hears them, while voices and sounds from a call, video, or game stay in the headphones
- Without headphones, the mic can also pick up people nearby or on a call, and audio from speakers, which may be flagged too
- The mic may pick up other people's voices; make sure they know monitoring is on, since some states require everyone's consent
- Leave the VigilKura tab open; closing it ends the session and alerts the parent

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| name | text | |
| username | text | unique |
| email | text | unique |
| password | text | bcrypt hashed |
| pin | varchar | optional 4-digit monitor PIN, bcrypt hashed |
| is_admin | boolean | default false |
| settings | jsonb | translation language preference |
| reset_token | text | for password reset |
| reset_token_expires | timestamp | |

### children
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| parent_id | integer | references users.id |
| name | text | |
| settings | jsonb | word list, screen time, notification settings |
| created_at | timestamp | |

### sessions
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| user_id | integer | references users.id |
| child_id | integer | references children.id |
| started_at | timestamp | |
| ended_at | timestamp | |
| duration_seconds | integer | |
| translated_transcript | jsonb | array of translated strings |
| translated_language | varchar | language used for translation |

### detections
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| session_id | integer | references sessions.id |
| user_id | integer | references users.id |
| word | text | flagged word |
| context | text | sentence it appeared in |
| detected_at | timestamp | |

### transcripts
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| session_id | integer | references sessions.id |
| text | text | one speech recognition result |
| recorded_at | timestamp | |

## Notes

- Speech recognition only works in Chrome (Web Speech API)
- VigilKura never records or stores audio. Chrome's speech recognition sends audio to Google's speech service for transcription; only the resulting text reaches the VigilKura backend
- Monitoring someone without their knowledge may violate laws in your area — this tool is intended for parents monitoring their own minor children on devices they own
