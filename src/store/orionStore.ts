import { create } from "zustand";

type OrionStore = {
  command: string;
  setCommand: (v: string) => void;
};

export const useOrionStore =
  create<OrionStore>((set) => ({
    command: "",
    setCommand: (v) =>
      set({ command: v }),
  }));