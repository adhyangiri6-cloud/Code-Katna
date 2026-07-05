import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Poll, DbComment, DbFollow } from '../types';
import { sounds } from './SoundManager';
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
            {/* Left Stickman (Black) */}
            <g className="animate-stick-left" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="70" cy="18" r="5" fill="#000000" />
              <line x1="70" y1="23" x2="70" y2="38" />
              <line x1="70" y1="26" x2="82" y2="24" strokeWidth="2" />
              <line x1="70" y1="26" x2="58" y2="28" strokeWidth="2" />
              <line x1="70" y1="38" x2="62" y2="54" />
              <line x1="70" y1="38" x2="78" y2="54" />
            </g>

            {/* Right Stickman (Orange) */}
            <g className="animate-stick-right" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="130" cy="18" r="5" fill="#FF6B00" />
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
  allProfiles = []
}: LivePollingGridProps) {
  
  // Track open comment sections per poll ID
  const [activeComments, setActiveComments] = useState<Record<string, boolean>>({});
  
  // Track input text per poll ID
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Local likes tracking to simulate double-tap or tap fires on posts
  const [likedPolls, setLikedPolls] = useState<Record<string, boolean>>({});
  const [extraLikes, setExtraLikes] = useState<Record<string, number>>({});

  const handleLike = (pollId: string) => {
    sounds.playSelect();
    const isLiked = likedPolls[pollId];
    setLikedPolls(prev => ({ ...prev, [pollId]: !isLiked }));
    setExtraLikes(prev => ({
      ...prev,
      [pollId]: (prev[pollId] || 0) + (isLiked ? -1 : 1)
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CLASSROOM':
        return <GraduationCap className="w-4 h-4 text-shonen-blue" />;
      case 'POP-CULTURE':
        return <Flame className="w-4 h-4 text-shonen-orange" />;
      default:
        return <Compass className="w-4 h-4 text-shonen-yellow" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CLASSROOM':
        return 'text-shonen-blue bg-shonen-blue/10 border-shonen-blue/20';
      case 'POP-CULTURE':
        return 'text-shonen-orange bg-shonen-orange/10 border-shonen-orange/20';
      default:
        return 'text-shonen-yellow bg-shonen-yellow/10 border-shonen-yellow/20';
    }
  };

  const [pollKicks, setPollKicks] = useState<Record<string, 'A' | 'B' | null>>({});

  const getAnimeThemeConfig = (hostName: string) => {
    return {
      rank: 'VELGRE VERIFIED HOST // ARENA OP',
      colorClass: 'border-shonen-orange text-shonen-orange bg-shonen-orange/5',
      glowColor: 'rgba(255, 107, 0, 0.4)',
      avatarSymbol: '🔥', // Velgre Flame Symbol
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-2 bg-black border border-shonen-orange/40 text-shonen-orange text-[10px] font-black px-3 py-1 uppercase tracking-widest clip-diagonal-reverse mb-3">
            {badgeIcon}
            {badgeText}
          </div>
          <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase font-sans flex items-center gap-2">
            <Sword className="w-5 h-5 text-shonen-orange animate-pulse" />
            {title}
          </h2>
          <p className="text-gray-500 font-mono text-[10px] mt-1 uppercase tracking-wider">
            {tagline}
          </p>
        </div>

        {/* Instagram style View Mode Toggle inside component as fallback */}
        {onToggleViewMode && (
          <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-1 shrink-0">
            <button
              onClick={() => {
                sounds.playTick();
                onToggleViewMode('FEED');
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono font-bold transition-all ${
                viewMode === 'FEED'
                  ? 'bg-shonen-orange text-white font-extrabold shadow-sm'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <List className="w-4 h-4" />
              FEED
            </button>
            <button
              onClick={() => {
                sounds.playTick();
                onToggleViewMode('GRID');
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono font-bold transition-all ${
                viewMode === 'GRID'
                  ? 'bg-shonen-orange text-white font-extrabold shadow-sm'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              GRID
            </button>
          </div>
        )}
      </div>

      {polls.length === 0 ? (
        <div className="text-center font-mono text-xs text-gray-400 py-16 border-2 border-dashed border-gray-200 uppercase">
          {emptyMessage}
        </div>
      ) : viewMode === 'GRID' ? (
        
        /* ==================== 1. INSTAGRAM GRID VIEW ==================== */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {polls.map((poll, idx) => {
            const hasVoted = poll.votedIndex !== undefined;
            const optionTotal = poll.options.reduce((sum, o) => sum + o.votes, 0);
            const totalVotes = poll.totalVotes + (extraLikes[poll.id] || 0);
            const pollComments = comments.filter(c => c.poll_id === poll.id);
            const animeConfig = getAnimeThemeConfig(poll.hostName || 'GATEKEEPER');

            return (
              <motion.div
                key={`grid-${poll.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="aspect-square relative group bg-white border border-gray-200 hover:border-shonen-orange cursor-pointer overflow-hidden transition-all duration-300 manga-panel"
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
                {/* Comic page screentone / background layout */}
                <div className="absolute inset-0 manga-screentone opacity-[0.06]" />
                <div className="absolute inset-0 manga-speedlines opacity-[0.03]" />
                
                {/* Featured / Spotlight visual mark */}
                {poll.is_spotlight && (
                  <div className="absolute top-2 left-2 z-15 bg-shonen-orange text-white text-[8px] font-black px-1 py-0.5 rounded-sm uppercase tracking-tighter">
                    SPOTLIGHT
                  </div>
                )}

                {/* Matchup content display */}
                <div className="absolute inset-0 flex flex-col justify-between p-3 z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[7px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-1 py-0.5">
                      {poll.category}
                    </span>
                    <span className="text-[14px] font-black" style={{ color: animeConfig.glowColor }}>
                      {animeConfig.avatarSymbol}
                    </span>
                  </div>

                  {/* VS clash title text in center */}
                  <div className="my-auto text-center px-1">
                    <p className="text-[10px] md:text-xs font-mono text-gray-600 font-bold uppercase truncate">
                      {poll.options[0]?.text || 'CONTENDER A'}
                    </p>
                    <p className="text-shonen-orange text-xs md:text-sm font-black italic my-0.5 tracking-tighter">
                      VS
                    </p>
                    <p className="text-[10px] md:text-xs font-mono text-gray-600 font-bold uppercase truncate">
                      {poll.options[1]?.text || 'CONTENDER B'}
                    </p>
                  </div>

                  <div className="truncate text-left text-[9px] font-mono font-black text-gray-600 uppercase leading-none border-t border-gray-100 pt-1.5">
                    {poll.title}
                  </div>
                </div>

                {/* Real Instagram Hover Statistics Overlay */}
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div className="flex items-center gap-1 text-shonen-orange font-mono font-bold text-sm">
                    <Flame className="w-5 h-5 text-shonen-orange animate-pulse" />
                    <span>{totalVotes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-shonen-blue font-mono font-bold text-sm">
                    <MessageSquare className="w-5 h-5 text-shonen-blue" />
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
            const totalLikes = poll.totalVotes + (extraLikes[poll.id] || 0);

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
                className="bg-white border-2 border-black rounded-none overflow-hidden manga-panel relative"
              >
                {/* 1. Feed Item Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    {/* Glowing Shonen Avatar Ring */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-black font-mono font-black border-2 text-base shadow-sm relative shrink-0"
                      style={{ 
                        borderColor: isLiked ? '#FF6B00' : '#e5e7eb',
                        boxShadow: isLiked ? `0 0 10px ${animeConfig.glowColor}` : 'none'
                      }}
                    >
                      {/* Spinning story gradient ring around avatar */}
                      <div className="absolute inset-[-3px] rounded-full -z-10 insta-story-ring opacity-80" />
                      {/* Innermost circle container */}
                      <div className="absolute inset-[1.5px] rounded-full bg-shonen-orange flex items-center justify-center text-white text-xs font-black">
                        {animeConfig.avatarSymbol}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-xs font-extrabold text-gray-900 tracking-tight uppercase hover:underline cursor-pointer">
                          {hostClean}
                        </span>
                        {isHostAdmin && (
                          <Crown className="w-3.5 h-3.5 text-shonen-orange animate-bounce shrink-0" />
                        )}
                        {poll.is_spotlight && (
                          <span className="bg-shonen-orange text-white font-sans text-[7px] px-1 font-black uppercase tracking-widest rounded-xs">
                            SPOTLIGHT
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">
                        {animeConfig.rank}
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
                        className={`text-[9px] font-sans font-black uppercase px-2.5 py-1 rounded-sm transition-all tracking-wider cursor-pointer border ${
                          isFollowingHost 
                            ? 'bg-transparent text-gray-400 border-gray-200' 
                            : 'bg-shonen-orange text-white border-shonen-orange font-extrabold hover:bg-black hover:border-black'
                        }`}
                      >
                        {isFollowingHost ? 'FOLLOWING' : 'FOLLOW'}
                      </button>
                    )}

                    {/* Delete Option */}
                    {currentUser?.id && poll.user_id && currentUser.id === poll.user_id && onDeletePoll && (
                      <button
                        onClick={() => onDeletePoll(poll.id, poll.user_id || '')}
                        className="text-[9px] font-mono text-shonen-red hover:text-white border border-shonen-red/20 px-2 py-0.5 rounded-sm hover:bg-shonen-red transition-all cursor-pointer"
                      >
                        PURGE
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Central Square Manga Clash Pane (Instagram Post content) */}
                <div className="relative aspect-square w-full bg-[#fcfbfc] flex flex-col justify-between overflow-hidden border-b border-gray-200 p-6">
                  {/* Background Speedlines */}
                  <div className="absolute inset-0 manga-screentone opacity-[0.08] z-0" />
                  <div className="absolute inset-0 manga-speedlines opacity-[0.04] z-0" />
                  
                  {/* Ambient glowing vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-100/10 via-transparent to-gray-50/10 pointer-events-none z-0" />

                  {/* Top Bar of the image: categories and system tags */}
                  <div className="z-10 flex justify-between items-center w-full">
                    <span className={`font-mono text-[9px] font-black border px-2 py-0.5 rounded-sm uppercase flex items-center gap-1.5 ${getCategoryColor(poll.category)}`}>
                      {getCategoryIcon(poll.category)}
                      {poll.category}
                    </span>
                    <span className="font-mono text-[8px] text-gray-400 tracking-widest uppercase">
                      SYS_STREAM_ID // {poll.id.slice(0, 6).toUpperCase()}
                    </span>
                  </div>

                  {/* Big Epic Title in Center */}
                  <div className="z-10 text-center my-auto py-4">
                    <span className="text-[9px] font-mono text-shonen-orange font-black uppercase tracking-[0.25em] block mb-1">
                      「 決戦 : KESSEN MATCHUP 」
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-950 uppercase tracking-tight leading-none px-2">
                      {poll.title}
                    </h3>
                    <p className="text-gray-600 text-xs font-sans mt-2 max-w-sm mx-auto opacity-95">
                      {poll.description}
                    </p>
                  </div>

                  {/* STICKMAN FIGHT ANIMATION */}
                  <StickmanFight kick={pollKicks[poll.id] || null} />

                  {/* Character matchup representation details */}
                  <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-5 flex items-center justify-between px-8">
                    <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xl font-bold bg-white/60 text-gray-400">
                      ⚔️
                    </div>
                    <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xl font-bold bg-white/60 text-gray-400">
                      🛡️
                    </div>
                  </div>

                  {/* VS Symbol at bottom of stage overlay */}
                  <div className="z-10 text-center w-full pb-2">
                    <span className="text-3xl font-black italic text-shonen-orange bg-white border-2 border-black px-4 py-1.5 inline-block transform -skew-x-12 shadow-sm">
                      VS
                    </span>
                  </div>
                </div>

                {/* 3. Post Interaction Action Bar (Instagram style icons) */}
                <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    {/* Double-tap fire hype button */}
                    <button
                      onClick={() => handleLike(poll.id)}
                      className={`transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1 ${
                        isLiked ? 'text-shonen-orange' : 'text-gray-400 hover:text-shonen-orange'
                      }`}
                      title="Double Hype (Like)"
                    >
                      <Flame className={`w-6 h-6 ${isLiked ? 'fill-shonen-orange animate-bounce' : ''}`} />
                    </button>

                    {/* Comments Toggle Balloon */}
                    <button
                      onClick={() => toggleComments(poll.id)}
                      className={`transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1 ${
                        commentsOpen ? 'text-shonen-blue' : 'text-gray-400 hover:text-shonen-blue'
                      }`}
                      title="View Arena Comms (Comments)"
                    >
                      <MessageSquare className="w-6 h-6" />
                    </button>

                    {/* Transmit Poll airplane */}
                    {onTransmitPoll && (
                      <button
                        onClick={() => {
                          sounds.playSelect();
                          onTransmitPoll(poll);
                        }}
                        className="transition-transform hover:scale-110 text-gray-400 hover:text-shonen-orange cursor-pointer"
                        title="Transmit / Share Stream"
                      >
                        <Send className="w-5.5 h-5.5 transform rotate-[-25deg] translate-y-[-1px]" />
                      </button>
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
                  <div className="font-sans text-xs font-extrabold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-shonen-orange" />
                    <span>{totalLikes.toLocaleString()} COMBAT HEARTS / STREAMED VOTES</span>
                  </div>

                  {/* Caption */}
                  <div className="text-xs font-sans leading-relaxed text-gray-700">
                    <span className="font-extrabold text-gray-950 uppercase mr-2">{hostClean}</span>
                    <span>Hypes the decisive bout: "{poll.title}". Cast your chakra or haki to lock results!</span>
                  </div>

                  {/* INTERACTIVE POLL OPTIONS (Rendered like Fighting Game Energy Bars!) */}
                  <div className="space-y-3 bg-gray-50 p-3.5 border border-gray-200">
                    {poll.options.map((option, idx) => {
                      const optionTotal = poll.options.reduce((sum, o) => sum + o.votes, 0);
                      const percent = optionTotal > 0 ? ((option.votes / optionTotal) * 100).toFixed(1) : '0.0';
                      const isSelected = poll.votedIndex === idx;

                      // Assign colorful chakra gauges
                      const gaugeColor = idx === 0 
                        ? 'bg-gradient-to-r from-shonen-orange to-shonen-yellow' 
                        : 'bg-gradient-to-r from-shonen-blue to-shonen-purple';

                      return (
                        <div key={`feed-${poll.id}-opt-${idx}`} className="relative">
                          {hasVoted ? (
                            /* VOTED PROGRESS BAR */
                            <div className={`relative h-11 border overflow-hidden flex items-center justify-between px-4 transition-all duration-300 ${
                              isSelected 
                                ? 'border-shonen-orange bg-shonen-orange/5' 
                                : 'border-gray-200 bg-white'
                            }`}>
                              {/* Glowing health bar energy gauge */}
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                                className={`absolute top-0 bottom-0 left-0 -z-0 opacity-20 ${gaugeColor}`}
                              />
                              
                              <span className={`font-mono text-xs font-bold truncate pr-4 z-10 flex items-center gap-1.5 ${
                                isSelected ? 'text-shonen-orange font-black' : 'text-gray-700'
                              }`}>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-shonen-orange flex-shrink-0" />}
                                {option.text.toUpperCase()}
                              </span>
                              
                              <span className={`font-mono text-xs font-black z-10 ${
                                isSelected ? 'text-shonen-orange' : 'text-gray-500'
                              }`}>
                                {percent}%
                              </span>
                            </div>
                          ) : (
                            /* ACTIVE VOTING BUTTON */
                            <button
                              onClick={() => handleOptionVote(poll.id, idx)}
                              className="w-full h-11 border-2 border-gray-200 hover:border-shonen-orange bg-white text-left font-sans text-xs font-black px-4 py-2 flex items-center justify-between transition-all duration-200 transform hover:translate-x-1 hover:bg-gray-50 cursor-pointer text-gray-800"
                            >
                              <span className="uppercase tracking-wide">{option.text}</span>
                              <span className="text-[9px] font-mono text-shonen-orange font-bold tracking-widest shrink-0">
                                [⚡ ACTIVATE]
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Expand Comments Indicator */}
                  {!commentsOpen && pollComments.length > 0 && (
                    <button
                      onClick={() => toggleComments(poll.id)}
                      className="font-mono text-[10px] text-gray-400 hover:text-shonen-orange uppercase tracking-wider block"
                    >
                      View all {pollComments.length} arena logs in combat comms...
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
                      className="z-10 border-t border-gray-200 p-4 bg-gray-50 flex flex-col gap-4 overflow-hidden"
                    >
                      {commentsEnabled ? (
                        <>
                          {/* Scrolling Comments Panel */}
                          <div className="max-h-52 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                            {pollComments.length === 0 ? (
                              <p className="font-mono text-[9px] text-gray-400 uppercase text-center py-6">
                                NO INTEL REGISTRATION LOGS YET. BE THE FIRST TO TRANSMIT!
                              </p>
                            ) : (
                              pollComments.map((comment) => {
                                const isCommenterAdmin = comment.username?.toUpperCase() === 'ADHYANGIRI6' || comment.username?.toUpperCase() === 'ARENA_MOD_X';
                                const isCommenterPremium = isCommenterAdmin || comment.username?.toUpperCase() === 'SENSEI_TANAKA';
                                const commentUserClean = (comment.username || 'SHINOBI').toUpperCase();
                                const isSelfComment = currentUser?.username?.toUpperCase() === commentUserClean;
                                const isFollowingCommenter = isUserFollowing(commentUserClean);
                                const commAnime = getAnimeThemeConfig(commentUserClean);

                                return (
                                  <div key={`com-${comment.id}`} className="p-2.5 bg-white border border-gray-100 flex items-start gap-2.5">
                                    {/* Small circle avatar with simple dynamic colors */}
                                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border border-gray-200 bg-gray-50 overflow-hidden">
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
                                        return <span className="text-[9px] font-mono font-black text-gray-700">{commAnime.avatarSymbol}</span>;
                                      })()}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-sans text-[10px] font-black text-gray-900 uppercase truncate max-w-[100px]">
                                            {commentUserClean}
                                          </span>
                                          {isCommenterAdmin && (
                                            <span className="bg-shonen-orange text-white font-mono text-[7px] px-1 font-black rounded-xs shrink-0">
                                              CPT
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
                                            className="text-[8px] font-mono text-shonen-orange hover:text-black uppercase font-black"
                                          >
                                            {isFollowingCommenter ? 'FOLLOWING' : '+FOLLOW'}
                                          </button>
                                        )}
                                      </div>

                                      <p className="text-[11px] font-sans text-gray-600 leading-normal break-words">
                                        {comment.text}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Inline Direct Comment submission Form */}
                          <form onSubmit={(e) => handleCommentSubmit(e, poll.id)} className="flex items-center gap-2 border-t border-gray-200 pt-3">
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
                                  ? "Write a comment as " + currentUser.username.toUpperCase() + "..." 
                                  : "LOG-IN TO POST IN FEED"
                              }
                              className="flex-1 bg-white border border-gray-200 focus:border-shonen-orange px-3 py-1.5 font-sans text-xs text-black placeholder-gray-400 focus:outline-none uppercase"
                            />
                            <button
                              type="submit"
                              disabled={!currentUser || !(commentInputs[poll.id] || '').trim()}
                              className="bg-shonen-orange text-white hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 px-3 py-1.5 border border-shonen-orange font-sans font-black text-xs uppercase shrink-0 cursor-pointer"
                            >
                              POST
                            </button>
                          </form>
                        </>
                      ) : (
                        /* Comments disabled */
                        <div className="p-3 border border-dashed border-gray-200 bg-gray-50 text-center flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-shonen-red" />
                          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-wide font-bold">
                            STREAM LOGS DISABLED FOR THIS ZONE.
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
