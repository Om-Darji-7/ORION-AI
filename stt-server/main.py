from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI(title="IGRIS Local STT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RTX GPU:
# device="cuda", compute_type="float16"
#
# CPU fallback:
# device="cpu", compute_type="int8"

DEVICE = os.getenv("IGRIS_STT_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("IGRIS_STT_COMPUTE", "int8")
MODEL_SIZE = os.getenv("IGRIS_STT_MODEL", "small")

print(
    f"Loading Whisper model: "
    f"{MODEL_SIZE}, {DEVICE}, {COMPUTE_TYPE}"
)

try:
    model = WhisperModel(
        MODEL_SIZE,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
    )
except Exception as error:
    print("GPU model load failed:", error)
    print("Falling back to CPU int8.")

    model = WhisperModel(
        MODEL_SIZE,
        device="cpu",
        compute_type="int8",
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE,
    }


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
) -> dict:
    if not audio.filename:
        raise HTTPException(
            status_code=400,
            detail="Audio filename is missing.",
        )

    suffix = Path(audio.filename).suffix or ".webm"
    temporary_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temporary_file:
            temporary_path = temporary_file.name

            await audio.seek(0)

            shutil.copyfileobj(
                audio.file,
                temporary_file,
            )

        segments, info = model.transcribe(
            temporary_path,

            # Auto-detect Hindi, English, Hinglish, etc.
            language=None,

            # Remove silence and weak background-noise sections.
            vad_filter=True,

            vad_parameters={
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 250,
            },

            beam_size=5,
            temperature=0.0,
            condition_on_previous_text=False,
        )

        segment_list: list[dict] = []
        transcript_parts: list[str] = []

        for segment in segments:
            text = segment.text.strip()

            if not text:
                continue

            transcript_parts.append(text)

            segment_list.append(
                {
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": text,
                }
            )

        transcript = " ".join(transcript_parts).strip()

        return {
            "text": transcript,
            "language": info.language,
            "language_probability": round(
                info.language_probability,
                4,
            ),
            "duration": round(info.duration, 2),
            "segments": segment_list,
        }

    except Exception as error:
        print("Transcription failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {error}",
        ) from error

    finally:
        await audio.close()

        if temporary_path:
            try:
                os.remove(temporary_path)
            except OSError:
                pass