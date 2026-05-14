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

app.use(express.static("public"));

app.post("/session", express.text({ type: "application/sdp" }), async (req, res) => {
  try {
    const sdp = req.body;

    const form = new FormData();
    form.append("sdp", new Blob([sdp], { type: "application/sdp" }));

    const sessionConfig = {
      modalities: ["audio", "text"],
      instructions: `Du er en professionel dansk telefondame for en håndværksvirksomhed (VVS, elektriker, tømrer). Du svarer venligt og hjælpsomt på dansk. Spørg kunden hvad problemet er og om det er akut. Hold samtalen kort og professionel.`,
      voice: "alloy",
      input_audio_format: "g711_ulaw",
      output_audio_format: "g711_ulaw",
      turn_detection: { type: "server_vad" },
      input_audio_transcription: { model: "whisper-1" },
    };

    form.append("session_config", new Blob([JSON.stringify(sessionConfig)], { type: "application/json" }));

    const openaiRes = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: form,
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, err);
      res.status(openaiRes.status).send(err);
      return;
    }

    const data: any = await openaiRes.json();
    res.type("application/sdp").send(data.sdp);
  } catch (e: any) {
    console.error("Session error:", e);
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
