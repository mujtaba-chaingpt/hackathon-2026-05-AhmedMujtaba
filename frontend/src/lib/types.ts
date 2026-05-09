export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  coinBalance: number;
}

export interface Suspect {
  id: string;
  role: 'suspect';
  name: string;
  age: number;
  gender?: 'male' | 'female';
  relationship_to_victim: string;
  why_suspect: string;
  alibi: string;
  personality: string;
}

export interface Witness {
  id: string;
  role: 'witness';
  name: string;
  age: number;
  gender?: 'male' | 'female';
  relationship_to_suspects: string;
  why_relevant: string;
  alibi: string;
  personality: string;
}

export type Character = Suspect | Witness;

export interface PublicCase {
  setting?: string;
  victim: {
    name: string;
    age?: number;
    occupation: string;
    background?: string;
    last_known_movements?: string;
    found_at: string;
    time_of_death: string;
    cause: string;
  };
  crime_scene_description: string;
  initial_evidence?: string[];
  suspects: Suspect[];
  witnesses: Witness[];
}

export interface GameSession {
  sessionId: string;
  difficulty: Difficulty;
  status: 'active' | 'won' | 'lost' | 'expired';
  expiresAt: string;
  hintUsed: boolean;
  case: PublicCase;
}

export interface InterrogationMessage {
  role: 'detective' | 'suspect';
  content: string;
  suspectName?: string;
  timestamp: number;
}

export interface VerdictResult {
  correct: boolean;
  reveal: string;
  coinBalance: number;
  coinsEarned: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyInfo {
  label: string;
  coins: number;
  reward: number;
  description: string;
  suspects: string;
  time: string;
}

export const DIFFICULTY_INFO: Record<Difficulty, DifficultyInfo> = {
  easy: {
    label: 'EASY',
    coins: 50,
    reward: 150,
    description: '3 suspects. Obvious mistakes. 25 minutes.',
    suspects: '3 suspects',
    time: '25 minutes',
  },
  medium: {
    label: 'MEDIUM',
    coins: 100,
    reward: 300,
    description: '4 suspects. Cross-referenced alibis. 35 minutes.',
    suspects: '4 suspects',
    time: '35 minutes',
  },
  hard: {
    label: 'HARD',
    coins: 200,
    reward: 200,
    description: '6 suspects. Red herrings. 55 minutes.',
    suspects: '6 suspects',
    time: '55 minutes',
  },
};
