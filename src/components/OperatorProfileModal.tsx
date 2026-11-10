import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { 
  Terminal, 
  Shield, 
  Users, 
  Radio, 
  Zap, 
  X, 
  User, 
  MessageSquare, 
  Ban, 
  Heart, 
  Sparkles, 
  ArrowLeft,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { DbFollow } from '../types';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    username: string;
    bio?: string;
    gender?: string;
    age?: number | null;
    is_premium?: boolean;
    avatar_url?: string;
  } | null;
  currentUser: any;
  follows: DbFollow[];
  onFollow: (id: string, name: string) => Promise<void>;
  onUnfollow: (id: string) => Promise<void>;
  onOpenDirectChat?: (friendId: string, friendUsername: string) => void;
  blockedUsers?: string[];
  onBlock?: (id: string) => void;
  onUnblock?: (id: string) => void;
  polls?: any[];
  allProfiles?: any[];
  onSelectProfile?: (profile: any) => void;
  onOpenTasteMatcher?: (targetUser: any) => void;
}

export default function OperatorProfileModal({
  isOpen,
  onClose,
  profile,
  currentUser,
  follows,
  onFollow,
  onUnfollow,
  onOpenDirectChat,
  blockedUsers = [],
  onBlock,
  onUnblock,
  polls = [],
  allProfiles = [],
  onSelectProfile,
  onOpenTasteMatcher
}: OperatorProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'dossier' | 'followers' | 'following'>('dossier');
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isMutuallyFollowing, setIsMutuallyFollowing] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isBlocked = profile ? blockedUsers.includes(profile.id) : false;

  // Derive arena ID format
  const getArenaId = (id: string) => {
    return `ARENA-${id.slice(0, 8).toUpperCase()}`;
  };

  useEffect(() => {
    if (!profile || !isOpen) return;

    setActiveTab('dossier');

    // Check if current user is following profile
    const currentIsFollowing = follows.some(
      f => f.follower_id === currentUser?.id && f.following_id === profile.id
    );
    setIsFollowing(currentIsFollowing && !isBlocked);

    // Check mutual follow
    const otherFollowsCurrent = follows.some(
      f => f.follower_id === profile.id && f.following_id === currentUser?.id
    );
    setIsMutuallyFollowing(currentIsFollowing && otherFollowsCurrent && !isBlocked);

    // Calculate followers & following from local follows and Supabase
    const computeConnections = async () => {
      // Local matches
      const localFollowers = follows.filter(f => f.following_id === profile.id);
      const localFollowing = follows.filter(f => f.follower_id === profile.id);

      // Hydrate with allProfiles metadata
      const hydrateList = (followEntries: DbFollow[], isFollowerList: boolean) => {
        return followEntries.map(entry => {
          const targetId = isFollowerList ? entry.follower_id : entry.following_id;
          const targetName = isFollowerList ? (entry.follower_username || 'OPERATOR') : (entry.following_username || 'OPERATOR');
          const found = allProfiles.find(p => p.id === targetId);
          return {
            id: targetId,
            username: found?.username || targetName,
            avatar_url: found?.avatar_url,
            bio: found?.bio || 'Active Combatant in Arena Subnet.',
            is_premium: found?.is_premium
          };
        });
      };

      setFollowersList(hydrateList(localFollowers, true));
      setFollowingList(hydrateList(localFollowing, false));
      setFollowerCount(localFollowers.length);
      setFollowingCount(localFollowing.length);

      // Try fetching live exact count from Supabase
      try {
        const { count: dbFollowerCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        if (dbFollowerCount !== null && dbFollowerCount !== undefined) {
          setFollowerCount(Math.max(dbFollowerCount, localFollowers.length));
        }

        const { count: dbFollowingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);

        if (dbFollowingCount !== null && dbFollowingCount !== undefined) {
          setFollowingCount(Math.max(dbFollowingCount, localFollowing.length));
        }
      } catch (err) {
        // silent fallback to local counts
      }
    };

    computeConnections();
  }, [profile, isOpen, follows, currentUser?.id, isBlocked, allProfiles]);

  if (!profile) return null;

  const handleToggleFollow = async () => {
    if (!currentUser) {
      sounds.playError();
      alert('PLEASE SECURE OPERATOR LOGIN TO ENGAGE FOLLOW PROTOCOL.');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        sounds.playError();
        await onUnfollow(profile.id);
        setFollowerCount(prev => Math.max(0, prev - 1));
        setIsFollowing(false);
        setIsMutuallyFollowing(false);
      } else {
        sounds.playSelect();
        await onFollow(profile.id, profile.username);
        setFollowerCount(prev => prev + 1);
        setIsFollowing(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sounds.playTick();
              onClose();
            }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md"
          />

          {/* scanlines effect */}
          <div className="fixed inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-white border-4 border-black p-5 sm:p-7 clip-cyber-card overflow-hidden z-50 shadow-2xl text-gray-950"
          >
            {/* Caution Line at Top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 font-mono text-shonen-orange text-[10px] font-black uppercase mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  SUBNET // PROFILE_SPECTRE
                </div>
                <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter">
                  OPERATOR <span className="text-shonen-orange">DOSSIER</span>
                </h2>
              </div>
              <button
                onClick={() => {
                  sounds.playTick();
                  onClose();
                }}
                className="p-1.5 border border-gray-200 hover:border-shonen-orange hover:text-shonen-orange transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB NAVIGATION: DOSSIER vs FOLLOWERS vs FOLLOWING */}
            <div className="flex border-2 border-black bg-gray-100 mb-4 p-0.5">
              <button
                onClick={() => {
                  sounds.playTick();
                  setActiveTab('dossier');
                }}
                className={`flex-1 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'dossier'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                DOSSIER
              </button>
              <button
                onClick={() => {
                  sounds.playTick();
                  setActiveTab('followers');
                }}
                className={`flex-1 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'followers'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>FOLLOWERS ({followerCount})</span>
              </button>
              <button
                onClick={() => {
                  sounds.playTick();
                  setActiveTab('following');
                }}
                className={`flex-1 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'following'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>FOLLOWING ({followingCount})</span>
              </button>
            </div>

            {/* TAB 1: MAIN DOSSIER VIEW */}
            {activeTab === 'dossier' && (
              <div className="space-y-4">
                {/* Profile Avatar / Identity */}
                <div className="flex items-center gap-4 bg-gray-50 border-2 border-black p-3.5 relative">
                  <div className={`w-14 h-14 font-mono font-black shrink-0 flex items-center justify-center text-lg border-2 overflow-hidden shadow-xs ${
                    profile.is_premium 
                      ? 'bg-gradient-to-tr from-pink-500 to-amber-500 border-black text-white' 
                      : 'bg-white border-black text-black'
                  }`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      profile.username.slice(0, 3).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-extrabold text-gray-950 uppercase tracking-tight flex items-center gap-1.5 truncate">
                      {profile.username}
                      {profile.is_premium && (
                        <span className="font-mono text-[8px] bg-gradient-to-r from-pink-600 to-amber-500 text-white px-1.5 py-0.5 border border-black font-black">
                          PREMIUM
                        </span>
                      )}
                    </h3>
                    <p className="font-mono text-xs text-shonen-orange uppercase font-bold tracking-wider mt-0.5">
                      {getArenaId(profile.id)}
                    </p>
                  </div>

                  {/* Direct message icon */}
                  {currentUser?.id !== profile.id && onOpenDirectChat && (
                    <button
                      onClick={() => {
                        sounds.playPunchyCTA();
                        onClose();
                        onOpenDirectChat(profile.id, profile.username);
                      }}
                      disabled={isBlocked}
                      title={isBlocked ? "UNBLOCK TO SEND MESSAGE" : "ESTABLISH DIRECT SECURE TRANSMISSION"}
                      className={`p-2 border-2 transition-all shrink-0 cursor-pointer ${
                        isBlocked 
                          ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'border-black text-black hover:border-shonen-orange hover:text-shonen-orange bg-white hover:shadow-xs'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Bio & Parameters */}
                <div className="bg-gray-50 border border-gray-200 p-3.5 space-y-3">
                  <div>
                    <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                      CHASSIS BIO
                    </label>
                    <p className="text-xs text-gray-800 font-mono leading-relaxed bg-white border border-gray-200 p-2.5">
                      {profile.bio || 'NO BIO SPECS RETRIEVED FROM NODE CHASSIS.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">
                        CHASSIS MODEL
                      </label>
                      <p className="text-xs text-gray-900 font-mono font-bold uppercase">
                        {profile.gender || 'UNSPECIFIED'}
                      </p>
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">
                        ARENA CYCLES
                      </label>
                      <p className="text-xs text-gray-900 font-mono font-bold uppercase">
                        {profile.age ? `${profile.age} CYCLES` : 'UNKNOWN'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TWO-WAY TASTE MATCHER BUTTON */}
                {currentUser?.id !== profile.id && onOpenTasteMatcher && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      sounds.playFanfare();
                      onOpenTasteMatcher({
                        id: profile.id,
                        username: profile.username,
                        avatar_url: profile.avatar_url,
                        avatar: profile.username.slice(0, 3).toUpperCase()
                      });
                    }}
                    className="w-full py-3 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-mono text-xs font-black uppercase tracking-widest border-2 border-black hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-white animate-pulse" />
                    <span>[ ✨ RUN TASTE MATCHER WITH @{profile.username} ]</span>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  </motion.button>
                )}

                {/* Follow & Action Buttons */}
                <div className="pt-1 flex flex-col gap-2.5">
                  {currentUser?.id !== profile.id ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading || isBlocked}
                      onClick={handleToggleFollow}
                      className={`w-full py-3 font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 border-2 flex items-center justify-center gap-2 cursor-pointer ${
                        isBlocked
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : isFollowing
                          ? 'bg-transparent border-shonen-orange text-shonen-orange hover:bg-shonen-orange hover:text-white'
                          : 'bg-black text-white hover:bg-shonen-orange hover:border-black'
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${isFollowing ? 'animate-pulse' : ''}`} />
                      <span>
                        {loading 
                          ? 'SYNCHRONIZING...' 
                          : isBlocked
                          ? '🔒 FOLLOW BLOCKED'
                          : isFollowing 
                          ? '[ DISENGAGE FOLLOW ]' 
                          : '[ ⚡ ENGAGE FOLLOW ]'}
                      </span>
                    </motion.button>
                  ) : (
                    <div className="text-center p-2.5 border border-gray-200 bg-gray-50 font-mono text-[10px] text-gray-400 uppercase">
                      🔒 SECURED PERSONAL CHASSIS NODE.
                    </div>
                  )}

                  {/* Block / Unblock Button */}
                  {currentUser?.id !== profile.id && (onBlock || onUnblock) && (
                    <button
                      onClick={() => {
                        sounds.playTick();
                        if (isBlocked) {
                          if (onUnblock) onUnblock(profile.id);
                        } else {
                          if (onBlock) onBlock(profile.id);
                        }
                      }}
                      className={`w-full py-2 font-mono text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 cursor-pointer ${
                        isBlocked
                          ? 'bg-shonen-orange border-black text-white hover:bg-black'
                          : 'bg-transparent border-gray-300 text-gray-500 hover:border-red-600 hover:text-red-600'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isBlocked ? '[ 🔓 UNBLOCK OPERATOR ]' : '[ 🚫 BLOCK OPERATOR ]'}</span>
                    </button>
                  )}
                </div>

                {/* USER TRANSMISSIONS (POSTS) */}
                <div className="bg-gray-50 border-2 border-black p-3 space-y-2 mt-2">
                  <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                    <span className="font-mono text-[10px] font-black text-shonen-orange tracking-widest uppercase flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      TRANSMISSIONS ({polls.filter(p => p.hostName?.toUpperCase() === profile.username?.toUpperCase() || p.user_id === profile.id).length})
                    </span>
                    <span className="font-mono text-[8px] text-gray-400">
                      HOSTED SECTORS
                    </span>
                  </div>

                  {(() => {
                    const userPolls = polls.filter(
                      p => p.hostName?.toUpperCase() === profile.username?.toUpperCase() || p.user_id === profile.id
                    );

                    if (userPolls.length === 0) {
                      return (
                        <p className="text-[10px] text-gray-400 font-mono text-center py-3 uppercase">
                          NO ACTIVE TRANSMISSIONS SIGNALED IN THIS NODE.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {userPolls.map((p) => (
                          <div key={p.id} className="border border-black p-2 bg-white space-y-1 transition-all hover:bg-shonen-orange/5">
                            <div className="flex justify-between items-center">
                              <span className="bg-black text-white font-mono text-[7px] px-1.5 py-0.5 uppercase tracking-widest font-bold">
                                {p.category || 'ARENA'}
                              </span>
                              <span className="font-mono text-[8px] text-gray-500 font-bold">
                                {p.totalVotes || 0} VOTES
                              </span>
                            </div>
                            <p className="font-sans text-xs font-extrabold text-gray-900 uppercase tracking-tight line-clamp-1">
                              {p.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE FOLLOWERS LIST */}
            {activeTab === 'followers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                  <span className="font-mono text-[10px] font-black uppercase text-gray-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-shonen-orange" />
                    FOLLOWERS OF @{profile.username}
                  </span>
                  <button
                    onClick={() => setActiveTab('dossier')}
                    className="font-mono text-[9px] text-shonen-orange hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> BACK
                  </button>
                </div>

                {followersList.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 border border-gray-200 p-4">
                    <Users className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="font-mono text-xs text-gray-400 uppercase">
                      NO FOLLOWER SIGNALS DETECTED YET.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {followersList.map(item => (
                      <div
                        key={item.id}
                        className="bg-white border-2 border-black p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 transition-all shadow-xs"
                      >
                        <div
                          onClick={() => {
                            sounds.playSelect();
                            if (onSelectProfile) onSelectProfile(item);
                          }}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                        >
                          <div className="w-9 h-9 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 font-mono text-xs font-black">
                            {item.avatar_url ? (
                              <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              item.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans text-xs font-black text-gray-900 truncate flex items-center gap-1">
                              @{item.username}
                              {item.is_premium && (
                                <span className="font-mono text-[7px] bg-shonen-orange text-white px-1 font-bold">
                                  PRO
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-[9px] text-gray-500 truncate max-w-[170px]">
                              {item.bio}
                            </p>
                          </div>
                        </div>

                        {onOpenTasteMatcher && item.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              sounds.playFanfare();
                              onOpenTasteMatcher(item);
                            }}
                            title="Run Taste Matcher"
                            className="p-1.5 bg-pink-50 border border-pink-400 text-pink-600 hover:bg-pink-600 hover:text-white transition-all cursor-pointer shrink-0"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: INTERACTIVE FOLLOWING LIST */}
            {activeTab === 'following' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                  <span className="font-mono text-[10px] font-black uppercase text-gray-700 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-shonen-orange" />
                    OPERATORS FOLLOWED BY @{profile.username}
                  </span>
                  <button
                    onClick={() => setActiveTab('dossier')}
                    className="font-mono text-[9px] text-shonen-orange hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> BACK
                  </button>
                </div>

                {followingList.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 border border-gray-200 p-4">
                    <Radio className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="font-mono text-xs text-gray-400 uppercase">
                      NOT FOLLOWING ANY OPERATOR CHASSIS YET.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {followingList.map(item => (
                      <div
                        key={item.id}
                        className="bg-white border-2 border-black p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 transition-all shadow-xs"
                      >
                        <div
                          onClick={() => {
                            sounds.playSelect();
                            if (onSelectProfile) onSelectProfile(item);
                          }}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                        >
                          <div className="w-9 h-9 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 font-mono text-xs font-black">
                            {item.avatar_url ? (
                              <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              item.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans text-xs font-black text-gray-900 truncate flex items-center gap-1">
                              @{item.username}
                              {item.is_premium && (
                                <span className="font-mono text-[7px] bg-shonen-orange text-white px-1 font-bold">
                                  PRO
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-[9px] text-gray-500 truncate max-w-[170px]">
                              {item.bio}
                            </p>
                          </div>
                        </div>

                        {onOpenTasteMatcher && item.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              sounds.playFanfare();
                              onOpenTasteMatcher(item);
                            }}
                            title="Run Taste Matcher"
                            className="p-1.5 bg-pink-50 border border-pink-400 text-pink-600 hover:bg-pink-600 hover:text-white transition-all cursor-pointer shrink-0"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
