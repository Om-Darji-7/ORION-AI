import sys
import asyncio
import edge_tts

async def amain() -> None:
    # Safely extract incoming single text string argument from Node process
    if len(sys.argv) < 2:
        return
    text_to_speak = sys.argv[1]
    
    # Strictly utilizing the deep masculine en-IN-PrabhatNeural voice profile
    voice_profile = "en-IN-PrabhatNeural"
    
    communicate = edge_tts.Communicate(text_to_speak, voice_profile)
    
    # Flush binary data bytes directly to the terminal stdout stream matrix line
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            sys.stdout.buffer.write(chunk["data"])
            sys.stdout.buffer.flush() # Force instant flash flush to prevent lagging delays

if __name__ == "__main__":
    asyncio.run(amain())
