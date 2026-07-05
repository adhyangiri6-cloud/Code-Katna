export interface Contestant {
  name: string;
  subName: string;
  votes: number;
  accentColor: string; // hex or tailwind text-color / bg-color
  avatarCode: string; // for rendering procedural graphics
}

export interface Matchup {
  id: string;
  title: string;
  round: string;
  contestantA: Contestant;
  contestantB: Contestant;
  hasVoted: 'A' | 'B' | null;
  totalVotes: number;
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  category: 'POP-CULTURE' | 'CLASSROOM' | 'TOURNAMENT';
  description: string;
  totalVotes: number;
  options: PollOption[];
  votedIndex?: number;
  hostName?: string;
  isLocked?: boolean;
  is_priority?: boolean;
  is_spotlight?: boolean;
  is_pending_verification?: boolean;
  verification_utr?: string;
  created_at?: string;
  user_id?: string;
  comments_enabled?: boolean;
  expires_at?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  event: string;
  details: string;
}

export interface UserPreferences {
  accentColor: 'pink' | 'cyan' | 'yellow';
  avatarTag: string;
  enableAlertSounds: boolean;
  frequencyBias: 'standard' | 'high-frequency' | 'sub-harmonic';
}

export interface User {
  id?: string;
  username: string;
  avatar: string;
  registeredAt: string;
  preferences: UserPreferences;
  history: HistoryItem[];
  is_premium?: boolean;
  premium_expires_at?: string;
  is_admin?: boolean;
  email?: string;
}

export interface DbComment {
  id: string;
  poll_id: string;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
  avatar?: string;
}

export interface DbFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower_username?: string;
  following_username?: string;
}

