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
  command: string; // 👈 Added command property to fix BottomPanel.tsx compilation error
  setState: (v: OrionState) => void;
  setTranscript: (v: string) => void;
  setResponse: (v: string) => void;
  setCommand: (v: string) => void; // 👈 Added setter for future automation phases
}

export const useOrionStore = create<OrionStore>((set) => ({
  state: "idle",
  transcript: "",
  response: "",
  command: "", // 👈 Initialized with an empty string layer to satisfy TS compiler
  setState: (v) => set({ state: v }),
  setTranscript: (v) => set({ transcript: v }),
  setResponse: (v) => set({ response: v }),
  setCommand: (v) => set({ command: v }) // 👈 Maps setter logic cleanly
}));
