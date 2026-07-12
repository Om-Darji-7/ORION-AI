interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  cancelBeforeSpeak?: boolean;
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const existingVoices = window.speechSynthesis.getVoices();

  if (existingVoices.length > 0) {
    return existingVoices;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const finish = () => {
      if (resolved) return;

      resolved = true;
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        finish
      );

      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      finish
    );

    window.setTimeout(finish, 800);
  });
}

function selectIgrisVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const preferredVoiceNames = [
    "Microsoft David",
    "Microsoft Mark",
    "Google UK English Male",
    "Daniel",
    "Alex",
  ];

  for (const preferredName of preferredVoiceNames) {
    const voice = voices.find((item) =>
      item.name
        .toLowerCase()
        .includes(preferredName.toLowerCase())
    );

    if (voice) return voice;
  }

  return (
    voices.find((voice) => voice.lang === "en-GB") ||
    voices.find((voice) => voice.lang === "en-US") ||
    voices.find((voice) => voice.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

export async function speakIgris(
  text: string,
  options: SpeakOptions = {}
): Promise<void> {
  const cleanText = text.trim();

  if (!cleanText) return;

  const {
    rate = 1.05,
    pitch = 1,
    volume = 1,
    cancelBeforeSpeak = false,
  } = options;

  if (cancelBeforeSpeak) {
    window.speechSynthesis.cancel();
  }

  const voices = await loadVoices();
  const selectedVoice = selectIgrisVoice(voices);

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onend = () => resolve();

    utterance.onerror = (event) => {
      console.error("IGRIS speech error:", event);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}