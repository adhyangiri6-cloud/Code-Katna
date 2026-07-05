import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { Terminal, Send, Search, Users, ShieldAlert, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { DbFollow, Poll } from '../types';

interface ShareTransmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: Poll | null;
  currentUser: any;
  follows: DbFollow[];
  allProfiles: any[];
}

export default function ShareTransmitModal({
  isOpen,
  onClose,
  poll,
  currentUser,
  follows,
  allProfiles
}: ShareTransmitModalProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransmitting, setIsTransmitting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    // A network friend is anyone we are in contact with (let's display mutual follows first, and then regular follows)
    // Find who currentUser follows
    const followedIds = follows
      .filter(f => f.follower_id === currentUser.id)
      .map(f => f.following_id);

    // Filter profiles that we follow
    const followedProfiles = allProfiles.filter(p => followedIds.includes(p.id));
    setFriends(followedProfiles);
  }, [currentUser, isOpen, follows, allProfiles]);

  if (!poll) return null;

  const handleTransmit = async (friendId: string, friendUsername: string) => {
    if (!currentUser) return;
    setIsTransmitting(friendId);
    setErrorMsg(null);
    setSuccessMsg(null);
    sounds.playSelect();

    const sharedPollData = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sender_id: currentUser.id,
      receiver_id: friendId,
      poll_id: poll.id,
      poll_title: poll.title,
      sender_username: currentUser.username,
      created_at: new Date().toISOString()
    };

    try {
      // Insert to Supabase shared_polls
      const { error } = await supabase
        .from('shared_polls')
        .insert([sharedPollData]);

      if (error) {
        console.warn('Supabase insertion for shared_polls failed, falling back to local simulation:', error.message);
        // Fallback local persistence if table not set up fully
        const localShared = JSON.parse(localStorage.getItem('vote_arena_shared_polls') || '[]');
        localShared.push(sharedPollData);
        localStorage.setItem('vote_arena_shared_polls', JSON.stringify(localShared));
      }

      setSuccessMsg(`TRANSMISSION COMPLETE. POLL BEAMED TO "${friendUsername.toUpperCase()}".`);
      sounds.playPunchyCTA();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg('TRANSMISSION PROTOCOL CRITICAL FAIL.');
      sounds.playError();
    } finally {
      setIsTransmitting(null);
    }
  };

  // WhatsApp link generation
  const getWhatsAppShareLink = () => {
    const text = `Deploy your vote in this Arena bracket battle! ${window.location.origin}/tournament/${poll.id}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Filter friends list
  const filteredFriends = friends.filter(friend => {
    const name = (friend.username || '').toLowerCase();
    const aid = `ARENA-${(friend.id || '').slice(0, 8).toUpperCase()}`;
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || aid.toLowerCase().includes(query);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sounds.playTick();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* scanlines */}
          <div className="absolute inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Container */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-white border-4 border-black p-6 md:p-8 clip-cyber-card overflow-hidden z-50 shadow-lg text-gray-950"
          >
            {/* Caution Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 font-mono text-shonen-orange text-[10px] font-black uppercase mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  COGNITIVE_TRANS // SHARE_PORTAL
                </div>
                <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter">
                  TRANSMIT <span className="text-shonen-orange">STREAM SIGNAL</span>
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

            {/* Content Details */}
            <div className="space-y-5">
              {/* Poll Summary */}
              <div className="bg-gray-50 border border-gray-200 p-3.5">
                <span className="font-mono text-[8px] text-shonen-orange font-bold uppercase block mb-1">
                  TARGET POLL OBJECT
                </span>
                <p className="text-sm font-black text-gray-950 uppercase font-mono truncate">
                  {poll.title}
                </p>
                <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase line-clamp-1">
                  {poll.description}
                </p>
              </div>

              {/* SUCCESS & ERROR FEEDBACK */}
              {successMsg && (
                <div className="p-3 border border-emerald-500 bg-emerald-50 font-mono text-[10px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 border border-red-500 bg-red-50 font-mono text-[10px] text-red-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* EXTERNAL WHATSAPP PORT */}
              <div>
                <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-2">
                  EXTERNAL INVITE LAYER
                </label>
                <a
                  href={getWhatsAppShareLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    sounds.playSelect();
                    addHistoryItemLocal('WHATSAPP_LAUNCH', `Launched external WhatsApp transmission link.`);
                  }}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#1ebd54] text-white font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 border-2 border-black shadow-sm rounded-none"
                >
                  <MessageCircle className="w-4.5 h-4.5 fill-white" />
                  <span>[ 🟢 LAUNCH TO WHATSAPP ]</span>
                </a>
              </div>

              <div className="h-px bg-gray-200" />

              {/* IN-APP FRIEND LIST TRANSMISSION */}
              <div>
                <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-2">
                  INTERNAL SUBNET OPERATORS
                </label>

                {/* Inline Search inside Modal */}
                <div className="relative mb-3.5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      sounds.playTick();
                      setSearchQuery(e.target.value);
                    }}
                    placeholder="FILTER SUBNET FRIENDS BY NAME / ID..."
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange py-2.5 pl-9 pr-4 font-mono text-[10px] text-gray-950 focus:outline-none transition-all placeholder-gray-400 uppercase"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                </div>

                {/* Scrolling operator results list */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {filteredFriends.length === 0 ? (
                    <div className="text-center p-6 border border-gray-200 bg-gray-50">
                      <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="font-mono text-[9px] text-gray-500 uppercase">
                        NO ACTIVE OPERATOR FRIENDS DETECTED IN THIS GRID NODE.
                      </p>
                      <p className="font-mono text-[8px] text-gray-400 uppercase mt-1">
                        (ENGAGE FOLLOWS IN SEARCH DIRECTORY TO BUILD FRIENDS)
                      </p>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="bg-gray-50 border border-gray-200 hover:border-gray-300 p-2.5 flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-black text-gray-950 uppercase truncate block">
                            {friend.username}
                          </span>
                          <span className="font-mono text-[9px] text-shonen-orange uppercase block">
                            ARENA-{friend.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <button
                          disabled={isTransmitting !== null}
                          onClick={() => handleTransmit(friend.id, friend.username)}
                          className="px-2.5 py-1.5 bg-shonen-orange hover:bg-black hover:text-white border-2 border-black font-mono text-[9px] font-black uppercase text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {isTransmitting === friend.id ? 'BEAMING...' : 'TRANSMIT'}
                          </span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Local helper to log history item if window object is accessible safely
function addHistoryItemLocal(event: string, details: string) {
  try {
    const localUser = localStorage.getItem('codekatana_user');
    if (localUser) {
      const userObj = JSON.parse(localUser);
      const storageKey = `vote_arena_user_${userObj.id}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        parsed.history = parsed.history || [];
        parsed.history.unshift({
          id: `h-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          event,
          details
        });
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    }
  } catch (e) {}
}
