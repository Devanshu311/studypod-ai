# StudyPod AI — Cloud Deployment Guide (100% Free & No Laptop Needed)

This guide walks you through deploying **StudyPod AI** completely to the cloud so that it runs **24/7 on the internet**, stores data permanently in a **cloud PostgreSQL database**, and can be used by anyone from any phone, tablet, or computer **without your laptop being open or turned on**.

---

## 🏗️ Cloud Architecture

```
                    ┌────────────────────────────┐
                    │      GitHub Repository     │
                    └──────────────┬─────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │        Netlify        │                 │        Render         │
   │   (Frontend Host)     │                 │   (FastAPI Backend)   │
   │  https://...netlify.app  │                 │ https://...onrender.com │
   └──────────┬────────────┘                 └──────────┬────────────┘
              │ (REST / WebSockets)                     │ (SQLAlchemy)
              └────────────────────► ◄──────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   Cloud PostgreSQL  │
                          │ (Neon/Supabase/Render│
                          └─────────────────────┘
```

---

## ⏱️ Quick Summary (3 Steps)

1. **Push your code to GitHub** (1 min)
2. **Deploy Backend & Cloud Database on Render** (2 min)
3. **Deploy Frontend on Netlify** (2 min)

Total cost: **$0.00 / month (Free Tier)**

---

## Step 1: Push Code to GitHub

Open Terminal and run:

```bash
cd /Users/devanshu/.gemini/antigravity/scratch/studypod-ai

# Initialize git if not already done
git init
git add .
git commit -m "feat: complete StudyPod AI with Netlify and Cloud Postgres deployment setup"

# Create a new repository on GitHub (https://github.com/new) named "studypod-ai"
# Then link and push:
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/studypod-ai.git
git push -u origin main
```

---

## Step 2: Deploy Cloud Database & Backend (on Render)

Render provides free hosting for Python FastAPI, WebSockets, and PostgreSQL databases.

### Option A: 1-Click with `render.yaml` (Recommended)
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Select your `studypod-ai` repository.
4. Render will read `render.yaml` and automatically configure:
   - A free **PostgreSQL Database** (`studypod-db`)
   - A free **Python Web Service** (`studypod-backend`)
5. Click **Apply**.
6. When deployment finishes, copy your backend URL:
   `https://studypod-backend-xxxx.onrender.com`

### Option B: Manual Setup on Render
1. **Create Database**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** → **PostgreSQL**.
   - Name: `studypod-db`, Plan: **Free**.
   - Click **Create Database** and copy the **Internal Database URL** (or External if hosting backend elsewhere).
2. **Create Web Service**:
   - Click **New +** → **Web Service**.
   - Connect your GitHub repo `studypod-ai`.
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `DATABASE_URL`: *(paste the Postgres connection URL from Step 1)*
     - `SECRET_KEY`: *(type any random 32-character string)*
     - `OPENAI_API_KEY`: *(optional: your OpenAI key for AI coach)*
   - Click **Create Web Service**.
   - Copy your service URL (e.g., `https://studypod-backend.onrender.com`).

---

## Step 3: Deploy Frontend (on Netlify)

1. Go to [netlify.com](https://app.netlify.com) and sign in with GitHub.
2. Click **Add new site** → **Import an existing project**.
3. Select **GitHub** and pick the `studypod-ai` repository.
4. Configure Build Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist` (or `dist` if base is set to `frontend`)
5. **Add Environment Variables** (Click "Add environment variables"):
   - Key: `VITE_API_URL`
     - Value: `https://studypod-backend-xxxx.onrender.com/api` *(your Render backend URL + /api)*
   - Key: `VITE_WS_URL`
     - Value: `https://studypod-backend-xxxx.onrender.com` *(your Render backend URL)*
6. Click **Deploy studypod-ai**.

Netlify will build your site in ~30 seconds and give you a live URL like:
👉 **`https://studypod-ai-xxxx.netlify.app`**

---

## 🌐 Alternative: Using Neon.tech or Supabase for PostgreSQL

If you prefer a dedicated serverless database like **Neon** or **Supabase**:
1. Create a free project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Copy the PostgreSQL connection URI:
   `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`
3. In your Render / Backend environment settings, paste that URI as `DATABASE_URL`.
4. The backend automatically auto-creates all tables (`users`, `pods`, `messages`, `milestones`, `pomodoro_sessions`, `study_logs`) on startup!

---

## ✅ You're Done!

Now:
- Your application is accessible to any student worldwide.
- All user accounts, study pods, chat conversations, milestones, and Pomodoro timers are safely stored in the cloud.
- Everything runs independently — you can shut down or disconnect your laptop at any time!
