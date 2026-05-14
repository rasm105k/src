export interface TelnyxCallIncoming {
  event_type: "call.incoming";
  call_control_id: string;
  call_leg_id: string;
  from: string;
  to: string;
  state: string;
}

export interface TelnyxCallAnswered {
  event_type: "call.answered";
  call_control_id: string;
  call_leg_id: string;
  from: string;
  to: string;
}

export interface TelnyxCallHangup {
  event_type: "call.hangup";
  call_control_id: string;
  call_leg_id: string;
  from: string;
  to: string;
  cause: string;
}

export interface TelnyxMediaPayload {
  event: "media";
  stream_id: string;
  payload: string; // base64 PCMU
}

export interface TelnyxStartPayload {
  event: "start";
  stream_id: string;
  call_control_id: string;
  media_format: { encoding: string; sample_rate: number };
}

export interface TelnyxStopPayload {
  event: "stop";
  stream_id: string;
}

export type TelnyxWebSocketMessage = TelnyxMediaPayload | TelnyxStartPayload | TelnyxStopPayload;

export interface OpenAIAudioDelta {
  type: "response.audio.delta";
  delta: string;
  item_id: string;
}

export interface OpenAITranscriptCompleted {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface OpenAIResponseDone {
  type: "response.done";
  response: { status: string };
}

export type OpenAIServerEvent = OpenAIAudioDelta | OpenAITranscriptCompleted | OpenAIResponseDone;
