# OEE Planner — Industrial Analytics

Interactive OEE monitoring and predictive machine failure analytics, powered by Gemini AI.

## Deploy to Vercel (3 steps)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/oee-planner.git
git push -u origin main
```

### 2. Import to Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Click **Import** on your GitHub repo
- Framework: **Vite** (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`

### 3. Add Environment Variable
In Vercel → Project → **Settings → Environment Variables**:
| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey) |

Click **Redeploy** after adding the key.

---

## Run Locally

```bash
npm install
# Create .env.local with: GEMINI_API_KEY=your_key_here
npm run dev
```

For local API routes, install Vercel CLI:
```bash
npm i -g vercel
vercel dev
```

## Features
- **Dashboard** — Upload OEE Excel files, view machine KPIs, shift performance charts
- **AI Failure Prediction** — Gemini-powered risk analysis per machine
- **Planner** — Predict OEE for upcoming shifts based on planned counts
