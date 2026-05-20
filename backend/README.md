# AI Habit Tracker — Backend

Express + MongoDB + Gemini AI REST API.

---

## Deploy in 5 minutes

### Option A — Render.com (recommended, free tier)
1. Push this `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo
3. Render auto-detects `render.yaml` — click **Deploy**
4. In the Render dashboard → **Environment**, add:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com/app/apikey)
   - `CLIENT_URL` — your frontend URL (e.g. `https://myapp.vercel.app`)
5. Done — your API URL will be `https://<your-service>.onrender.com`

### Option B — Railway.app
1. Push this folder to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Add the environment variables (same as above) in the Railway dashboard
4. Railway uses `railway.json` automatically

### Option C — Heroku
1. `heroku create your-app-name`
2. `heroku config:set MONGO_URI=... JWT_SECRET=... GEMINI_API_KEY=... CLIENT_URL=...`
3. `git push heroku main`

### Option D — Any VPS / DigitalOcean
```bash
git clone <your-repo>
cd backend
npm install
cp .env.example .env   # fill in your values
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Random string, min 64 chars |
| `JWT_EXPIRES_IN` | ✅ | Token lifetime, e.g. `30d` |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `GEMINI_MODEL` | optional | Default: `gemini-2.5-flash` |
| `CLIENT_URL` | ✅ | Frontend URL for CORS (comma-separate multiple) |
| `PORT` | auto | Set by host automatically |

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Local development
```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # starts with nodemon
```

API runs at `http://localhost:8000`. Health check: `GET /api/health`
