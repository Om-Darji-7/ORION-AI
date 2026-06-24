import { create } from "zustand";

interface OrionState {
  command: string;
  response: string;    // 🔥 Orion ka AI response save karne ke liye
  voiceActive: boolean; 
  setCommand: (cmd: string) => void;
  setResponse: (res: string) => void; // 🔥 Response update karne ke liye
  setVoiceActive: (status: boolean) => void;
}

export const useOrionStore = create<OrionState>((set) => ({
  command: "",
  response: "",
  voiceActive: false,
  setCommand: (cmd: string) => set({ command: cmd }),
  setResponse: (res: string) => set({ response: res }),
  setVoiceActive: (status: boolean) => set({ voiceActive: status }),
}));
