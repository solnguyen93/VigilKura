# VigilKura

**Live demo:** https://vigilkura.onrender.com

A web app that listens through the browser microphone during a child's screen time, shows a live transcript, and texts or emails parents when it hears words they've flagged. Parents set a word list and a session time limit for each child. Kid Mode takes over the tab so monitoring can't be stopped without a PIN, and you're alerted if the tab is closed. Past sessions are saved as transcripts, optionally translated into the parent's language with OpenAI.

## Features

- Real-time word detection via browser speech recognition (Chrome, English)
- Live transcript while monitoring, with flagged words blurred
- Custom word list per child with default profanity list
- Email and SMS alerts on detection or when the session time limit is reached
- Configurable minimum time between alerts to prevent notification spam
- Parent notified if the browser tab is closed during an active session
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
**Services:** OpenAI (translation), Brevo in production / Gmail locally (email), Twilio (SMS)

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

# Email (notifications and password reset)
# In production, use Brevo — Render's free web services can't reach SMTP servers like Gmail.
# When BREVO_API_KEY is set, email goes through Brevo's HTTP API; otherwise through Gmail SMTP.
BREVO_API_KEY=your_brevo_api_key            # optional locally, needed on Render
EMAIL_FROM=you@example.com                  # sender; must be a verified sender in Brevo
GMAIL_USER=your_gmail@gmail.com             # local fallback
GMAIL_APP_PASSWORD=your_gmail_app_password  # local fallback

# Twilio (for SMS notifications — optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

The frontend reads the backend URL from `my-frontend/.env` (defaults to `http://localhost:5000` if unset). Copy the example to get started:

```bash
cp my-frontend/.env.example my-frontend/.env
```

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

## Demo Account

A test account is available on the sign-in page:

- **Username:** testuser  
- **Password:** password  
- **PIN:** 0000

The demo account is shared, so its profile, password, and PIN are locked and it never sends email or SMS. The microphone works as usual on the demo account, and it also gets a text box while monitoring to simulate speech by typing — handy for trying word detection without a mic.

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
| phone | varchar | optional, for SMS |
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
- SMS requires an approved Twilio toll-free number with active verification
- Monitoring someone without their knowledge may violate laws in your area — this tool is intended for parents monitoring their own minor children on devices they own
