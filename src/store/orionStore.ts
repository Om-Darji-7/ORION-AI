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

  setState:(v:OrionState)=>void;

  setTranscript:(v:string)=>void;

  setResponse:(v:string)=>void;

}

export const useOrionStore=create<OrionStore>((set)=>({

    state:"idle",

    transcript:"",

    response:"",

    setState:(v)=>set({state:v}),

    setTranscript:(v)=>set({transcript:v}),

    setResponse:(v)=>set({response:v})

}));