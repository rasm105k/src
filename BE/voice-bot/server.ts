import "dotenv/config";
import express from "express";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

app.use(express.json());
app.use(express.static("public"));

app.post("/api/token", async (_req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: 600,
        },
        session: {
          type: "realtime",
          instructions: "Du er en passiv lytter. Transskriber kun samtalen. Svar aldrig.",
          audio: {
            input: {
              format: {
                type: "audio/pcm",
                rate: 24000
            },
              transcription: { model: "whisper-1" }
            },
            output: {
              format: {
                 type: "audio/pcm",
                  rate: 24000
              },
              voice: "alloy",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI token error:", response.status, err);
      res.status(response.status).send(err);
      return;
    }

    const data = await response.json();
    res.json({
      token: data.value,
      expires_at: data.expires_at,
    });
  } catch (e: any) {
    console.error("Token error:", e);
    res.status(500).send(e.message);
  }
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || transcript.trim().length === 0) {
      res.status(400).json({ error: "Missing or empty transcript" });
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Du er en assistent for en dansk håndværkervirksomhed. Lav et kort resume af denne kundesamtale.

Transskription:
${transcript}

Svar præcist i dette JSON-format uden anden tekst:
{
  "name": "kundens navn (find det i samtalen)",
  "phone": "telefonnummer hvis nævnt, ellers null",
  "problem": "kort beskrivelse af problemet (1-2 sætninger)",
  "urgent": true/false,
  "wantsCallback": true/false,
  "address": "adresse hvis nævnt, ellers null",
  "agreedNextSteps": "hvad blev der aftalt?",
  "unclearItems": "hvad er uklart?"
}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI summary error:", response.status, err);
      res.status(response.status).send(err);
      return;
    }

    const data = await response.json();
    const summary = JSON.parse(data.choices[0].message.content);
    res.json(summary);
  } catch (e: any) {
    console.error("Summary error:", e);
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
