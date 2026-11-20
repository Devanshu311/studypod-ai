# StudyPod AI 🎓

**Automated Micro-Peer Study Group Matcher & Accountability Coach**

StudyPod AI groups university students studying for the same exams into small, randomized "Study Pods" of 4 people. An AI bot moderates the group, sets up micro-milestones, tracks shared Pomodoro focus sessions, and alerts peers if a member is falling behind on their study schedule.

## Features

- 🎯 **Smart Pod Matching** — Queue-based matching pairs you with 3 peers studying for the same exam
- 🤖 **AI Study Coach** — GPT-powered bot that sets milestones, motivates, and holds you accountable
- 🍅 **Group Pomodoro** — Synchronized focus sessions with your pod (25min/50min presets)
- 📊 **Milestone Tracker** — Kanban-style board to track study goals (To Do → In Progress → Done)
- 💬 **Real-Time Chat** — Socket.IO powered pod chat with typing indicators and presence
- 🔥 **Streak Tracking** — Daily study streaks and accountability alerts
- 📈 **Accountability** — Automated nudges when members fall behind on their study schedule

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| State | Zustand |
| Backend | Python, FastAPI |
| Database | SQLite (SQLAlchemy ORM) |
| Real-Time | Socket.IO (python-socketio) |
| AI | OpenAI GPT API |
| Scheduler | APScheduler |
| Auth | JWT (PyJWT + passlib/bcrypt) |

## Project Structure

```
studypod-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── models/              # ORM models (User, Pod, Milestone, etc.)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic (matching, AI, accountability)
│   │   ├── websocket/           # Socket.IO event handlers
│   │   └── utils/               # JWT, password hashing
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, Avatar, PomodoroTimer, etc.
│   │   ├── pages/               # Landing, Auth, Dashboard, Chat, Milestones, etc.
│   │   ├── services/            # API client (Axios) & Socket.IO client
│   │   ├── store/               # Zustand state stores
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Router & layout
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY (optional — works without it using fallback responses)

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies API requests to backend on port 8000)
npm run dev
```

The app will be available at **http://localhost:5173**

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | `sqlite:///./studypod.db` | Database connection string |
| `SECRET_KEY` | Yes | — | JWT signing secret (change in production!) |
| `OPENAI_API_KEY` | No | — | OpenAI API key for AI coach (uses fallback if not set) |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token lifetime |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |

### Pods
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/pods/join-queue` | Enter matching queue |
| GET | `/api/pods/queue-status` | Check queue position |
| GET | `/api/pods/my-pods` | List user's active pods |
| GET | `/api/pods/{pod_id}` | Pod details with members |
| POST | `/api/pods/{pod_id}/leave` | Leave a pod |

### Milestones
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/milestones/` | Create milestone |
| GET | `/api/milestones/pod/{pod_id}` | List pod milestones |
| PATCH | `/api/milestones/{id}/status` | Update milestone status |
| GET | `/api/milestones/my` | List user's milestones |

### Pomodoro
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/pomodoro/start` | Start group Pomodoro session |
| POST | `/api/pomodoro/join/{id}` | Join active session |
| POST | `/api/pomodoro/complete/{id}` | Mark session complete |
| GET | `/api/pomodoro/active/{pod_id}` | Get active session |
| GET | `/api/pomodoro/history/{pod_id}` | Session history |

### WebSocket Events
| Event | Direction | Description |
|---|---|---|
| `join_pod` | Client → Server | Join pod chat room |
| `send_message` | Client → Server | Send chat message |
| `typing` | Client → Server | Typing indicator |
| `new_message` | Server → Client | New message received |
| `start_pomodoro` | Client → Server | Start group session |
| `pomodoro_started` | Server → Client | Session started notification |

## Pricing Model

| Feature | Free | Premium ($4.99/mo) |
|---|---|---|
| Pod Matching | ✅ | ✅ |
| Group Chat | ✅ | ✅ |
| Pomodoro Timer | ✅ | ✅ |
| Active Pods | 1 | Unlimited |
| AI Coaching | Basic | Advanced |
| Analytics | — | ✅ |
| Custom Study Plans | — | ✅ |
| Priority Matching | — | ✅ |

## License

MIT
