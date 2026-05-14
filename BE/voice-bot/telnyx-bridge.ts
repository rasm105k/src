import "dotenv/config";
import WebSocket from "ws";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_PROMPT_ID = process.env.OPENAI_PROMPT_ID!;
const REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";

export type BridgeMode = "listen" | "talk";

export interface BridgeCallbacks {
  onTranscript?: (text: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

export function connectToOpenAI(mode: BridgeMode, callbacks?: BridgeCallbacks): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(REALTIME_URL, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    ws.onopen = () => {
      const sessionUpdate = {
        type: "session.update",
        session: {
          prompt: {
            id: OPENAI_PROMPT_ID,
            version: "8",
          },
          input_audio_format: "pcmu" as const,
          output_audio_format: "pcmu" as const,
          turn_detection: mode === "talk"
            ? { type: "server_vad" as const }
            : null,
          input_audio_transcription: {
            model: "whisper-1",
          },
          ...(mode === "listen"
            ? { instructions: "Du lytter kun og transskriberer. Svar aldrig." }
            : {}),
        },
      };

      ws.send(JSON.stringify(sessionUpdate));
      resolve(ws);
    };

    ws.onerror = (err) => {
      reject(new Error(`OpenAI WebSocket error: ${err.message}`));
    };

    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data.toString());

        if (event.type === "conversation.item.input_audio_transcription.completed") {
          callbacks?.onTranscript?.(event.transcript);
        }

        if (event.type === "response.done") {
          if (mode === "listen" && event.response?.status === "in_progress") {
            ws.send(JSON.stringify({ type: "response.cancel" }));
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      callbacks?.onDone?.();
    };
  });
}

export function forwardToOpenAI(openaiWs: WebSocket, audioPayload: string): void {
  if (openaiWs.readyState === WebSocket.OPEN) {
    openaiWs.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: audioPayload,
    }));
  }
}

export function forwardToTelnyx(telnyxWs: WebSocket, audioPayload: string): void {
  if (telnyxWs.readyState === WebSocket.OPEN) {
    telnyxWs.send(JSON.stringify({
      event: "media",
      payload: audioPayload,
    }));
  }
}
