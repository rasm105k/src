import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const server = http.createServer(app);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;

if (!PUBLIC_BASE_URL) {
  throw new Error("Missing PUBLIC_BASE_URL in .env");
}

app.get("/", (_req, res) => {
  res.send("Server is running");
});

const recordingsDir = path.join(process.cwd(), "recordings");
fs.mkdirSync(recordingsDir, { recursive: true });

app.post("/twilio/voice", (req, res) => {
  const wsUrl = PUBLIC_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");

  res.type("text/xml");
  res.send(`
<Response>
  <Say language="da-DK">Opkaldet forbindes nu.</Say>
  <Connect>
    <Stream url="${wsUrl}/call-stream" />
  </Connect>
</Response>
`);
});

const wss = new WebSocketServer({ server, path: "/call-stream" });

wss.on("connection", (ws) => {
  const callId = Date.now().toString();
  const ulawPath = path.join(recordingsDir, `${callId}.ulaw`);
  const wavPath = path.join(recordingsDir, `${callId}.wav`);

  const writeStream = fs.createWriteStream(ulawPath);

  console.log("Call stream connected:", callId);

  ws.on("message", async (message) => {
    const data = JSON.parse(message.toString());

    if (data.event === "start") {
      console.log("Twilio stream started:", data.start?.callSid);
    }

    if (data.event === "media") {
      const audioBuffer = Buffer.from(data.media.payload, "base64");
      writeStream.write(audioBuffer);
    }

    if (data.event === "stop") {
      console.log("Twilio stream stopped");
      writeStream.end();

      writeStream.on("finish", async () => {
        try {
          await convertUlawToWav(ulawPath, wavPath);
          const transcript = await transcribe(wavPath);
          const summary = await summarize(transcript);

          console.log("\n--- TRANSCRIPT ---");
          console.log(transcript);

          console.log("\n--- SUMMARY ---");
          console.log(JSON.stringify(summary, null, 2));
        } catch (err) {
          console.error("Processing failed:", err);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("WebSocket closed:", callId);
    writeStream.end();
  });
});

async function convertUlawToWav(inputPath: string, outputPath: string) {
  await execFileAsync(ffmpegPath!, [
    "-y",
    "-f",
    "mulaw",
    "-ar",
    "8000",
    "-ac",
    "1",
    "-i",
    inputPath,
    outputPath,
  ]);
}

async function transcribe(wavPath: string): Promise<string> {
  const result = await openai.audio.transcriptions.create({
    model: "gpt-4o-mini-transcribe",
    file: fs.createReadStream(wavPath),
    language: "da",
  });

  return result.text;
}

async function summarize(transcript: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `
Du er administrativ assistent for en dansk håndværkervirksomhed.

Analyser denne telefonsamtale og returnér KUN valid JSON.

Felter:
{
  "summary": "kort resume",
  "customerName": "kundens navn eller null",
  "phone": "telefonnummer eller null",
  "address": "adresse eller null",
  "problem": "kort beskrivelse af problemet",
  "urgent": true/false,
  "tasks": ["opgaver"],
  "calendarSuggestions": [
    {
      "title": "",
      "date": "",
      "time": "",
      "location": ""
    }
  ],
  "unclearItems": ["ting der er uklare"]
}

Regler:
- Opfind ikke information
- Brug null hvis noget ikke nævnes
- Marker usikkerheder i unclearItems

Transskription:
${transcript}
        `.trim(),
      },
    ],
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});