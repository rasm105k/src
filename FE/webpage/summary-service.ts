import "dotenv/config";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TELNYX_API_KEY = process.env.TELNYX_API_KEY!;
const TELNYX_PHONE_NUMBER = process.env.TELNYX_PHONE_NUMBER!;

interface CallSummary {
  name?: string;
  phone: string;
  datetime: string;
  duration: string;
  problem: string;
  urgent: boolean;
  wantsCallback: boolean;
  address?: string;
  rawTranscript: string;
}

export function parseTimestamp(ts: Date): string {
  return ts.toLocaleDateString("da-DK", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} sek` : `${s} sek`;
}

export function buildSummaryPrompt(transcript: string): string {
  return `Du er en assistent for en dansk håndværker. Lav et kort resume af denne kundesamtale.

Transskription:
${transcript}

Svar præcist i dette JSON-format uden anden tekst:
{
  "name": "kundens navn (find det i samtalen)",
  "phone": "telefonnummer",
  "problem": "kort beskrivelse af problemet (1-2 sætninger)",
  "urgent": true/false,
  "wantsCallback": true/false,
  "address": "adresse hvis nævnt, ellers null"
}`;
}

export async function generateSummary(transcript: string, callerPhone: string): Promise<CallSummary> {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "user" as const, content: buildSummaryPrompt(transcript) },
    ],
    response_format: { type: "json_object" as const },
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`OpenAI summary failed: ${await res.text()}`);

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    name: parsed.name || "Ukendt",
    phone: callerPhone,
    datetime: parseTimestamp(new Date()),
    duration: "",
    problem: parsed.problem || "Ingen beskrivelse",
    urgent: parsed.urgent || false,
    wantsCallback: parsed.wantsCallback || false,
    address: parsed.address || undefined,
    rawTranscript: transcript,
  };
}

export function formatSms(summary: CallSummary): string {
  const lines = [
    `📋 Kunde: ${summary.name}`,
    `📞 Tlf: ${summary.phone}`,
    `📅 Tid: ${summary.datetime}`,
    summary.duration ? `⏱ Varighed: ${summary.duration}` : "",
    `❓ Problem: ${summary.problem}`,
    summary.address ? `🏠 Adresse: ${summary.address}` : "",
    summary.urgent ? "⚠️ HASTER!" : "✅ Haster ikke",
    summary.wantsCallback ? "📞 Kunden ønsker at blive ringet op" : "",
  ].filter(Boolean).join("\n");

  return lines;
}

export async function sendSms(to: string, text: string): Promise<void> {
  const res = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: TELNYX_PHONE_NUMBER,
      to,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("SMS send error:", err);
  }
}
