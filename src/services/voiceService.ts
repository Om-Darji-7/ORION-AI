interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  cancelBeforeSpeak?: boolean;
}

let cachedVoice: SpeechSynthesisVoice | null = null;

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    return voices;
  }

  return new Promise((resolve) => {
    let completed = false;

    const finish = () => {
      if (completed) return;

      completed = true;

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

    window.setTimeout(finish, 1200);
  });
}

function selectEnglishVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (cachedVoice) {
    return cachedVoice;
  }

  const preferredVoices = [
    "Microsoft Ravi",
    "Microsoft Prabhat",
    "Google English India",
    "Microsoft David",
    "Microsoft Mark",
    "Google UK English Male",
  ];

  for (const preferredName of preferredVoices) {
    const voice = voices.find((item) =>
      item.name
        .toLowerCase()
        .includes(preferredName.toLowerCase())
    );

    if (voice) {
      cachedVoice = voice;
      return voice;
    }
  }

  const indianEnglishVoice = voices.find(
    (voice) =>
      voice.lang.toLowerCase() === "en-in"
  );

  if (indianEnglishVoice) {
    cachedVoice = indianEnglishVoice;
    return indianEnglishVoice;
  }

  const englishVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );

  cachedVoice = englishVoice || voices[0] || null;

  return cachedVoice;
}

export async function speakIgris(
  text: string,
  options: SpeakOptions = {}
): Promise<void> {
  const cleanText = text.trim();

  if (!cleanText) return;

  const {
    rate = 1,
    pitch = 0.9,
    volume = 1,
    cancelBeforeSpeak = false,
  } = options;

  if (cancelBeforeSpeak) {
    window.speechSynthesis.cancel();
  }

  const voices = await loadVoices();
  const selectedVoice = selectEnglishVoice(voices);

  console.log(
    "🔊 IGRIS English Voice:",
    selectedVoice?.name || "browser default",
    selectedVoice?.lang || "unknown"
  );

  return new Promise((resolve) => {
    const utterance =
      new SpeechSynthesisUtterance(cleanText);

    utterance.lang = "en-IN";

    if (selectedVoice) {
      utterance.voice = selectedVoice;
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