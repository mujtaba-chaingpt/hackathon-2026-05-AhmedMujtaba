import type { User, Difficulty, PublicCase, GameSession, VerdictResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'mm_token';

// Token helpers
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (t: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, t);
  }
};

export const clearToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Base fetch (throws on non-2xx)
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json() as Promise<T>;
}

export interface StartCaseResponse {
  sessionId: string;
  difficulty: string;
  expiresAt: string;
  coinBalance: number;
  case: PublicCase;
}

export interface InterrogateResponse {
  answer: string;
  suspectName: string;
}

export interface HintResponse {
  hint: string;
}

// Typed API methods
export const api = {
  getMe: (): Promise<User> => apiFetch<User>('/auth/me'),

  startCase: (difficulty: Difficulty): Promise<StartCaseResponse> =>
    apiFetch<StartCaseResponse>('/case/start', {
      method: 'POST',
      body: JSON.stringify({ difficulty }),
    }),

  getSession: (sessionId: string): Promise<GameSession> =>
    apiFetch<GameSession>(`/case/${sessionId}`),

  /**
   * Tell the backend the player has finished reading the case file and the
   * timer should start now. Returns the fresh `expiresAt`. Idempotent on the
   * backend — re-clicks return the existing expiresAt without resetting.
   */
  beginTimer: (sessionId: string): Promise<{ sessionId: string; expiresAt: string }> =>
    apiFetch<{ sessionId: string; expiresAt: string }>(`/case/${sessionId}/begin`, {
      method: 'POST',
    }),

  interrogate: (
    sessionId: string,
    suspectId: string,
    question: string,
  ): Promise<InterrogateResponse> =>
    apiFetch<InterrogateResponse>('/interrogate', {
      method: 'POST',
      body: JSON.stringify({ sessionId, suspectId, question }),
    }),

  requestHint: (sessionId: string): Promise<HintResponse> =>
    apiFetch<HintResponse>('/hint', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  submitVerdict: (sessionId: string, accusedSuspectId: string): Promise<VerdictResult> =>
    apiFetch<VerdictResult>('/verdict', {
      method: 'POST',
      body: JSON.stringify({ sessionId, accusedSuspectId }),
    }),

  loginWithGoogle: (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = `${API_URL}/auth/google`;
    }
  },
};
