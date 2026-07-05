import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { Terminal, Shield, Users, Radio, Zap, X, User, MessageSquare, Ban } from 'lucide-react';
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
  onUnblock
}: OperatorProfileModalProps) {
  const [followerCount, setFollowerCount] = useState<number>(0);
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

    // Check if following
    const currentIsFollowing = follows.some(
      f => f.follower_id === currentUser?.id && f.following_id === profile.id
    );
    setIsFollowing(currentIsFollowing && !isBlocked);

    // Check mutual follow
    const otherFollowsCurrent = follows.some(
      f => f.follower_id === profile.id && f.following_id === currentUser?.id
    );
    setIsMutuallyFollowing(currentIsFollowing && otherFollowsCurrent && !isBlocked);

    // Fetch live follower count from Supabase
    const fetchLiveFollowers = async () => {
      try {
        const { data, error, count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        if (!error && count !== null) {
          setFollowerCount(count);
        } else {
          // fallback to local matches
          const localCount = follows.filter(f => f.following_id === profile.id).length;
          setFollowerCount(localCount);
        }
      } catch (err) {
        const localCount = follows.filter(f => f.following_id === profile.id).length;
        setFollowerCount(localCount);
      }
    };

    fetchLiveFollowers();
  }, [profile, isOpen, follows, currentUser?.id, isBlocked]);

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
        // check mutual again with the updated follows state in next tick
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sounds.playTick();
              onClose();
            }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />

          {/* scanlines effect */}
          <div className="absolute inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-white border-4 border-black p-6 md:p-8 clip-cyber-card overflow-hidden z-50 shadow-lg text-gray-950"
          >
            {/* Caution Line at Top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
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
                className="p-1.5 border border-gray-200 hover:border-shonen-orange hover:text-shonen-orange transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Card details */}
            <div className="space-y-6">
              {/* Profile Avatar / Logo with manga elements */}
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 relative">
                <div className={`w-14 h-14 font-mono font-black rounded-none shrink-0 flex items-center justify-center text-lg border-2 overflow-hidden ${
                  profile.is_premium 
                    ? 'bg-shonen-orange border-black text-white shadow-sm' 
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
                      <span className="font-mono text-[8px] bg-shonen-orange text-white px-1 py-0.5 border border-black rounded-none">
                        PREMIUM
                      </span>
                    )}
                  </h3>
                  <p className="font-mono text-xs text-shonen-orange uppercase font-bold tracking-wider mt-0.5">
                    {getArenaId(profile.id)}
                  </p>
                </div>

                {/* DIRECT MESSAGE ICON TRIGGER */}
                {currentUser?.id !== profile.id && onOpenDirectChat && (
                  <button
                    onClick={() => {
                      sounds.playPunchyCTA();
                      onClose();
                      onOpenDirectChat(profile.id, profile.username);
                    }}
                    disabled={isBlocked}
                    title={isBlocked ? "UNBLOCK TO SEND MESSAGE" : "ESTABLISH DIRECT SECURE TRANSMISSION"}
                    className={`p-2.5 border-2 transition-all shrink-0 cursor-pointer ${
                      isBlocked 
                        ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'border-black text-black hover:border-shonen-orange hover:text-shonen-orange bg-white hover:shadow-sm'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Bio & System parameters */}
              <div className="bg-gray-50 border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">
                    NEURAL PROTOCOL BIO
                  </label>
                  <p className="text-xs text-gray-700 font-mono uppercase leading-relaxed bg-white border border-gray-200 p-2.5 rounded-sm">
                    {profile.bio || 'NO BIO SPECS RETRIEVED FROM NODE CHASSIS.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                      CHASSIS MODEL
                    </label>
                    <p className="text-xs text-gray-900 font-mono font-bold uppercase">
                      {profile.gender || 'UNSPECIFIED'}
                    </p>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                      ARENA CYCLES
                    </label>
                    <p className="text-xs text-gray-900 font-mono font-bold uppercase">
                      {profile.age ? `${profile.age} CYCLES` : 'UNKNOWN'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics block */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 p-3 text-center">
                  <div className="inline-flex items-center gap-1 font-mono text-[9px] text-gray-500 uppercase tracking-wider mb-1 justify-center">
                    <Users className="w-3.5 h-3.5 text-shonen-orange" />
                    <span>FOLLOWER SIGNALS</span>
                  </div>
                  <p className="text-2xl font-black text-gray-950 font-mono">
                    {followerCount}
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3 text-center flex flex-col justify-center items-center">
                  <div className="inline-flex items-center gap-1 font-mono text-[9px] text-gray-500 uppercase tracking-wider mb-1 justify-center">
                    <Radio className="w-3.5 h-3.5 text-shonen-orange" />
                    <span>CONNECTION STATUS</span>
                  </div>
                  <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isMutuallyFollowing 
                      ? 'text-shonen-orange animate-pulse' 
                      : isFollowing 
                      ? 'text-shonen-orange' 
                      : 'text-gray-400'
                  }`}>
                    {isMutuallyFollowing 
                      ? '📡 MUTUAL FOLLOW' 
                      : isFollowing 
                      ? '⚡ WE FOLLOWED' 
                      : '🔒 OFFLINE'}
                  </p>
                </div>
              </div>

              {/* Actions Button Panel */}
              <div className="pt-2 flex flex-col gap-3">
                {/* Engage / Disengage Follow toggle */}
                {currentUser?.id !== profile.id ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || isBlocked}
                    onClick={handleToggleFollow}
                    className={`w-full py-3.5 font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 border-2 flex items-center justify-center gap-2 rounded-none cursor-pointer ${
                      isBlocked
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : isFollowing
                        ? 'bg-transparent border-shonen-orange text-shonen-orange hover:bg-shonen-orange hover:text-white'
                        : 'bg-transparent border-black text-black hover:bg-black hover:text-white'
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
                  <div className="text-center p-3 border border-gray-200 bg-gray-50 font-mono text-[10px] text-gray-400 uppercase">
                    🔒 SECURED PERSONAL CHASSIS NODE.
                  </div>
                )}

                {/* Direct Comms button if mutual follow */}
                {isMutuallyFollowing && onOpenDirectChat && !isBlocked && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      sounds.playPunchyCTA();
                      onClose();
                      onOpenDirectChat(profile.id, profile.username);
                    }}
                    className="w-full py-3 bg-shonen-orange border-2 border-black text-white font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 hover:bg-black hover:text-white shadow-sm rounded-none cursor-pointer"
                  >
                    ESTABLISH COMBAT COMMS
                  </motion.button>
                )}

                {/* BLOCK / UNBLOCK OPTION */}
                {currentUser?.id !== profile.id && (onBlock || onUnblock) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      sounds.playTick();
                      if (isBlocked) {
                        if (onUnblock) onUnblock(profile.id);
                      } else {
                        if (onBlock) onBlock(profile.id);
                      }
                    }}
                    className={`w-full py-2.5 font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-2 flex items-center justify-center gap-2 rounded-none cursor-pointer ${
                      isBlocked
                        ? 'bg-shonen-orange border-black text-white hover:bg-black'
                        : 'bg-transparent border-red-600 text-red-600 hover:border-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>
                      {isBlocked ? '[ 🔓 UNBLOCK OPERATOR PROTOCOL ]' : '[ 🚫 ACTIVATE BLOCK PROTOCOL ]'}
                    </span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
