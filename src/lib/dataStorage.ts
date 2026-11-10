import { PollOption, DbComment, Matchup, Poll, TasteMatchRequest } from '../types';
import { supabase } from './supabaseClient';

// Helper to convert any string ID into a positive safe 32-bit bigint
// for database columns like tournament_id / id that require integer types in Supabase
export function hashToBigint(str: string): number {
  if (/^\d+$/.test(str)) {
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= Number.MAX_SAFE_INTEGER) {
      return parsed;
    }
  }
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7FFFFFFF;
  }
  return hash;
}

// ----------------------------------------------------
// 1. LIKES PERSISTENCE
// ----------------------------------------------------
const LIKES_KEY = 'vote_arena_poll_likes';
const USER_LIKED_PREFIX = 'vote_arena_user_liked_';

export function getPollLikes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserLikedPolls(userId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${USER_LIKED_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function togglePollLike(pollId: string, userId: string): { isLiked: boolean; totalLikes: number } {
  const userLikes = getUserLikedPolls(userId);
  const pollLikes = getPollLikes();

  const wasLiked = !!userLikes[pollId];
  const isLiked = !wasLiked;
  userLikes[pollId] = isLiked;

  const currentCount = pollLikes[pollId] !== undefined ? pollLikes[pollId] : 0;
  const newCount = Math.max(0, currentCount + (isLiked ? 1 : -1));
  pollLikes[pollId] = newCount;

  try {
    localStorage.setItem(`${USER_LIKED_PREFIX}${userId}`, JSON.stringify(userLikes));
    localStorage.setItem(LIKES_KEY, JSON.stringify(pollLikes));
    window.dispatchEvent(new CustomEvent('vote-arena-likes-updated', { detail: { pollId, newCount, isLiked, userId } }));
  } catch (e) {
    console.warn('Failed to save likes to localStorage:', e);
  }

  return { isLiked, totalLikes: newCount };
}

// ----------------------------------------------------
// 2. VOTES PERSISTENCE
// ----------------------------------------------------
const LOCAL_STATS_KEY = 'vote_arena_local_poll_stats';
const USER_VOTES_PREFIX = 'vote_arena_cast_votes_';

export function getAllPollStats(): Record<string, { options: PollOption[]; totalVotes: number }> {
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePollStats(pollId: string, options: PollOption[], totalVotes: number) {
  try {
    const stats = getAllPollStats();
    stats[pollId] = { options, totalVotes };
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to persist poll stats:', e);
  }
}

export function getUserCastVotes(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(`${USER_VOTES_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserCastVote(userId: string, pollId: string, optionIndex: number) {
  try {
    const votes = getUserCastVotes(userId);
    votes[pollId] = optionIndex;
    localStorage.setItem(`${USER_VOTES_PREFIX}${userId}`, JSON.stringify(votes));
  } catch (e) {
    console.warn('Failed to save user cast vote:', e);
  }
}

export function removeUserCastVote(userId: string, pollId: string) {
  try {
    const votes = getUserCastVotes(userId);
    delete votes[pollId];
    localStorage.setItem(`${USER_VOTES_PREFIX}${userId}`, JSON.stringify(votes));
  } catch (e) {
    console.warn('Failed to remove user cast vote:', e);
  }
}

// Sync vote to Supabase votes table asynchronously
export async function syncVoteToSupabase(userId: string, pollId: string, optionIndex: number) {
  if (!userId || userId === 'guest') return;
  const numTournamentId = hashToBigint(pollId);

  try {
    const { error } = await supabase.from('votes').upsert(
      {
        user_id: userId,
        tournament_id: numTournamentId,
        candidate_option: optionIndex.toString(),
        selected_option: optionIndex.toString()
      },
      { onConflict: 'user_id, tournament_id' }
    );
    if (error) {
      console.warn('Supabase vote upsert error (handled):', error.message);
    }
  } catch (err) {
    console.warn('Supabase vote sync skipped:', err);
  }
}

export async function removeVoteFromSupabase(userId: string, pollId: string) {
  if (!userId || userId === 'guest') return;
  const numTournamentId = hashToBigint(pollId);

  try {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', userId)
      .eq('tournament_id', numTournamentId);
    if (error) {
      console.warn('Supabase vote delete error (handled):', error.message);
    }
  } catch (err) {
    console.warn('Supabase vote delete skipped:', err);
  }
}

// ----------------------------------------------------
// 3. 1v1 TOURNAMENT MATCHUPS PERSISTENCE
// ----------------------------------------------------
const MATCHUPS_KEY = 'vote_arena_matchup_stats';
const USER_MATCHUPS_PREFIX = 'vote_arena_matchup_votes_';

export function loadPersistedMatchups(defaultMatchups: Matchup[], userId?: string): Matchup[] {
  const uId = userId || 'guest';
  let userVotes: Record<string, 'A' | 'B'> = {};
  let stats: Record<string, { votesA: number; votesB: number; totalVotes: number }> = {};

  try {
    const rawVotes = localStorage.getItem(`${USER_MATCHUPS_PREFIX}${uId}`);
    if (rawVotes) userVotes = JSON.parse(rawVotes);
  } catch {}

  try {
    const rawStats = localStorage.getItem(MATCHUPS_KEY);
    if (rawStats) stats = JSON.parse(rawStats);
  } catch {}

  return defaultMatchups.map(m => {
    const stat = stats[m.id];
    const userVote = userVotes[m.id] || null;

    if (stat) {
      return {
        ...m,
        hasVoted: userVote,
        totalVotes: stat.totalVotes,
        contestantA: { ...m.contestantA, votes: stat.votesA },
        contestantB: { ...m.contestantB, votes: stat.votesB }
      };
    }

    return {
      ...m,
      hasVoted: userVote
    };
  });
}

export function saveMatchupVote(
  matchupId: string,
  choice: 'A' | 'B',
  currentMatchups: Matchup[],
  userId?: string
): Matchup[] {
  const uId = userId || 'guest';
  let userVotes: Record<string, 'A' | 'B'> = {};
  let stats: Record<string, { votesA: number; votesB: number; totalVotes: number }> = {};

  try {
    const rawVotes = localStorage.getItem(`${USER_MATCHUPS_PREFIX}${uId}`);
    if (rawVotes) userVotes = JSON.parse(rawVotes);
  } catch {}

  try {
    const rawStats = localStorage.getItem(MATCHUPS_KEY);
    if (rawStats) stats = JSON.parse(rawStats);
  } catch {}

  const updated = currentMatchups.map(m => {
    if (m.id !== matchupId) return m;

    const currentA = m.contestantA.votes;
    const currentB = m.contestantB.votes;
    const newA = choice === 'A' ? currentA + 1 : currentA;
    const newB = choice === 'B' ? currentB + 1 : currentB;
    const totalVotes = newA + newB;

    stats[m.id] = { votesA: newA, votesB: newB, totalVotes };
    userVotes[m.id] = choice;

    return {
      ...m,
      hasVoted: choice,
      totalVotes,
      contestantA: { ...m.contestantA, votes: newA },
      contestantB: { ...m.contestantB, votes: newB }
    };
  });

  try {
    localStorage.setItem(`${USER_MATCHUPS_PREFIX}${uId}`, JSON.stringify(userVotes));
    localStorage.setItem(MATCHUPS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save matchup votes to storage:', e);
  }

  return updated;
}

// ----------------------------------------------------
// 4. COMMENTS PERSISTENCE
// ----------------------------------------------------
const COMMENTS_KEY = 'vote_arena_comments';

export const INITIAL_SEEDED_COMMENTS: DbComment[] = [
  { id: 'c-seed-1', poll_id: 'movie-2026', user_id: 'ARENA_MOD_X', text: 'NEO TOKYO RECON IS REVOLUTIONARY!', created_at: new Date(Date.now() - 3600000).toISOString(), username: 'ARENA_MOD_X', avatar: 'MOD' },
  { id: 'c-seed-2', poll_id: 'movie-2026', user_id: 'SENSEI_TANAKA', text: 'NIGHT CITY CHRONICLES HAS EXCELLENT WORLD-BUILDING.', created_at: new Date(Date.now() - 1800000).toISOString(), username: 'SENSEI_TANAKA', avatar: 'SEN' },
  { id: 'c-seed-3', poll_id: 'physics-11', user_id: 'COMMUNITY_CORE', text: 'THE EM-FIELD COUPLING THEORY HAS EMPIRICAL HOLES.', created_at: new Date(Date.now() - 500000).toISOString(), username: 'COMMUNITY_CORE', avatar: 'COR' },
  { id: 'c-seed-4', poll_id: 'community-adapt', user_id: 'CYBER_KAGE', text: 'CHAINSAW MAN REZE ARC CINEMATICS WILL DESTROY THE CHARTS!', created_at: new Date(Date.now() - 250000).toISOString(), username: 'CYBER_KAGE', avatar: 'KAG' }
];

export function loadComments(): DbComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (raw) {
      const parsed: DbComment[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with seed comments if missing
        const map = new Map<string, DbComment>();
        [...INITIAL_SEEDED_COMMENTS, ...parsed].forEach(c => map.set(c.id, c));
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    }
  } catch {}

  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(INITIAL_SEEDED_COMMENTS));
  } catch {}
  return INITIAL_SEEDED_COMMENTS;
}

export function saveComment(comment: DbComment): DbComment[] {
  const current = loadComments();
  if (current.some(c => c.id === comment.id)) {
    return current;
  }
  const updated = [...current, comment];
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vote-arena-comments-updated', { detail: { comment } }));
  } catch (e) {
    console.warn('Failed to save comment to localStorage:', e);
  }
  return updated;
}

// ----------------------------------------------------
// 5. COMBAT COMMS / DIRECT & SQUAD MESSAGES PERSISTENCE
// ----------------------------------------------------
const MESSAGES_KEY = 'vote_arena_messages';

export function loadCommsMessages(): any[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveCommsMessage(msg: any): any[] {
  const current = loadCommsMessages();
  if (current.some(m => m.id === msg.id)) {
    return current;
  }
  const updated = [...current, msg];
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vote-arena-messages-updated', { detail: { message: msg } }));
  } catch (e) {
    console.warn('Failed to save message to localStorage:', e);
  }
  return updated;
}

// ----------------------------------------------------
// 6. PROFILES PERSISTENCE (PFP, USERNAME, BIO)
// ----------------------------------------------------
const PROFILES_KEY = 'vote_arena_local_profiles';

export function getStoredProfiles(): Record<string, any> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserProfile(profile: {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  gender?: string;
  age?: number | null;
  is_premium?: boolean;
}): void {
  try {
    const current = getStoredProfiles();
    current[profile.id] = {
      ...current[profile.id],
      ...profile,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(current));
    // Also save user personal session if matches
    const storedUser = localStorage.getItem('codekatana_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.id === profile.id) {
          u.username = profile.username || u.username;
          u.bio = profile.bio !== undefined ? profile.bio : u.bio;
          u.avatar_url = profile.avatar_url || u.avatar_url;
          localStorage.setItem('codekatana_user', JSON.stringify(u));
        }
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('vote-arena-profiles-updated', { detail: { profile } }));
  } catch (e) {
    console.warn('Failed to save profile locally:', e);
  }
}

// ----------------------------------------------------
// 7. CUSTOM MEDIA POSTS & POLLS PERSISTENCE
// ----------------------------------------------------
const CUSTOM_POSTS_KEY = 'vote_arena_custom_polls';

export function getCustomPosts(): Poll[] {
  try {
    const raw = localStorage.getItem(CUSTOM_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomPost(poll: Poll): Poll[] {
  const current = getCustomPosts();
  const index = current.findIndex(p => p.id === poll.id);
  let updated: Poll[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...poll };
  } else {
    updated = [poll, ...current];
  }
  try {
    localStorage.setItem(CUSTOM_POSTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vote-arena-posts-updated', { detail: { poll } }));
  } catch (e) {
    console.warn('Failed to save custom post locally:', e);
  }
  return updated;
}

// ----------------------------------------------------
// 8. TWO-WAY TASTE MATCHER PERSISTENCE & ALGORITHM
// ----------------------------------------------------
const TASTE_REQUESTS_KEY = 'vote_arena_taste_requests';

export function getTasteRequests(): TasteMatchRequest[] {
  try {
    const raw = localStorage.getItem(TASTE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasteRequest(req: TasteMatchRequest): TasteMatchRequest[] {
  const current = getTasteRequests();
  const existingIdx = current.findIndex(r => r.id === req.id);
  let updated: TasteMatchRequest[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = req;
  } else {
    updated = [req, ...current];
  }
  try {
    localStorage.setItem(TASTE_REQUESTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vote-arena-taste-requests-updated', { detail: { request: req } }));
  } catch (e) {
    console.warn('Failed to save taste request:', e);
  }
  return updated;
}

// Calculate similarity between two users based on their votes and created polls
export function calculateTasteSimilarity(
  userAId: string,
  userBId: string,
  allPolls: Poll[] = []
): {
  score: number;
  sharedCount: number;
  badges: string[];
  breakdown: { pollTitle: string; matchedChoice: string }[];
} {
  const votesA = getUserCastVotes(userAId);
  const votesB = getUserCastVotes(userBId);

  const sharedKeys = Object.keys(votesA).filter(pollId => pollId in votesB);
  let matches = 0;
  const breakdown: { pollTitle: string; matchedChoice: string }[] = [];

  sharedKeys.forEach(pollId => {
    if (votesA[pollId] === votesB[pollId]) {
      matches += 1;
      const poll = allPolls.find(p => p.id === pollId);
      const choiceIdx = votesA[pollId];
      const choiceText = poll?.options[choiceIdx]?.text || `Choice #${choiceIdx + 1}`;
      breakdown.push({
        pollTitle: poll?.title || `Clash ${pollId.slice(0, 6)}`,
        matchedChoice: choiceText
      });
    }
  });

  // Calculate score
  let score = 0;
  if (sharedKeys.length > 0) {
    const rawRatio = matches / sharedKeys.length;
    // Map ratio to 60% - 98% range for high-energy anime affinity
    score = Math.round(60 + rawRatio * 38);
  } else {
    // Deterministic anime affinity based on username / ID hash
    const combined = `${userAId}_${userBId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    score = 80 + (Math.abs(hash) % 18); // 80% to 97%
  }

  // Generate badges
  const badges: string[] = [];
  if (score >= 90) badges.push('✨ SOUL LINK S-RANK');
  if (score >= 80) badges.push('⚔️ SHONEN SYNERGY');
  badges.push('🌸 KAWAII TASTE TWINS');
  badges.push('🎌 ANIME CONNOISSEURS');

  return {
    score,
    sharedCount: matches,
    badges,
    breakdown
  };
}

export function createTasteMatchRequest(
  fromUser: { id: string; username: string; avatar_url?: string; avatar?: string },
  toUser: { id: string; username: string; avatar_url?: string; avatar?: string },
  allPolls: Poll[] = []
): { request: TasteMatchRequest; alreadyMatched: boolean } {
  const requests = getTasteRequests();

  // Check if toUser has already sent a request to fromUser (Two-way completion!)
  const reverseRequest = requests.find(
    r => r.from_user_id === toUser.id && r.to_user_id === fromUser.id && r.status === 'pending'
  );

  if (reverseRequest) {
    // Auto-accept two-way match!
    const similarity = calculateTasteSimilarity(fromUser.id, toUser.id, allPolls);
    const acceptedReq: TasteMatchRequest = {
      ...reverseRequest,
      status: 'accepted',
      similarity_score: similarity.score,
      shared_votes_count: similarity.sharedCount,
      matched_categories: similarity.badges
    };
    saveTasteRequest(acceptedReq);
    return { request: acceptedReq, alreadyMatched: true };
  }

  // Check if current user already sent one
  const existing = requests.find(
    r => r.from_user_id === fromUser.id && r.to_user_id === toUser.id
  );
  if (existing) {
    return { request: existing, alreadyMatched: existing.status === 'accepted' };
  }

  const similarity = calculateTasteSimilarity(fromUser.id, toUser.id, allPolls);
  const newReq: TasteMatchRequest = {
    id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from_user_id: fromUser.id,
    from_username: fromUser.username,
    from_avatar: fromUser.avatar_url || fromUser.avatar,
    to_user_id: toUser.id,
    to_username: toUser.username,
    to_avatar: toUser.avatar_url || toUser.avatar,
    status: 'pending',
    similarity_score: similarity.score,
    shared_votes_count: similarity.sharedCount,
    matched_categories: similarity.badges,
    created_at: new Date().toISOString()
  };

  saveTasteRequest(newReq);
  return { request: newReq, alreadyMatched: false };
}
