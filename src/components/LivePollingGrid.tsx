import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Poll, DbComment, DbFollow } from '../types';
import { sounds } from './SoundManager';
import { getPollLikes, getUserLikedPolls, togglePollLike } from '../lib/dataStorage';
import { 
  Radio, 
  Users, 
  CheckCircle, 
  Flame, 
  GraduationCap, 
  Compass, 
  Sparkles, 
  MessageSquare, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Send,
  AlertCircle,
  Heart,
  Grid3X3,
  List,
  Bookmark,
  Share2,
  Instagram,
  Sword,
  Shield,
  Zap
} from 'lucide-react';

function StickmanFight({ kick }: { kick: 'A' | 'B' | null }) {
  return (
    <div className="w-full flex justify-center items-center h-16 z-10 relative pointer-events-none my-1 select-none">
      <style>{`
        @keyframes stickman-spar-left {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-4px) translateX(2px); }
        }
        @keyframes stickman-spar-right {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-3px) translateX(-2px); }
        }
        .animate-stick-left {
          animation: stickman-spar-left 0.8s infinite ease-in-out;
        }
        .animate-stick-right {
          animation: stickman-spar-right 0.8s infinite ease-in-out;
        }
      `}</style>
      <svg width="180" height="56" viewBox="0 0 200 60" className="overflow-visible">
        {kick === null && (
          <>
            {/* Ambient Sparring State */}
            {/* Left Stickman (Strawberry Pink) */}
            <g className="animate-stick-left" stroke="#FF6584" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="70" cy="18" r="5" fill="#FF6584" />
              <line x1="70" y1="23" x2="70" y2="38" />
              <line x1="70" y1="26" x2="82" y2="24" strokeWidth="2" />
              <line x1="70" y1="26" x2="58" y2="28" strokeWidth="2" />
              <line x1="70" y1="38" x2="62" y2="54" />
              <line x1="70" y1="38" x2="78" y2="54" />
            </g>

            {/* Right Stickman (Lavender Purple) */}
            <g className="animate-stick-right" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="130" cy="18" r="5" fill="#9333EA" />
              <line x1="130" y1="23" x2="130" y2="38" />
              <line x1="130" y1="26" x2="118" y2="24" strokeWidth="2" />
              <line x1="130" y1="26" x2="142" y2="28" strokeWidth="2" />
              <line x1="130" y1="38" x2="122" y2="54" />
              <line x1="130" y1="38" x2="138" y2="54" />
            </g>
          </>
        )}

        {kick === 'A' && (
          <>
            {/* Option A Vote: Black kicks Orange! */}
            {/* Left Stickman (Black - Kicking Pose) */}
            <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="85" cy="22" r="5" fill="#000000" />
              <line x1="85" y1="27" x2="75" y2="37" />
              <line x1="85" y1="29" x2="97" y2="27" />
              <line x1="85" y1="29" x2="73" y2="33" />
              <line x1="75" y1="37" x2="70" y2="54" />
              {/* Extended Kicking Leg */}
              <line x1="75" y1="37" x2="118" y2="26" strokeWidth="3" />
            </g>

            {/* Right Stickman (Orange - Hit Recoil Pose) */}
            <g stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" fill="none" className="translate-x-4">
              <circle cx="145" cy="14" r="5" fill="#FF6B00" />
              <line x1="145" y1="19" x2="155" y2="33" />
              <line x1="145" y1="23" x2="130" y2="18" />
              <line x1="145" y1="23" x2="160" y2="15" />
              <line x1="155" y1="33" x2="147" y2="50" />
              <line x1="155" y1="33" x2="165" y2="46" />
            </g>

            {/* Hit Clash Sparkle */}
            <g stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" fill="none">
              <line x1="118" y1="26" x2="124" y2="20" />
              <line x1="118" y1="26" x2="124" y2="32" />
              <line x1="118" y1="26" x2="112" y2="20" />
              <line x1="118" y1="26" x2="112" y2="32" />
              <circle cx="118" cy="26" r="4" fill="#FFD700" opacity="0.8" />
            </g>
          </>
        )}

        {kick === 'B' && (
          <>
            {/* Option B Vote: Orange kicks Black! */}
            {/* Left Stickman (Black - Hit Recoil Pose) */}
            <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none" className="-translate-x-4">
              <circle cx="55" cy="14" r="5" fill="#000000" />
              <line x1="55" y1="19" x2="45" y2="33" />
              <line x1="55" y1="23" x2="40" y2="15" />
              <line x1="55" y1="23" x2="70" y2="18" />
              <line x1="45" y1="33" x2="35" y2="46" />
              <line x1="45" y1="33" x2="53" y2="50" />
            </g>

            {/* Right Stickman (Orange - Kicking Pose) */}
            <g stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="115" cy="22" r="5" fill="#FF6B00" />
              <line x1="115" y1="27" x2="125" y2="37" />
              <line x1="115" y1="29" x2="127" y2="33" />
              <line x1="115" y1="29" x2="103" y2="27" />
              {/* Extended Kicking Leg */}
              <line x1="125" y1="37" x2="82" y2="26" strokeWidth="3" />
              <line x1="125" y1="37" x2="130" y2="54" />
            </g>

            {/* Hit Clash Sparkle */}
            <g stroke="#000000" strokeWidth="2" strokeLinecap="round" fill="none">
              <line x1="82" y1="26" x2="76" y2="20" />
              <line x1="82" y1="26" x2="76" y2="32" />
              <line x1="82" y1="26" x2="88" y2="20" />
              <line x1="82" y1="26" x2="88" y2="32" />
              <circle cx="82" cy="26" r="4" fill="#FF6B00" opacity="0.8" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

interface LivePollingGridProps {
  polls: Poll[];
  onVote: (pollId: string, optionIndex: number) => void;
  title: string;
  tagline: string;
  badgeText: string;
  badgeIcon: React.ReactNode;
  gridId?: string;
  emptyMessage?: string;
  currentUser?: any;
  follows?: DbFollow[];
  onFollow?: (followingId: string, followingUsername: string) => void;
  onUnfollow?: (followingId: string) => void;
  comments?: DbComment[];
  onAddComment?: (pollId: string, text: string) => void;
  onTransmitPoll?: (poll: Poll) => void;
  onDeletePoll?: (pollId: string, creatorId: string) => void;
  onActivateSpotlight?: (pollId: string) => void;
  viewMode?: 'FEED' | 'GRID';
  onToggleViewMode?: (mode: 'FEED' | 'GRID') => void;
  allProfiles?: any[];
  allVotes?: any[];
  onUndoVote?: (pollId: string) => void;
}

export default function LivePollingGrid({ 
  polls, 
  onVote, 
  title, 
  tagline, 
  badgeText, 
  badgeIcon, 
  gridId = 'live-polls', 
  emptyMessage = 'NO ACTIVE TRANSMISSIONS FOUND.',
  currentUser,
  follows = [],
  onFollow,
  onUnfollow,
  comments = [],
  onAddComment,
  onTransmitPoll,
  onDeletePoll,
  onActivateSpotlight,
  viewMode = 'FEED',
  onToggleViewMode,
  allProfiles = [],
  allVotes = [],
  onUndoVote
}: LivePollingGridProps) {
  
  // Track open comment sections per poll ID
  const [activeComments, setActiveComments] = useState<Record<string, boolean>>({});
  
  // Track input text per poll ID
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Unified Persistent Likes Tracking across sessions and reloads
  const [likedPolls, setLikedPolls] = useState<Record<string, boolean>>(() => {
    const uId = currentUser?.id || 'guest';
    return getUserLikedPolls(uId);
  });

  const [pollLikes, setPollLikes] = useState<Record<string, number>>(() => {
    return getPollLikes();
  });

  // Keep likes synced across logins/refreshes and cross-tab/component updates
  useEffect(() => {
    const uId = currentUser?.id || 'guest';
    setLikedPolls(getUserLikedPolls(uId));
    setPollLikes(getPollLikes());

    const handleLikesUpdated = () => {
      setPollLikes(getPollLikes());
      setLikedPolls(getUserLikedPolls(currentUser?.id || 'guest'));
    };

    window.addEventListener('vote-arena-likes-updated', handleLikesUpdated);
    return () => window.removeEventListener('vote-arena-likes-updated', handleLikesUpdated);
  }, [currentUser?.id]);

  const handleLike = (pollId: string) => {
    sounds.playSelect();
    const uId = currentUser?.id || 'guest';
    const { isLiked, totalLikes } = togglePollLike(pollId, uId);
    setLikedPolls(prev => ({ ...prev, [pollId]: isLiked }));
    setPollLikes(prev => ({ ...prev, [pollId]: totalLikes }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CLASSROOM':
        return <GraduationCap className="w-3.5 h-3.5 text-pink-500" />;
      case 'POP-CULTURE':
        return <Sparkles className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CLASSROOM':
        return 'text-pink-600 bg-pink-50 border-pink-200';
      case 'POP-CULTURE':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  const [pollKicks, setPollKicks] = useState<Record<string, 'A' | 'B' | null>>({});

  const getAnimeThemeConfig = (hostName: string) => {
    return {
      rank: 'KAWAII CREATOR // VERIFIED 🌸',
      colorClass: 'border-pink-200 text-pink-600 bg-pink-50',
      glowColor: 'rgba(255, 101, 132, 0.3)',
      avatarSymbol: '🌸',
      animeClass: 'Velgre'
    };
  };

  const handleOptionVote = (pollId: string, optionIndex: number) => {
    sounds.playSelect();
    
    // Set kick state based on A (0) or B (1)
    const kickType = optionIndex === 0 ? 'A' : optionIndex === 1 ? 'B' : null;
    if (kickType) {
      setPollKicks(prev => ({ ...prev, [pollId]: kickType }));
      // Clear after 1200ms back to continuous sparring
      setTimeout(() => {
        setPollKicks(prev => ({ ...prev, [pollId]: null }));
      }, 1200);
    }

    onVote(pollId, optionIndex);
  };

  // Check if current user is following an operator
  const isUserFollowing = (targetUsername: string) => {
    const currentId = currentUser?.id || 'guest';
    return follows.some(f => f.follower_id === currentId && f.following_username?.toLowerCase() === targetUsername.toLowerCase());
  };

  // Toggle comments expand/collapse
  const toggleComments = (pollId: string) => {
    sounds.playTick();
    setActiveComments(prev => ({
      ...prev,
      [pollId]: !prev[pollId]
    }));
  };

  // Submit comment
  const handleCommentSubmit = (e: React.FormEvent, pollId: string) => {
    e.preventDefault();
    const txt = commentInputs[pollId] || '';
    if (!txt.trim() || !onAddComment) return;

    onAddComment(pollId, txt);
    setCommentInputs(prev => ({
      ...prev,
      [pollId]: ''
    }));
  };

  return (
    <div id={gridId} className="relative w-full max-w-4xl mx-auto px-4 py-8 z-10">
      
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 pb-4 border-b border-pink-100">
        <div>
          <div className="inline-flex items-center gap-2 bg-pink-100/80 border border-pink-200 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-xs">
            {badgeIcon}
            {badgeText}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-pink-500 animate-spin-slow" />
            {title}
          </h2>
          <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide">
            {tagline}
          </p>
        </div>

        {/* View Mode Toggle */}
        {onToggleViewMode && (
          <div className="flex items-center bg-white/80 border border-pink-200/80 rounded-full p-1 shrink-0 shadow-xs backdrop-blur-xs">
            <button
              onClick={() => {
                sounds.playTick();
                onToggleViewMode('FEED');
              }}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all ${
                viewMode === 'FEED'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm'
                  : 'text-gray-500 hover:text-pink-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Feed
            </button>
            <button
              onClick={() => {
                sounds.playTick();
                onToggleViewMode('GRID');
              }}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all ${
                viewMode === 'GRID'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm'
                  : 'text-gray-500 hover:text-pink-600'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Grid
            </button>
          </div>
        )}
      </div>

      {polls.length === 0 ? (
        <div className="text-center font-medium text-sm text-pink-400 py-16 bg-white/70 rounded-3xl border-2 border-dashed border-pink-200">
          🌸 {emptyMessage}
        </div>
      ) : viewMode === 'GRID' ? (
        
        /* ==================== 1. INSTAGRAM GRID VIEW ==================== */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {polls.map((poll, idx) => {
            const hasVoted = poll.votedIndex !== undefined;
            const optionTotal = poll.options.reduce((sum, o) => sum + o.votes, 0);
            const totalVotes = poll.totalVotes;
            const baseLikes = poll.likes || (poll.totalVotes > 0 ? Math.floor(poll.totalVotes * 0.4) : 0);
            const totalLikes = baseLikes + (pollLikes[poll.id] || 0);
            const pollComments = comments.filter(c => c.poll_id === poll.id);
            const animeConfig = getAnimeThemeConfig(poll.hostName || 'GATEKEEPER');

            return (
              <motion.div
                key={`grid-${poll.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="aspect-square relative group bg-white/95 border-2 border-pink-100 hover:border-pink-300 rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 shadow-[0_6px_20px_rgba(255,182,193,0.15)] hover:shadow-[0_10px_30px_rgba(255,182,193,0.25)] hover:-translate-y-0.5"
                onClick={() => {
                  sounds.playSelect();
                  // Switch back to feed and focus on this poll
                  if (onToggleViewMode) {
                    onToggleViewMode('FEED');
                    setTimeout(() => {
                      const el = document.getElementById(`feed-post-${poll.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
              >
                {/* Featured / Spotlight visual mark */}
                {poll.is_spotlight && (
                  <div className="absolute top-2.5 left-2.5 z-15 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    ✨ Spotlight
                  </div>
                )}

                {/* Matchup content display */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 z-10 bg-gradient-to-b from-white/90 via-pink-50/20 to-pink-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-bold text-pink-600 uppercase tracking-wider bg-pink-100/80 px-2 py-0.5 rounded-full">
                      {poll.category}
                    </span>
                    <span className="text-base font-black">
                      🌸
                    </span>
                  </div>

                  {/* VS clash title text in center */}
                  <div className="my-auto text-center px-1">
                    <p className="text-xs font-bold text-gray-700 truncate">
                      {poll.options[0]?.text || 'Choice A'}
                    </p>
                    <div className="inline-block my-1 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      VS 💖
                    </div>
                    <p className="text-xs font-bold text-gray-700 truncate">
                      {poll.options[1]?.text || 'Choice B'}
                    </p>
                  </div>

                  <div className="truncate text-left text-[10px] font-bold text-gray-800 border-t border-pink-100/70 pt-2">
                    {poll.title}
                  </div>
                </div>

                {/* Hover Statistics Overlay */}
                <div className="absolute inset-0 bg-pink-900/80 backdrop-blur-xs flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div className="flex items-center gap-1.5 text-pink-200 font-bold text-xs" title={`${totalLikes} Loves`}>
                    <Heart className="w-4 h-4 text-pink-300 fill-pink-300 animate-pulse" />
                    <span>{totalLikes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-200 font-bold text-xs" title={`${totalVotes} Total Votes`}>
                    <Users className="w-4 h-4 text-purple-300" />
                    <span>{totalVotes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-200 font-bold text-xs" title={`${pollComments.length} Comments`}>
                    <MessageSquare className="w-4 h-4 text-rose-300" />
                    <span>{pollComments.length}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        
        /* ==================== 2. INSTAGRAM FEED VIEW ==================== */
        <div className="space-y-12 max-w-xl mx-auto">
          {polls.map((poll, pollIdx) => {
            const hasVoted = poll.votedIndex !== undefined;
            const isBoosted = poll.is_priority === true;
            const commentsOpen = !!activeComments[poll.id];
            const animeConfig = getAnimeThemeConfig(poll.hostName || 'GATEKEEPER');
            const baseLikes = poll.likes || (poll.totalVotes > 0 ? Math.floor(poll.totalVotes * 0.4) : 0);
            const totalLikes = baseLikes + (pollLikes[poll.id] || 0);

            // De-duplicate comments
            const seenCommentIds = new Set<string>();
            const pollComments = comments
              .filter(c => c.poll_id === poll.id)
              .filter(c => {
                if (seenCommentIds.has(c.id)) return false;
                seenCommentIds.add(c.id);
                return true;
              });

            const commentsEnabled = poll.comments_enabled !== false;
            const hostClean = (poll.hostName || 'GATEKEEPER').toUpperCase();
            const isFollowingHost = isUserFollowing(hostClean);
            const isSelfHost = currentUser?.username?.toUpperCase() === hostClean;
            const isHostAdmin = hostClean === 'ADHYANGIRI6' || hostClean === 'ARENA_MOD_X';
            const hostProfile = allProfiles?.find(p => p.username?.toUpperCase() === hostClean);
            const hostAvatarUrl = hostProfile?.avatar_url || poll.author_avatar;

            // Social likes line simulation
            const isLiked = !!likedPolls[poll.id];

            return (
              <motion.article
                id={`feed-post-${poll.id}`}
                key={`feed-${poll.id}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                className="bg-white/95 backdrop-blur-md border-2 border-pink-100 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(255,182,193,0.18)] hover:shadow-[0_16px_50px_rgba(255,182,193,0.26)] relative transition-all duration-300"
              >
                {/* 1. Feed Item Header */}
                <div className="flex items-center justify-between p-4 border-b border-pink-100/70 bg-gradient-to-r from-pink-50/60 via-purple-50/30 to-pink-50/40">
                  <div className="flex items-center gap-3">
                    {/* Glowing Kawaii Avatar Ring */}
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center text-pink-700 font-bold border-2 text-base shadow-xs relative shrink-0"
                      style={{ 
                        borderColor: isLiked ? '#FF6584' : '#fbcfe8',
                        boxShadow: isLiked ? `0 0 12px rgba(255,101,132,0.4)` : 'none'
                      }}
                    >
                      {/* Spinning story gradient ring around avatar */}
                      <div className="absolute inset-[-3px] rounded-full -z-10 insta-story-ring opacity-80" />
                      {/* Innermost circle container */}
                      <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-black overflow-hidden shadow-inner">
                        {hostAvatarUrl ? (
                          <img src={hostAvatarUrl} alt={hostClean} className="w-full h-full object-cover" />
                        ) : (
                          '🌸'
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-xs font-black text-gray-800 tracking-tight hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1.5">
                          {hostAvatarUrl && (
                            <img src={hostAvatarUrl} alt={`${hostClean} mini avatar`} className="w-4 h-4 rounded-full object-cover border border-pink-200 shrink-0" />
                          )}
                          {hostClean}
                        </span>
                        {isHostAdmin && (
                          <Crown className="w-3.5 h-3.5 text-amber-500 animate-bounce shrink-0" />
                        )}
                        {poll.is_spotlight && (
                          <span className="bg-gradient-to-r from-pink-500 to-rose-400 text-white font-sans text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-full shadow-xs">
                            ✨ Spotlight
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[8px] text-pink-400 font-bold uppercase tracking-widest mt-0.5">
                        🌸 {animeConfig.rank}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Follow Host Button */}
                    {!isSelfHost && onFollow && onUnfollow && (
                      <button
                        onClick={() => {
                          sounds.playTick();
                          if (isFollowingHost) {
                            onUnfollow(hostClean);
                          } else {
                            onFollow(hostClean, hostClean);
                          }
                        }}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all tracking-wide cursor-pointer shadow-xs ${
                          isFollowingHost 
                            ? 'bg-pink-50 text-pink-400 border border-pink-200 hover:bg-pink-100' 
                            : 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-none font-bold hover:from-pink-600 hover:to-rose-500 active:scale-95'
                        }`}
                      >
                        {isFollowingHost ? 'Following 🌸' : '+ Follow'}
                      </button>
                    )}

                    {/* Delete Option */}
                    {currentUser?.id && poll.user_id && currentUser.id === poll.user_id && onDeletePoll && (
                      <button
                        onClick={() => onDeletePoll(poll.id, poll.user_id || '')}
                        className="text-[9px] font-bold text-rose-500 hover:text-rose-700 border border-rose-200 bg-rose-50/60 px-2.5 py-0.5 rounded-full transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Central Square Manga Clash Pane (Instagram Post content) */}
                {/* 2. Central Square Manga Clash / Photo / Video Pane */}
                {poll.media_type === 'IMAGE' && poll.media_url ? (
                  <div className="relative aspect-square w-full bg-black flex flex-col justify-between overflow-hidden border-b border-gray-200 group">
                    <img
                      src={poll.media_url}
                      alt={poll.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/60 pointer-events-none" />

                    <div className="z-10 flex justify-between items-center w-full p-4">
                      <span className="font-mono text-[9px] font-black border border-white/30 bg-black/70 text-white px-2 py-0.5 uppercase flex items-center gap-1.5 backdrop-blur-xs">
                        📸 ANIME PHOTO
                      </span>
                      <span className="font-mono text-[8px] bg-gradient-to-r from-pink-600 to-rose-500 text-white px-1.5 py-0.5 font-bold uppercase tracking-wider">
                        VERIFIED SAFE
                      </span>
                    </div>

                    <div className="z-10 p-4 text-left">
                      <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md">
                        {poll.title}
                      </h3>
                      {poll.description && (
                        <p className="text-gray-200 text-xs font-sans mt-1 line-clamp-2 drop-shadow-sm">
                          {poll.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : poll.media_type === 'VIDEO' && poll.media_url ? (
                  <div className="relative aspect-square w-full bg-black flex flex-col justify-between overflow-hidden border-b border-gray-200">
                    <video
                      src={poll.media_url}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-3 pointer-events-none">
                      <span className="font-mono text-[9px] font-black border border-white/30 bg-black/70 text-white px-2 py-0.5 uppercase flex items-center gap-1.5 backdrop-blur-xs">
                        🎬 ANIME VIDEO
                      </span>
                      <span className="font-mono text-[8px] bg-amber-500 text-black px-1.5 py-0.5 font-black uppercase tracking-wider">
                        VERIFIED STREAM
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-square w-full bg-gradient-to-b from-pink-50/50 via-purple-50/30 to-pink-50/60 flex flex-col justify-between overflow-hidden border-b border-pink-100 p-6">
                    {/* Soft pastel dots / ambient glowing vignette */}
                    <div className="absolute inset-0 bg-radial-at-c from-white/60 via-transparent to-pink-100/20 pointer-events-none z-0" />

                    {/* Top Bar of the image: categories and cute tags */}
                    <div className="z-10 flex justify-between items-center w-full">
                      <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 shadow-xs ${getCategoryColor(poll.category)}`}>
                        {getCategoryIcon(poll.category)}
                        {poll.category}
                      </span>
                      <span className="font-mono text-[9px] text-pink-400 font-semibold tracking-wider">
                        ✨ #{poll.id.slice(0, 6).toUpperCase()}
                      </span>
                    </div>

                    {/* Big Cute Title in Center */}
                    <div className="z-10 text-center my-auto py-3">
                      <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest block mb-1">
                        🌸 COMMUNITY POLL MATCHUP 🌸
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight px-2">
                        {poll.title}
                      </h3>
                      {poll.description && (
                        <p className="text-gray-600 text-xs mt-2 max-w-sm mx-auto font-medium">
                          {poll.description}
                        </p>
                      )}
                    </div>

                    {/* STICKMAN FIGHT ANIMATION */}
                    <StickmanFight kick={pollKicks[poll.id] || null} />

                    {/* Cute sticker icons */}
                    <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-5 flex items-center justify-between px-8">
                      <div className="w-11 h-11 rounded-full border border-pink-200 bg-white/80 shadow-xs flex items-center justify-center text-lg">
                        ✨
                      </div>
                      <div className="w-11 h-11 rounded-full border border-pink-200 bg-white/80 shadow-xs flex items-center justify-center text-lg">
                        💖
                      </div>
                    </div>

                    {/* VS Symbol at bottom of stage overlay */}
                    <div className="z-10 text-center w-full pb-2">
                      <span className="text-sm font-black text-white bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-1.5 rounded-full shadow-md inline-flex items-center gap-1">
                        <span>VS</span>
                        <span>💖</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Post Interaction Action Bar */}
                <div className="p-4 flex justify-between items-center bg-pink-50/30 border-b border-pink-100/70">
                  <div className="flex items-center gap-4">
                    {/* Double-tap heart hype button */}
                    <button
                      onClick={() => handleLike(poll.id)}
                      className={`transition-all hover:scale-115 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'
                      }`}
                      title={isLiked ? "Unlike" : "Love this poll"}
                    >
                      <Heart className={`w-6 h-6 transition-all ${isLiked ? 'fill-pink-500 text-pink-500 animate-pulse' : ''}`} />
                      <span className="font-bold text-xs">{totalLikes}</span>
                    </button>

                    {/* Comments Toggle Balloon */}
                    <button
                      onClick={() => toggleComments(poll.id)}
                      className={`transition-all hover:scale-115 active:scale-95 cursor-pointer flex items-center gap-1 ${
                        commentsOpen ? 'text-purple-600' : 'text-gray-400 hover:text-purple-600'
                      }`}
                      title="View Comments"
                    >
                      <MessageSquare className="w-6 h-6" />
                    </button>

                    {/* Transmit Poll airplane */}
                    {onTransmitPoll && (
                      <>
                        <button
                          onClick={() => {
                            sounds.playSelect();
                            onTransmitPoll(poll);
                          }}
                          className="transition-all hover:scale-115 text-gray-400 hover:text-pink-600 cursor-pointer"
                          title="Share to Instagram Stories"
                        >
                          <Instagram className="w-5.5 h-5.5" />
                        </button>
                        <button
                          onClick={() => {
                            sounds.playSelect();
                            onTransmitPoll(poll);
                          }}
                          className="transition-all hover:scale-115 text-gray-400 hover:text-pink-500 cursor-pointer"
                          title="Share Poll"
                        >
                          <Send className="w-5.5 h-5.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Bookmark tag style indicator */}
                  <div>
                    {onActivateSpotlight && !poll.is_spotlight && (
                      <button
                        onClick={() => {
                          sounds.playSelect();
                          onActivateSpotlight(poll.id);
                        }}
                        className="text-gray-400 hover:text-shonen-orange transition-colors cursor-pointer"
                        title="Highlight Spotlight"
                      >
                        <Bookmark className="w-5.5 h-5.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Captions, Statistics, and Inline Interactive Options */}
                <div className="px-4 pb-4 space-y-4 pt-2">
                  {/* Likes / Votes statistics */}
                  {/* Likes / Votes statistics */}
                  <div className="text-xs font-bold text-gray-800 tracking-tight flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-pink-600 font-bold">
                      <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                      <span>{totalLikes.toLocaleString()} Loves</span>
                    </span>
                    <span className="text-pink-200 font-bold">&bull;</span>
                    <span className="flex items-center gap-1.5 text-purple-600 font-bold">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{poll.totalVotes.toLocaleString()} Votes</span>
                    </span>
                  </div>

                  {/* Caption */}
                  <div className="text-xs leading-relaxed text-gray-600">
                    <span className="font-extrabold text-gray-900 mr-2">{hostClean}</span>
                    <span>"{poll.title}" &mdash; Tap your choice below to vote! 🌸</span>
                  </div>

                  {/* INTERACTIVE POLL OPTIONS */}
                  <div className="space-y-2.5 bg-pink-50/40 p-3.5 rounded-2xl border border-pink-100">
                    {poll.options.map((option, idx) => {
                      const optionTotal = poll.options.reduce((sum, o) => sum + o.votes, 0);
                      const percent = optionTotal > 0 ? ((option.votes / optionTotal) * 100).toFixed(1) : '0.0';
                      const isSelected = poll.votedIndex === idx;

                      // Calculate voter profiles for followed users who voted for this option
                      const followedIds = (follows || [])
                        .filter(f => f.follower_id === currentUser?.id)
                        .map(f => f.following_id);

                      const optionVoters = (allVotes || []).filter(v => {
                        const votePollId = v.tournament_id;
                        const optStr = v.selected_option || v.candidate_option;
                        const voteOptIdx = optStr !== undefined && optStr !== null ? parseInt(optStr, 10) : -1;
                        return votePollId === poll.id && voteOptIdx === idx && followedIds.includes(v.user_id);
                      });

                      const voterProfiles = optionVoters.map(v => {
                        return (allProfiles || []).find(p => p.id === v.user_id);
                      }).filter(Boolean);

                      // Assign colorful chakra gauges
                      const gaugeColor = idx === 0 
                        ? 'bg-gradient-to-r from-pink-400 to-rose-400' 
                        : 'bg-gradient-to-r from-purple-400 to-pink-400';

                      return (
                        <div key={`feed-${poll.id}-opt-${idx}`} className="relative">
                          {hasVoted ? (
                            /* VOTED PROGRESS BAR */
                            <div className={`relative h-11 rounded-2xl border-2 overflow-hidden flex items-center justify-between px-4 transition-all duration-300 ${
                              isSelected 
                                ? 'border-pink-400 bg-pink-50/50 shadow-xs' 
                                : 'border-pink-100 bg-white/90'
                            }`}>
                              {/* Glowing energy gauge */}
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                                className={`absolute top-0 bottom-0 left-0 -z-0 opacity-25 ${gaugeColor}`}
                              />
                              
                              <span className={`text-xs font-bold truncate pr-4 z-10 flex items-center gap-1.5 ${
                                isSelected ? 'text-pink-600 font-extrabold' : 'text-gray-700'
                              }`}>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />}
                                <span className="truncate">{option.text}</span>

                                {/* Voter profile picture mini-icons for people you follow */}
                                {voterProfiles.length > 0 && (
                                  <div className="flex items-center -space-x-1 overflow-hidden shrink-0 select-none ml-1.5 bg-white/80 p-0.5 rounded-full border border-pink-200">
                                    {voterProfiles.map((prof) => (
                                      <img
                                        key={`${poll.id}-opt-${idx}-voter-${prof.id}`}
                                        src={prof.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                                        alt={prof.username}
                                        title={`${prof.username?.toUpperCase()} (followed) voted for this`}
                                        className="w-4 h-4 rounded-full border border-pink-200 object-cover shrink-0 bg-white"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </span>
                              
                              <span className={`text-xs font-bold z-10 ${
                                isSelected ? 'text-pink-600 font-extrabold' : 'text-gray-500'
                              }`}>
                                {percent}%
                              </span>
                            </div>
                          ) : (
                            /* ACTIVE VOTING BUTTON */
                            <button
                              onClick={() => handleOptionVote(poll.id, idx)}
                              className="w-full h-11 border-2 border-pink-100 hover:border-pink-300 bg-white hover:bg-pink-50/40 text-left text-xs font-bold px-4 py-2 flex items-center justify-between rounded-2xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-gray-800 shadow-xs"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{option.text}</span>
                                {/* Voter profile picture mini-icons for people you follow */}
                                {voterProfiles.length > 0 && (
                                  <div className="flex items-center -space-x-1 overflow-hidden shrink-0 select-none ml-1.5 bg-white/80 p-0.5 rounded-full border border-pink-200">
                                    {voterProfiles.map((prof) => (
                                      <img
                                        key={`${poll.id}-opt-${idx}-voter-${prof.id}`}
                                        src={prof.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                                        alt={prof.username}
                                        title={`${prof.username?.toUpperCase()} (followed) voted for this`}
                                        className="w-4 h-4 rounded-full border border-pink-200 object-cover shrink-0 bg-white"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </span>
                              <span className="text-[10px] text-pink-500 font-bold tracking-wider shrink-0 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                                [ ✨ VOTE ]
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {hasVoted && onUndoVote && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            sounds.playSelect();
                            onUndoVote(poll.id);
                          }}
                          className="text-[10px] text-pink-500 hover:text-rose-600 hover:underline font-bold tracking-wide cursor-pointer flex items-center gap-1"
                        >
                          [ ↩ Change My Vote ]
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expand Comments Indicator */}
                  {!commentsOpen && pollComments.length > 0 && (
                    <button
                      onClick={() => toggleComments(poll.id)}
                      className="text-xs text-pink-500 hover:text-pink-600 font-medium tracking-wide block"
                    >
                      💬 View all {pollComments.length} sweet comments...
                    </button>
                  )}
                </div>

                {/* 5. Collapsible Comments Section Drawer (Direct inline Instagram style) */}
                <AnimatePresence>
                  {commentsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="z-10 border-t border-pink-100 p-4 bg-pink-50/40 rounded-b-3xl flex flex-col gap-3 overflow-hidden"
                    >
                      {commentsEnabled ? (
                        <>
                          {/* Scrolling Comments Panel */}
                          <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-pink-200">
                            {pollComments.length === 0 ? (
                              <p className="font-medium text-xs text-pink-400 text-center py-6">
                                🌸 No comments yet! Be the first to share your thoughts.
                              </p>
                            ) : (
                              pollComments.map((comment) => {
                                const isCommenterAdmin = comment.username?.toUpperCase() === 'ADHYANGIRI6' || comment.username?.toUpperCase() === 'ARENA_MOD_X';
                                const commentUserClean = (comment.username || 'FAN').toUpperCase();
                                const isSelfComment = currentUser?.username?.toUpperCase() === commentUserClean;
                                const isFollowingCommenter = isUserFollowing(commentUserClean);

                                return (
                                  <div key={`com-${comment.id}`} className="p-3 bg-white/95 border border-pink-100/90 rounded-2xl flex items-start gap-3 shadow-xs">
                                    {/* Small circle avatar */}
                                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border border-pink-200 bg-pink-50 overflow-hidden shadow-xs">
                                      {(() => {
                                        const commenterProfile = allProfiles?.find(p => p.username?.toUpperCase() === commentUserClean);
                                        const commenterAvatarUrl = commenterProfile?.avatar_url;
                                        if (commenterAvatarUrl) {
                                          return (
                                            <img 
                                              src={commenterAvatarUrl} 
                                              alt={commentUserClean} 
                                              referrerPolicy="no-referrer"
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          );
                                        }
                                        return <span className="text-xs">🌸</span>;
                                      })()}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-bold text-gray-800 truncate max-w-[120px] flex items-center gap-1">
                                            {commentUserClean}
                                          </span>
                                          {isCommenterAdmin && (
                                            <span className="bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[8px] px-1.5 py-0.2 font-bold rounded-full shrink-0">
                                              Mod 🌸
                                            </span>
                                          )}
                                        </div>

                                        {/* Follow option for commenter */}
                                        {!isSelfComment && onFollow && onUnfollow && (
                                          <button
                                            onClick={() => {
                                              sounds.playTick();
                                              if (isFollowingCommenter) {
                                                onUnfollow(commentUserClean);
                                              } else {
                                                onFollow(commentUserClean, commentUserClean);
                                              }
                                            }}
                                            className="text-[9px] text-pink-500 hover:text-pink-600 font-bold"
                                          >
                                            {isFollowingCommenter ? 'Following' : '+ Follow'}
                                          </button>
                                        )}
                                      </div>

                                      <p className="text-xs text-gray-700 leading-relaxed break-words font-medium">
                                        {comment.text}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Inline Direct Comment submission Form */}
                          <form onSubmit={(e) => handleCommentSubmit(e, poll.id)} className="flex items-center gap-2 border-t border-pink-100 pt-3">
                            <input
                              type="text"
                              value={commentInputs[poll.id] || ''}
                              onChange={(e) => {
                                setCommentInputs(prev => ({
                                  ...prev,
                                  [poll.id]: e.target.value
                                }));
                              }}
                              disabled={!currentUser}
                              placeholder={
                                currentUser 
                                  ? `Say something sweet as ${currentUser.username}... 🌸` 
                                  : "Sign in to leave a sweet comment 🌸"
                              }
                              className="flex-1 bg-white border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 rounded-full px-4 py-2 text-xs text-gray-800 placeholder-pink-300 focus:outline-none transition-all"
                            />
                            <button
                              type="submit"
                              disabled={!currentUser || !(commentInputs[poll.id] || '').trim()}
                              className="bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500 disabled:opacity-40 px-4 py-2 rounded-full font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs active:scale-95"
                            >
                              Send 💌
                            </button>
                          </form>
                        </>
                      ) : (
                        /* Comments disabled */
                        <div className="p-4 border border-dashed border-pink-200 bg-white/70 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-pink-400" />
                          <p className="text-xs text-pink-400 font-medium">
                            Comments are turned off for this poll.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
