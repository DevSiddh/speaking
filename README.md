# 🎓 IELTS Co-Pilot

AI-powered Speaking & Writing practice for IELTS Band 7.0+.

Built with **Next.js**, powered by **Groq** (free LLM API), and designed as a responsive **PWA**.

---

## 🚀 One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDevSiddh%2Fspeaking&env=GROQ_API_KEY&envDescription=Your%20Groq%20API%20key%20for%20LLM%20grading&envLink=https%3A%2F%2Fconsole.groq.com%2Fkeys&project-name=ielts-copilot&repository-name=ielts-copilot)

### Required Environment Variable

| Variable | Get it from |
|----------|-------------|
| `GROQ_API_KEY` | https://console.groq.com/keys (free) |

---

## 🛠️ Local Development

```bash
git clone https://github.com/DevSiddh/speaking.git
cd speaking
npm install

# Add your Groq key
echo "GROQ_API_KEY=your_key_here" > .env.local

npm run dev
# Open http://localhost:3000
```

---

## ✨ Features

| Speaking | Writing |
|----------|---------|
| 🎤 Browser mic capture (MediaRecorder) | ✍️ Distraction-free essay editor |
| 🌊 Real-time waveform visualizer | ⏱️ Live timer + word counter |
| 🗣️ AI Interlocutor (fast responses) | 📝 Structured IELTS grading |
| 📊 Fluency feedback with fillers highlighted | 🔍 4-criteria rubric breakdown |

---

## 🏗️ Architecture

- **Frontend**: Next.js 16 + React + Tailwind CSS
- **State**: Zustand (persisted)
- **LLMs**: Groq (`llama-3.3-70b` for grading, `llama-3.1-8b` for chat)
- **Speech**: Web Speech API + MediaRecorder
- **Deployment**: Vercel Edge Functions

---

## 📄 License

MIT
