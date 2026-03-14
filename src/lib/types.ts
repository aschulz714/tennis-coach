export type SessionType = 'practice' | 'match';

export type MatchResult = 'win' | 'loss';

export interface TennisSession {
  id: string;
  type: SessionType;
  date: string; // ISO date string
  durationMinutes: number;
  notes: string;

  // Practice-specific
  drills?: string[];

  // Match-specific
  opponent?: string;
  score?: string;
  result?: MatchResult;

  createdAt: string;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}
