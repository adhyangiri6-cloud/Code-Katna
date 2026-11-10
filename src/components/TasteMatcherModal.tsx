import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Poll, TasteMatchRequest } from '../types';
import { sounds } from './SoundManager';
import { 
  getTasteRequests, 
  saveTasteRequest, 
  calculateTasteSimilarity, 
  createTasteMatchRequest 
} from '../lib/dataStorage';
import { 
  Heart, 
  Sparkles, 
  Zap, 
  X, 
  Send, 
  Users, 
  CheckCircle, 
  Flame, 
  Star, 
  Smile, 
  MessageCircle,
  Share2
} from 'lucide-react';

interface TasteMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allProfiles: any[];
  polls: Poll[];
  initialTargetUser?: { id: string; username: string; avatar_url?: string; avatar?: string } | null;
  onOpenDirectChat?: (friendId: string, friendUsername: string) => void;
}

export default function TasteMatcherModal({
  isOpen,
  onClose,
  currentUser,
  allProfiles,
  polls,
  initialTargetUser,
  onOpenDirectChat
}: TasteMatcherModalProps) {
  const [requests, setRequests] = useState<TasteMatchRequest[]>([]);
  const [activeCelebration, setActiveCelebration] = useState<TasteMatchRequest | null>(null);
  const [celebrationScore, setCelebrationScore] = useState<number>(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  // Load and subscribe to requests
  const refreshRequests = () => {
    const list = getTasteRequests();
    setRequests(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshRequests();
      if (initialTargetUser && initialTargetUser.id !== currentUser?.id) {
        setSelectedTargetId(initialTargetUser.id);
      }
    }
  }, [isOpen, initialTargetUser]);

  useEffect(() => {
    const handleUpdate = () => refreshRequests();
    window.addEventListener('vote-arena-taste-requests-updated', handleUpdate);
    return () => window.removeEventListener('vote-arena-taste-requests-updated', handleUpdate);
  }, []);

  // Animate celebration score count-up
  useEffect(() => {
    if (!activeCelebration) {
      setCelebrationScore(0);
      return;
    }
    const target = activeCelebration.similarity_score || 88;
    setCelebrationScore(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= target) {
        setCelebrationScore(target);
        clearInterval(interval);
      } else {
        setCelebrationScore(current);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [activeCelebration]);

  if (!isOpen) return null;

  const currentUserId = currentUser?.id || 'guest';
  const incoming = requests.filter(r => r.to_user_id === currentUserId && r.status === 'pending');
  const outgoing = requests.filter(r => r.from_user_id === currentUserId && r.status === 'pending');
  const matched = requests.filter(
    r => (r.from_user_id === currentUserId || r.to_user_id === currentUserId) && r.status === 'accepted'
  );

  const handleSendRequest = () => {
    if (!currentUser) {
      sounds.playError();
      setNotice('PLEASE SECURE OPERATOR LOGIN TO RUN TASTE MATCHER.');
      return;
    }
    if (!selectedTargetId) {
      sounds.playError();
      setNotice('CHOOSE AN OPERATOR CHASSIS TO SEND TASTE MATCH REQUEST.');
      return;
    }
    const target = allProfiles.find(p => p.id === selectedTargetId);
    if (!target) return;

    sounds.playSelect();
    const result = createTasteMatchRequest(
      {
        id: currentUser.id || 'guest',
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        avatar: currentUser.avatar
      },
      {
        id: target.id,
        username: target.username,
        avatar_url: target.avatar_url,
        avatar: target.avatar || target.username.slice(0, 3).toUpperCase()
      },
      polls
    );

    refreshRequests();

    if (result.alreadyMatched) {
      sounds.playFanfare();
      setActiveCelebration(result.request);
    } else {
      sounds.playImpact();
      setNotice(`✨ TASTE MATCH REQUEST TRANSMITTED TO @${target.username}! Awaiting reciprocal sync.`);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleAcceptRequest = (req: TasteMatchRequest) => {
    sounds.playFanfare();
    const similarity = calculateTasteSimilarity(req.from_user_id, req.to_user_id, polls);
    const updated: TasteMatchRequest = {
      ...req,
      status: 'accepted',
      similarity_score: similarity.score,
      shared_votes_count: similarity.sharedCount,
      matched_categories: similarity.badges
    };
    saveTasteRequest(updated);
    refreshRequests();
    setActiveCelebration(updated);
  };

  const handleDeclineRequest = (req: TasteMatchRequest) => {
    sounds.playError();
    const updated: TasteMatchRequest = { ...req, status: 'declined' };
    saveTasteRequest(updated);
    refreshRequests();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          sounds.playTick();
          onClose();
        }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Main Modal Card */}
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        className="relative w-full max-w-xl bg-white border-4 border-black p-5 sm:p-7 clip-cyber-card z-50 shadow-2xl text-gray-950 overflow-hidden"
      >
        {/* Cute Anime Pink/Orange Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playTick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 border border-black hover:bg-black hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 font-mono text-pink-600 text-[10px] font-black uppercase tracking-widest mb-1 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
            TWO-WAY ANIME RESONANCE PROTOCOL
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 uppercase tracking-tighter flex items-center gap-2">
            TASTE <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-amber-600">MATCHER</span>
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
          </h2>
          <p className="font-mono text-xs text-gray-600 uppercase tracking-tight mt-1">
            Send a reciprocal taste maker sync request. When both sides accept, a cute anime similarity resonance runs live!
          </p>
        </div>

        {/* Status Notice */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-pink-50 border-2 border-pink-500 text-pink-900 font-mono text-xs font-bold rounded-none flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            <span>{notice}</span>
          </motion.div>
        )}

        {/* SEND REQUEST FORM */}
        <div className="bg-pink-50/60 border-2 border-black p-4 mb-5 rounded-none">
          <label className="block font-mono text-[10px] font-black uppercase tracking-wider text-pink-900 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            SELECT OPERATOR TO PROPOSE TASTE RESONANCE:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="flex-1 bg-white border-2 border-black px-3 py-2 font-mono text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">-- Choose Operator Chassis --</option>
              {allProfiles
                .filter(p => p.id !== currentUser?.id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    @{p.username} ({p.id.slice(0, 8).toUpperCase()})
                  </option>
                ))}
            </select>
            <button
              onClick={handleSendRequest}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-mono text-xs font-black uppercase tracking-wider border-2 border-black hover:opacity-95 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND TASTE REQUEST</span>
            </button>
          </div>
        </div>

        {/* INCOMING REQUESTS (TWO-WAY AWAITING CONFIRMATION) */}
        {incoming.length > 0 && (
          <div className="mb-5 bg-amber-50 border-2 border-black p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-mono text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" />
                INCOMING TASTE REQUESTS ({incoming.length})
              </span>
              <span className="font-mono text-[8px] bg-amber-200 text-amber-900 px-1.5 py-0.5 font-bold uppercase">
                AWAITING YOUR YES
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {incoming.map(req => (
                <div key={req.id} className="bg-white border-2 border-black p-2.5 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full border-2 border-black overflow-hidden bg-pink-100 flex items-center justify-center shrink-0 font-mono text-xs font-black">
                      {req.from_avatar ? (
                        <img src={req.from_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        req.from_username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-xs font-black text-gray-900 truncate">
                        @{req.from_username}
                      </p>
                      <p className="font-mono text-[9px] text-gray-500">
                        Wants to run anime taste matcher with you!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-mono text-[10px] font-black uppercase border border-black transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Heart className="w-3 h-3 fill-white" />
                      <span>ACCEPT</span>
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req)}
                      className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[10px] font-bold uppercase border border-black transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE TASTE TWIN MATCHES */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
            <span className="font-mono text-[10px] font-black text-gray-950 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              CONFIRMED TASTE TWINS ({matched.length})
            </span>
            <span className="font-mono text-[8px] text-gray-500 uppercase">
              RECIPROCAL RESONANCES
            </span>
          </div>

          {matched.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 border border-gray-200 p-4">
              <p className="font-mono text-xs text-gray-400 uppercase">
                NO RECIPROCAL TASTE MATCHES ESTABLISHED YET.
              </p>
              <p className="font-mono text-[10px] text-gray-500 mt-1">
                Select an operator above or view any profile dossier to propose a match!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {matched.map(req => {
                const isFrom = req.from_user_id === currentUserId;
                const partnerName = isFrom ? req.to_username : req.from_username;
                const partnerAvatar = isFrom ? req.to_avatar : req.from_avatar;
                const partnerId = isFrom ? req.to_user_id : req.from_user_id;

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      sounds.playFanfare();
                      setActiveCelebration(req);
                    }}
                    className="p-3 bg-gradient-to-br from-pink-50 to-amber-50 border-2 border-black hover:border-pink-500 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full border border-black overflow-hidden bg-white shrink-0 font-mono text-[10px] font-black flex items-center justify-center">
                          {partnerAvatar ? (
                            <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            partnerName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="font-sans text-xs font-black text-gray-900 truncate">
                          @{partnerName}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-pink-600 bg-white border border-black px-1.5 py-0.5 rounded-none">
                        {req.similarity_score || 92}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-600">
                      <span>🌸 {req.shared_votes_count || 1} Shared Opinions</span>
                      <span className="text-pink-600 font-bold group-hover:underline">VIEW SYNC ✨</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* FULL CUTE ANIME SIMILARITY ANIMATION OVERLAY */}
      <AnimatePresence>
        {activeCelebration && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-hidden">
            {/* Dark Magical Backdrop with Sakura / Sparkle Gradient */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-b from-purple-950/95 via-pink-950/95 to-black/95 backdrop-blur-md"
            />

            {/* Anime Starry Particles Overlay */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
              <style>{`
                @keyframes float-sakura {
                  0% { transform: translateY(-10%) rotate(0deg); opacity: 0.8; }
                  100% { transform: translateY(110%) rotate(360deg); opacity: 0; }
                }
                .sakura-petal {
                  position: absolute;
                  animation: float-sakura 4s linear infinite;
                }
              `}</style>
              <div className="sakura-petal text-2xl left-[10%] top-0">🌸</div>
              <div className="sakura-petal text-xl left-[25%] top-[-20px] animation-delay-1000">✨</div>
              <div className="sakura-petal text-2xl left-[45%] top-[-10px] animation-delay-2000">🌸</div>
              <div className="sakura-petal text-xl left-[70%] top-[-30px] animation-delay-500">💖</div>
              <div className="sakura-petal text-2xl left-[85%] top-0 animation-delay-1500">✨</div>
            </div>

            {/* Anime Celebration Card */}
            <motion.div
              initial={{ scale: 0.6, rotate: -3, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative w-full max-w-lg bg-white border-4 border-black p-6 sm:p-8 clip-cyber-card z-20 shadow-[0_0_50px_rgba(244,63,94,0.4)] text-gray-950 text-center overflow-hidden"
            >
              {/* Cute Anime Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-pink-500 via-yellow-400 to-rose-500" />

              <button
                onClick={() => {
                  sounds.playTick();
                  setActiveCelebration(null);
                }}
                className="absolute top-4 right-4 p-1.5 border border-black hover:bg-black hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Tag */}
              <div className="inline-flex items-center gap-1.5 font-mono text-pink-600 text-xs font-black uppercase tracking-widest mb-3 bg-pink-100 border border-pink-300 px-3 py-1 rounded-full shadow-xs">
                <Sparkles className="w-4 h-4 text-pink-600 animate-spin" />
                KAWAII TASTE RESONANCE DETECTED
                <Sparkles className="w-4 h-4 text-pink-600 animate-spin" />
              </div>

              {/* Both Avatars with Anime Pulsing Aura */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 my-6 relative">
                {/* Left User */}
                <motion.div
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-pink-500 overflow-hidden bg-pink-50 shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center font-mono font-black text-xl">
                    {activeCelebration.from_avatar ? (
                      <img src={activeCelebration.from_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeCelebration.from_username.slice(0, 3).toUpperCase()
                    )}
                  </div>
                  <span className="font-sans text-xs font-black text-gray-900 mt-2 truncate max-w-[100px]">
                    @{activeCelebration.from_username}
                  </span>
                </motion.div>

                {/* Animated Heart Resonance Beam */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="flex flex-col items-center justify-center z-10"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 border-2 border-black flex items-center justify-center shadow-lg text-white">
                    <Heart className="w-7 h-7 fill-white animate-pulse" />
                  </div>
                  <span className="font-mono text-[9px] font-black text-pink-600 mt-1 uppercase tracking-widest">
                    RESONANCE
                  </span>
                </motion.div>

                {/* Right User */}
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-amber-500 overflow-hidden bg-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center font-mono font-black text-xl">
                    {activeCelebration.to_avatar ? (
                      <img src={activeCelebration.to_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeCelebration.to_username.slice(0, 3).toUpperCase()
                    )}
                  </div>
                  <span className="font-sans text-xs font-black text-gray-900 mt-2 truncate max-w-[100px]">
                    @{activeCelebration.to_username}
                  </span>
                </motion.div>
              </div>

              {/* Dynamic Similarity Score Counter */}
              <div className="bg-pink-50/80 border-2 border-black p-4 mb-5 rounded-none">
                <span className="font-mono text-[10px] font-black uppercase text-pink-900 tracking-wider block mb-1">
                  TASTE AFFINITY RATIO
                </span>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-amber-600 font-mono tracking-tight">
                  {celebrationScore}%
                </div>
                <div className="w-full bg-gray-200 h-3 border border-black mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-500"
                    style={{ width: `${celebrationScore}%` }}
                  />
                </div>
                <p className="font-sans font-extrabold text-xs text-pink-900 uppercase mt-2">
                  {celebrationScore >= 90
                    ? '💖 ULTRA SYNERGY! You two have near-identical taste in anime, clash battles & pop-culture!'
                    : '🌸 HIGH HARMONY! Your opinions strongly align across key arena tournament polls!'}
                </p>
              </div>

              {/* Anime Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
                {(activeCelebration.matched_categories || [
                  '✨ SOUL LINK S-RANK',
                  '🌸 KAWAII TASTE TWINS',
                  '⚔️ SHONEN SYNERGY'
                ]).map((badge, idx) => (
                  <span
                    key={idx}
                    className="bg-white border-2 border-black text-gray-900 font-mono text-[10px] font-black px-2.5 py-1 uppercase shadow-xs"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {onOpenDirectChat && (
                  <button
                    onClick={() => {
                      sounds.playPunchyCTA();
                      const partnerId = activeCelebration.from_user_id === currentUserId
                        ? activeCelebration.to_user_id
                        : activeCelebration.from_user_id;
                      const partnerName = activeCelebration.from_user_id === currentUserId
                        ? activeCelebration.to_username
                        : activeCelebration.from_username;
                      setActiveCelebration(null);
                      onClose();
                      onOpenDirectChat(partnerId, partnerName);
                    }}
                    className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-mono text-xs font-black uppercase tracking-wider border-2 border-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>CHAT WITH TASTE TWIN</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    sounds.playSelect();
                    setActiveCelebration(null);
                  }}
                  className="py-3 px-6 bg-white hover:bg-gray-100 text-black font-mono text-xs font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
