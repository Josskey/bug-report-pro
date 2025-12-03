import { create } from "zustand";

export type BugReport = {
  id: string;
  title: string;
  description: string;
  environment: string;
  priority: number;
  steps: string[];
  actualResult: string;
  expectedResult: string;
  score: number;
  severity: number;
  penalties: string[];
  createdAt: string;
  timestamp: string;
};

const CARD_ORDER = [
  "login-form",
  "profile-form",
  "task-list",
  "payment-form",
  "settings-form"
];

type Mode = "normal" | "timed" | "theory";

type Store = {
  result: BugReport | null;
  history: BugReport[];
  mode: Mode;
  startTime: number | null;
  hasProAccess: boolean;
  completedCards: string[];
  setMode: (mode: Mode) => void;
  loadMode: () => void;
  setProAccess: (email: string, value: boolean) => void;
  loadProAccess: (email: string) => void;
  startTimer: () => void;
  stopTimer: () => void;
  getElapsedTime: () => number;
  loadStartTime: () => void;
  setResult: (r: Omit<BugReport, "id" | "createdAt">) => void;
  clearHistory: () => void;
  addToHistory: (r: BugReport) => void;
  markCardComplete: (id: string) => void;
  isCardUnlocked: (id: string) => boolean;
  loadProgress: () => void;
  logout: () => void;
};

const loadHistory = (): BugReport[] => {
  try {
    const raw = localStorage.getItem("bug-history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadProgress = (): string[] => {
  try {
    const raw = localStorage.getItem("card-progress");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useAppStore = create<Store>((set, get) => ({
  result: null,
  history: loadHistory(),
  completedCards: loadProgress(),
  mode: (() => {
    const raw = localStorage.getItem("selected-mode");
    return raw === "timed" || raw === "normal" || raw === "theory" ? raw : "normal";
  })(),
  startTime: (() => {
    const raw = localStorage.getItem("start-time");
    return raw ? Number(raw) : null;
  })(),
  hasProAccess: false,

  setMode: (mode) => {
    localStorage.setItem("selected-mode", mode);
    set({ mode });
  },

  loadMode: () => {
    const raw = localStorage.getItem("selected-mode");
    if (raw === "timed" || raw === "normal" || raw === "theory") {
      set({ mode: raw });
    }
  },

  setProAccess: (email, value) => {
    const raw = localStorage.getItem("pro-access-map");
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    map[email] = value;
    localStorage.setItem("pro-access-map", JSON.stringify(map));
    set({ hasProAccess: value });
  },

  loadProAccess: (email) => {
    const raw = localStorage.getItem("pro-access-map");
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    set({ hasProAccess: map[email] === true });
  },

  startTimer: () => {
    const existing = localStorage.getItem("start-time");
    if (existing) return;
    const now = Date.now();
    localStorage.setItem("start-time", String(now));
    set({ startTime: now });
  },

  stopTimer: () => {
    localStorage.removeItem("start-time");
    set({ startTime: null });
  },

  getElapsedTime: () => {
    const { startTime } = get();
    return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  },

  loadStartTime: () => {
    const raw = localStorage.getItem("start-time");
    set({ startTime: raw ? Number(raw) : null });
  },

  setResult: (r) => {
    const newReport: BugReport = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
    };
    const updated = [...loadHistory(), newReport];
    localStorage.setItem("bug-history", JSON.stringify(updated));
    set({ result: newReport, history: updated });
    localStorage.removeItem("start-time");
    set({ startTime: null });
  },

  addToHistory: (r) => {
    const updated = [...loadHistory(), r];
    localStorage.setItem("bug-history", JSON.stringify(updated));
    set({ history: updated });
  },

  clearHistory: () => {
    localStorage.removeItem("bug-history");
    localStorage.removeItem("start-time");
    localStorage.removeItem("card-progress");
    set({ history: [], result: null, startTime: null, completedCards: [] });
  },

  markCardComplete: (id) => {
    const current = loadProgress();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem("card-progress", JSON.stringify(updated));
      set({ completedCards: updated });
    }
  },

  isCardUnlocked: (id) => {
    const index = CARD_ORDER.indexOf(id);
    if (index === -1) return true;
    if (index === 0) return true;
    const prevId = CARD_ORDER[index - 1];
    return get().completedCards.includes(prevId);
  },

  loadProgress: () => {
    set({ completedCards: loadProgress() });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
    localStorage.removeItem("bug-history");
    localStorage.removeItem("start-time");
    localStorage.removeItem("card-progress");
    set({
      history: [],
      result: null,
      startTime: null,
      completedCards: [],
      hasProAccess: false,
      mode: "normal",
    });
  }
}));











