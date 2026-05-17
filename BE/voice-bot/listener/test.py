import argparse
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def transcribe_audio(audio_path: str) -> str:
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=audio_file,
            language="da"
        )

    return transcript.text


def analyze_transcript(transcript: str) -> dict:
    prompt = f"""
Du er administrativ assistent for en dansk servicevirksomhed.

Du får en transskriberet telefonsamtale.

Lav struktureret output med:
- kort opsummering
- aftaler
- opgaver
- kalenderforslag
- kundeinfo
- usikkerheder

Regler:
- Opfind ikke information
- Marker usikkerheder tydeligt
- Returnér kun JSON

Transcript:
{transcript}
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    text = response.output_text

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "raw_output": text,
            "error": "Model returned non-valid JSON"
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio_file", help="Path to audio file, e.g. call.mp3")
    args = parser.parse_args()

    audio_path = Path(args.audio_file)

    if not audio_path.exists():
        raise FileNotFoundError(f"File not found: {audio_path}")

    print("Transcribing audio...")
    transcript = transcribe_audio(str(audio_path))

    print("\n--- TRANSCRIPT ---")
    print(transcript)

    print("\nAnalyzing transcript...")
    result = analyze_transcript(transcript)

    print("\n--- AI RESULT ---")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()