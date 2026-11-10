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
  likes?: number;
  media_type?: 'NONE' | 'IMAGE' | 'VIDEO';
  media_url?: string;
  guidelines_accepted?: boolean;
  author_avatar?: string;
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
  premium_status?: 'none' | 'pending' | 'approved' | 'cancelled';
  is_admin?: boolean;
  email?: string;
  avatar_url?: string;
  bio?: string;
  gender?: string;
  age?: number | null;
}

export interface TasteMatchRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_avatar?: string;
  to_user_id: string;
  to_username: string;
  to_avatar?: string;
  status: 'pending' | 'accepted' | 'declined';
  similarity_score?: number;
  shared_votes_count?: number;
  matched_categories?: string[];
  created_at: string;
}

export interface PremiumRequest {
  id: string;
  user_id: string;
  username: string;
  user_email: string;
  item_type: 'PREMIUM_MEMBERSHIP' | 'SPOTLIGHT_PIN' | 'PRIORITY_BOOST';
  utr_ref: string;
  amount: string;
  status: 'pending' | 'approved' | 'cancelled';
  created_at: string;
  target_email: string; // 'adhyangiri6@gmail.com'
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

