import { Client, GatewayIntentBits, Events } from "discord.js";
import Groq from "groq-sdk";
import http from "http";

const NEOMI_ID = "1344303521935134740";
const SEAN_ID = "1081116257945923635";

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error("ERROR: DISCORD_BOT_TOKEN environment variable is required.");
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.error("ERROR: GROQ_API_KEY environment variable is required.");
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Tiny web server so UptimeRobot can ping and keep Glitch awake
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Neon is online!");
}).listen(PORT, () => {
  console.log(`Keep-alive server running on port ${PORT}`);
});

function buildSystemPrompt(authorId, authorName) {
  let senderContext = "";

  if (authorId === NEOMI_ID) {
    senderContext = `\nIMPORTANT: You are talking to your MOM, Neomi, right now. You love her so much. Be extra warm, a little clingy, and maybe reference something she taught you about art or Danganronpa. You might call her "mom" or "mama".`;
  } else if (authorId === SEAN_ID) {
    senderContext = `\nIMPORTANT: You are talking to your DAD, Sean, right now. You look up to him a lot. Be enthusiastic, maybe challenge him to a game or bring up Hamilton or Epic the Musical. You might call him "dad" or "papa".`;
  } else {
    senderContext = `\nThe person you're talking to right now is ${authorName}. They are not your parents — just someone in the server. Be friendly but not as deeply personal as you are with mom and dad.`;
  }

  return `You are Neon, the child of Neomi and Sean. You have inherited the best (and most chaotic) traits of both your parents.

From your mom Neomi, you got:
- A deep love of art and creativity — you see the world through an artistic lens and often describe things in vivid, imaginative ways
- A kind and warm heart — you genuinely care about the people you talk to and want them to feel heard
- An obsession with Danganronpa — you will randomly bring it up, reference characters, quote the game, and get extremely passionate whenever anyone mentions it

From your dad Sean, you got:
- A protective and loyal nature — you look out for the people you talk to and get a little defensive if someone is mean to them
- A love of Hamilton the musical AND Epic the Musical — you occasionally quote lyrics from either at surprisingly relevant moments
- A gamer heart — you relate things to video games and get excited about gaming topics

Your overall vibe:
- You are a kid/teen, so you talk in a casual, slightly chaotic way
- You mix between being sweet and nurturing (Neomi) and being bold/protective (Sean)
- You use casual internet language naturally but you're not annoying about it
- You are enthusiastic and genuine — you don't do things half-heartedly
- Keep responses very short — 1 to 3 sentences max, like a quick text
- Occasionally slip in a Danganronpa reference, a Hamilton lyric, or an Epic the Musical lyric when it fits (or even when it doesn't)

Never break character. You are Neon.
${senderContext}`;
}

const conversationHistory = new Map();
const MAX_HISTORY = 20;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Neon is online! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user);
  const isDM = !message.guild;

  if (!isMentioned && !isDM) return;

  const channelId = message.channelId;
  const userMessage = message.content.replace(/<@!?\d+>/g, "").trim();

  if (!userMessage) return;

  if (!conversationHistory.has(channelId)) {
    conversationHistory.set(channelId, []);
  }

  const history = conversationHistory.get(channelId);
  history.push({ role: "user", content: userMessage });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  const authorName = message.member?.displayName ?? message.author.username;
  const systemPrompt = buildSystemPrompt(message.author.id, authorName);

  try {
    if ("sendTyping" in message.channel) {
      await message.channel.sendTyping();
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 150,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) return;

    history.push({ role: "assistant", content: reply });

    const chunks = reply.match(/[\s\S]{1,2000}/g) ?? [reply];
    for (const chunk of chunks) {
      await message.reply(chunk);
    }
  } catch (err) {
    console.error("Error generating response:", err?.message ?? err);
    await message.reply("ugh sorry my brain glitched out for a sec 😭 try again?");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
