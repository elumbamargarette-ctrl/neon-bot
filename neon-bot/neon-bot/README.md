# Neon Bot

## Deploy to Glitch (free, no credit card)

1. Go to glitch.com → sign up free
2. Click "New Project" → "Import from GitHub" → paste your repo URL
3. Open the `.env` file in Glitch and add:
   - DISCORD_BOT_TOKEN=your_token
   - GROQ_API_KEY=your_key
4. Glitch will auto-start the bot

### Keep it awake 24/7 with UptimeRobot
1. Go to uptimerobot.com → sign up free
2. Add New Monitor → HTTP(s)
3. URL: https://your-project-name.glitch.me
4. Interval: every 5 minutes
5. Save — Neon will stay awake!

## Environment Variables
- `DISCORD_BOT_TOKEN` — your Discord bot token
- `GROQ_API_KEY` — free at console.groq.com (no credit card needed)
