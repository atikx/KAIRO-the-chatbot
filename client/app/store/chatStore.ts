import { create } from "zustand";

export type Role = "user" | "assistant";

export interface Message {
    id: string;
    role: Role;
    content: string;
}

interface ChatStore {
    chatId: string;
    messages: Message[];
    addMessage: (msg: Message) => void;
    clearMessages: () => void;
}

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatStore>((set) => ({
    // One stable session ID for the whole browser tab lifetime
    chatId: `admin-${uid()}`,
    messages: [],
    addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
    clearMessages: () => set({ messages: [] }),
}));
