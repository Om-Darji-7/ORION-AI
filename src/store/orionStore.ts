import { create } from "zustand";

type OrionState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

interface OrionStore {
  state: OrionState;
  transcript: string;
  response: string;
  command: string;

  voiceActive: boolean;

  setState: (v: OrionState) => void;
  setTranscript: (v: string) => void;
  setResponse: (v: string) => void;
  setCommand: (v: string) => void;

  setVoiceActive: (v: boolean) => void;
}

export const useOrionStore =
  create<OrionStore>((set) => ({
    state: "idle",
    transcript: "",
    response: "",
    command: "",

    voiceActive: false,

    setState: (v) => set({ state: v }),
    setTranscript: (v) =>
      set({ transcript: v }),
    setResponse: (v) =>
      set({ response: v }),
    setCommand: (v) =>
      set({ command: v }),

    setVoiceActive: (v) =>
      set({ voiceActive: v }),
  }));