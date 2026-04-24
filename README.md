# VigilKura

A parental monitoring tool that listens through the device microphone during screen time and alerts parents when flagged words are detected. Sessions are logged with transcripts, detections, and optional email/SMS notifications.

## Features

- Real-time word detection via browser speech recognition (Chrome)
- Custom word list per child with default profanity list
- Email and SMS alerts on detection or screen time limit reached
- Configurable minimum time between alerts to prevent notification spam
- Parent notified if the browser tab is closed during an active session
- Screen time limits with countdown warnings
- Session history with searchable transcripts
- Multi-child support with per-child settings
- Kid Mode — locks the screen and blocks navigation during monitoring
- PIN or password required to stop monitoring
- Transcript translation at session end (OpenAI)
- Forgot/reset password via email

## Tech Stack

**Frontend:** React, Material UI, Web Speech API  
**Backend:** Node.js, Express, PostgreSQL  
**Services:** OpenAI (translation), Gmail/Nodemailer (email), Twilio (SMS)

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

# Gmail (for email notifications and password reset)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Twilio (for SMS notifications — optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
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
| pin | varchar | optional 4-digit monitor PIN |
| is_admin | boolean | default false |
| settings | jsonb | notification + translation preferences |
| reset_token | text | for password reset |
| reset_token_expires | timestamptz | |

### children
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| parent_id | integer | references users.id |
| name | text | |
| settings | jsonb | word list, screen time, notification settings |
| created_at | timestamptz | |

### sessions
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| user_id | integer | references users.id |
| child_id | integer | references children.id |
| started_at | timestamptz | |
| ended_at | timestamptz | |
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
| detected_at | timestamptz | |

### transcripts
| Column | Type | Notes |
|---|---|---|
| id | serial | primary key |
| session_id | integer | references sessions.id |
| text | text | one speech recognition result |
| recorded_at | timestamptz | |

## Notes

- Speech recognition only works in Chrome (Web Speech API)
- No audio is ever recorded or uploaded — only the transcribed text is stored
- SMS requires an approved Twilio toll-free number with active verification
- Monitoring someone without their knowledge may violate laws in your area — this tool is intended for parents monitoring their own minor children on devices they own
