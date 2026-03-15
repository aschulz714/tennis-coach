export type SessionType = 'practice' | 'match';

export type MatchResult = 'win' | 'loss';

export type Surface = 'Hard' | 'Clay' | 'Indoor' | 'Grass';

export type MatchFormat = 'Singles' | 'Doubles';

export type Team = '4.0 Verma' | '4.5 Dhindsa' | 'Other/Pickup';

export interface SetScore {
  yours: number;
  opponent: number;
}

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
  score?: string; // legacy free-text score (backward compat)
  result?: MatchResult;

  // New match fields
  sets?: SetScore[];
  doublesPartner?: string;
  surface?: Surface;
  team?: Team;
  matchFormat?: MatchFormat;

  createdAt: string;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}
