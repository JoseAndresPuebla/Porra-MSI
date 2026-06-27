export interface User {
  userId: string;
  displayName: string;
  photoURL: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support' | 'Coach';
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  imageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  acronym: string;
  region: string;
  logoUrl?: string;
}

export interface Phase {
  id: string;
  name: string;
  order: number;
}

export interface Match {
  id: string;
  phase: 'play-in' | 'main-stage';
  bracketPosition: string;
  team1: string;
  team2: string;
  winner: string | null;
  team1Score?: number | null;
  team2Score?: number | null;
  mapWins?: string[] | null;
  playerStats?: Record<string, Record<string, { kills: number; deaths: number; assists: number; cs: number }>>;
}

export interface Roster {
  userId: string;
  top: string;
  jgl: string;
  mid: string;
  adc: string;
  sup: string;
  coach?: string;
  favoriteTeam?: string;
  assassin1?: string;
  assassin2?: string;
  assassin3?: string;
  updatedAt: number;
}

export interface Prediction {
  userId: string;
  matchId: string;
  predictedWinner: string;
  mapWins?: string[];
  team1Score?: number;
  team2Score?: number;
  updatedAt: number;
}
