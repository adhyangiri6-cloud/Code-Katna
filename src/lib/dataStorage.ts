import { PollOption, DbComment, Matchup } from '../types';
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
