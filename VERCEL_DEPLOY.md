# 🚀 Deploy IELTS Co-Pilot to Vercel

## Step 1: Push to GitHub

```bash
# 1. Create a new repo on GitHub (do NOT initialize with README)
#    → https://github.com/new

# 2. Add remote and push
git branch -m main
git remote add origin https://github.com/YOUR_USERNAME/ielts-copilot.git
git push -u origin main
```

## Step 2: Deploy on Vercel

1. Go to **https://vercel.com/new**
2. Click **Import Git Repository**
3. Select your `ielts-copilot` repo
4. In the project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
5. Click **Environment Variables** and add:
   ```
   GROQ_API_KEY = <your-groq-api-key-here>
   ```
6. Click **Deploy**

## Step 3: Verify

After deployment (~30 seconds), Vercel gives you a URL like:
```
https://ielts-copilot.vercel.app
```

Open it → tap the mic → allow browser mic permission → start speaking!

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Vercel | 100 GB bandwidth, 10k function invocations/day |
| Groq | 1,500,000 tokens/day (~500 essays or ~2000 speaking turns) |

---

**Note**: Your `.env.local` contains the Groq key. On Vercel, NEVER commit `.env.local` — always use Vercel Dashboard → Settings → Environment Variables.
