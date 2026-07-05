import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { 
  MessageSquare, Send, X, Terminal, Users, User, Radio, Sparkles, Zap, ChevronUp, ChevronDown, Check, RefreshCw 
} from 'lucide-react';
import { DbFollow } from '../types';

interface CombatCommsWidgetProps {
  currentUser: any;
  follows: DbFollow[];
  allProfiles: any[];
  onOpenProfile: (profile: any) => void;
  onFollow?: (followingId: string, followingUsername: string) => Promise<void>;
  onUnfollow?: (followingId: string) => Promise<void>;
  blockedUsers?: string[];
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  sender_username: string;
}

interface SharedPoll {
  id: string;
  sender_id: string;
  receiver_id: string;
  poll_id: string;
  poll_title: string;
  sender_username: string;
  created_at: string;
}

export default function CombatCommsWidget({
  currentUser,
  follows,
  allProfiles,
  onOpenProfile,
  onFollow,
  onUnfollow,
  blockedUsers = []
}: CombatCommsWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mutualFollows, setMutualFollows] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedPolls, setSharedPolls] = useState<SharedPoll[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search Engine state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Database search query logic: Look up profiles dynamically
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const val = searchTerm.trim();
        let cleanVal = val;
        if (val.toUpperCase().startsWith('ARENA-')) {
          cleanVal = val.substring(6);
        }

        // Write a query to look up 'profiles' table using Supabase.
        // Scan username AND arena_id columns. We also scan id column for resilience.
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${cleanVal}%,arena_id.ilike.%${cleanVal}%,id.ilike.%${cleanVal}%`);

        if (!error && data) {
          setSearchResults(data);
        } else {
          // Fallback search using local allProfiles state
          const valLower = val.toLowerCase();
          const localResults = allProfiles.filter(p => {
            const username = (p.username || '').toLowerCase();
            const arenaId = `ARENA-${(p.id || '').slice(0, 8).toUpperCase()}`;
            return username.includes(valLower) || arenaId.toLowerCase().includes(valLower);
          });
          setSearchResults(localResults);
        }
      } catch (e) {
        // Safe local fallback
        const valLower = searchTerm.toLowerCase();
        const localResults = allProfiles.filter(p => {
          const username = (p.username || '').toLowerCase();
          const arenaId = `ARENA-${(p.id || '').slice(0, 8).toUpperCase()}`;
          return username.includes(valLower) || arenaId.toLowerCase().includes(valLower);
        });
        setSearchResults(localResults);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, allProfiles]);

  // 1. Calculate Mutual Follows (Operators we follow AND who follow us back, and not blocked)
  useEffect(() => {
    if (!currentUser) {
      setMutualFollows([]);
      setActiveChannel(null);
      return;
    }

    const myFollowings = follows
      .filter(f => f.follower_id === currentUser.id)
      .map(f => f.following_id);

    const followMeBack = follows
      .filter(f => f.following_id === currentUser.id)
      .map(f => f.follower_id);

    const mutualIds = myFollowings.filter(id => followMeBack.includes(id));
    const mutualUsers = allProfiles.filter(p => mutualIds.includes(p.id) && !blockedUsers.includes(p.id));

    setMutualFollows(mutualUsers);

    // If active channel gets blocked, clear active channel
    if (activeChannel && blockedUsers.includes(activeChannel.id)) {
      setActiveChannel(null);
    }
  }, [currentUser, follows, allProfiles, blockedUsers, activeChannel]);

  // Decoupled window event listener to open specific combat chat
  useEffect(() => {
    const handleOpenComms = (e: any) => {
      setIsOpen(true);
      if (e.detail?.friendId) {
        const found = allProfiles.find(p => p.id === e.detail.friendId);
        if (found) {
          setActiveChannel(found);
        }
      }
    };
    window.addEventListener('open-combat-comms', handleOpenComms);
    return () => window.removeEventListener('open-combat-comms', handleOpenComms);
  }, [allProfiles]);

  // 2. Fetch Shared Polls targeted to the Current User
  const fetchSharedPolls = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('shared_polls')
        .select('*')
        .eq('receiver_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter out shared polls from blocked senders
        const filteredData = data.filter((sp: any) => !blockedUsers.includes(sp.sender_id));
        setSharedPolls(filteredData);
      } else {
        // Fallback local persistence check
        const localShared = JSON.parse(localStorage.getItem('vote_arena_shared_polls') || '[]');
        const filtered = localShared.filter((sp: any) => sp.receiver_id === currentUser.id && !blockedUsers.includes(sp.sender_id));
        setSharedPolls(filtered);
      }
    } catch (e) {
      // Fallback local storage
      const localShared = JSON.parse(localStorage.getItem('vote_arena_shared_polls') || '[]');
      const filtered = localShared.filter((sp: any) => sp.receiver_id === currentUser.id && !blockedUsers.includes(sp.sender_id));
      setSharedPolls(filtered);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSharedPolls();
      // Poll shared polls every 6 seconds
      const pInterval = setInterval(fetchSharedPolls, 6000);
      return () => clearInterval(pInterval);
    }
  }, [currentUser?.id]);

  // 3. Fetch conversation messages
  const fetchMessages = async (friendId: string) => {
    if (!currentUser) return;
    try {
      // Load local storage messages first as base/fallback
      const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
      const localFiltered = localMsgs.filter(
        (m: any) =>
          ((m.sender_id === currentUser.id && m.receiver_id === friendId) ||
          (m.sender_id === friendId && m.receiver_id === currentUser.id)) &&
          !blockedUsers.includes(m.sender_id)
      );

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const remoteFiltered = data.filter((m: any) => !blockedUsers.includes(m.sender_id));
        
        // Merge local storage and remote messages to prevent any instant-deletion or sync lag issues
        const merged = [...localFiltered, ...remoteFiltered];
        const unique = merged.filter((item, index, self) =>
          self.findIndex(t => t.id === item.id) === index
        );
        
        // Sort chronologically
        unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(unique);
      } else {
        setMessages(localFiltered);
      }
    } catch (e) {
      // Fallback
      const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
      const localFiltered = localMsgs.filter(
        (m: any) =>
          ((m.sender_id === currentUser.id && m.receiver_id === friendId) ||
          (m.sender_id === friendId && m.receiver_id === currentUser.id)) &&
          !blockedUsers.includes(m.sender_id)
      );
      setMessages(localFiltered);
    }
  };

  // 4. Trigger message fetching and active polling for selected channel
  useEffect(() => {
    if (activeChannel && currentUser) {
      setLoadingMsgs(true);
      fetchMessages(activeChannel.id).then(() => setLoadingMsgs(false));

      // Clear existing interval
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      // Poll messages every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(activeChannel.id);
      }, 3000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    } else {
      setMessages([]);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [activeChannel, currentUser?.id]);

  // 5. Scroll messages to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Calculate unread/notification trigger (e.g. total new shared polls + channels active count)
  useEffect(() => {
    if (!isOpen) {
      setUnreadCount(sharedPolls.length);
    } else {
      setUnreadCount(0);
    }
  }, [sharedPolls, isOpen]);

  // 6. Send message pipeline
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !currentUser || !activeChannel) return;

    sounds.playTick();
    const tempInput = msgInput.trim();
    setMsgInput('');

    const newMsg: Message = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sender_id: currentUser.id,
      receiver_id: activeChannel.id,
      text: tempInput,
      created_at: new Date().toISOString(),
      sender_username: currentUser.username
    };

    // Optimistic local state update
    setMessages(prev => [...prev, newMsg]);

    try {
      // 1. Write message to Supabase
      const { error } = await supabase.from('messages').insert([newMsg]);

      if (error && error.message?.includes('column')) {
        // Strip out extra sender_username key if it doesn't exist on the DB schema
        const { sender_username, ...dbPayload } = newMsg;
        await supabase.from('messages').insert([dbPayload]);
      }

      // 2. Also record in local storage as a robust fallback
      const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
      localMsgs.push(newMsg);
      localStorage.setItem('vote_arena_messages', JSON.stringify(localMsgs));
    } catch (e) {
      // Backup safe saving
      const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
      localMsgs.push(newMsg);
      localStorage.setItem('vote_arena_messages', JSON.stringify(localMsgs));
    }
  };

  // 7. Scroll & Flash shared poll target
  const handleScrollToPoll = (pollId: string) => {
    sounds.playSelect();
    const element = document.getElementById(`poll-card-${pollId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('flash-neon-glow');
      
      // Auto-remove flash styling
      setTimeout(() => {
        element.classList.remove('flash-neon-glow');
      }, 3000);

      // Close combat comms widget if on mobile to clear screen
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    } else {
      alert("POLL STREAM NODE HAS EXPIRED OR MOVED SUBNETS.");
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating launcher trigger */}
      <div className="fixed bottom-6 right-6 z-[90]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            sounds.playSelect();
            setIsOpen(!isOpen);
          }}
          className={`px-5 py-3.5 border-2 font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer rounded-none relative overflow-hidden transition-all duration-300 ${
            isOpen 
              ? 'bg-black border-black text-white' 
              : 'bg-white border-black text-black'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0% 100%)' }}
        >
          {/* Pulsing indicator */}
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isOpen ? 'bg-white animate-ping' : 'bg-shonen-orange animate-pulse'
          }`} />
          
          <span>{isOpen ? 'CLOSE COMMS' : '📡 COMBAT COMMS'}</span>
          
          {/* Badge indicator */}
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-1 w-2.5 h-2.5 bg-shonen-orange rounded-full" />
          )}
        </motion.button>
      </div>

      {/* Slide-out Terminal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 w-full max-w-sm h-[500px] bg-white border-4 border-black flex flex-col justify-between z-[90] shadow-lg clip-cyber-card overflow-hidden text-gray-950"
          >
            {/* Caution stripes */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px] z-10" />

            {/* Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center z-10 pt-5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-shonen-orange animate-pulse" />
                <div className="min-w-0">
                  <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block">
                    VOTE_ARENA // COMMS_TUNNEL
                  </span>
                  <span className="font-mono text-xs font-black text-gray-950 uppercase tracking-wider block">
                    {activeChannel ? `OP: ${activeChannel.username.toUpperCase()}` : 'SECURED CHANNELS'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playTick();
                  setIsOpen(false);
                }}
                className="p-1 border border-gray-200 hover:border-shonen-orange hover:text-shonen-orange transition-colors text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Terminal Viewport */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              {!activeChannel ? (
                /* 1. CHANNEL SELECTION SCREEN */
                <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-5">
                  
                  {/* SEARCH BAR COMPONENT */}
                  <div className="space-y-1.5 border-b border-gray-100 pb-3">
                    <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest block">
                      🔎 NEURAL NETWORK LOCATOR
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="🔍 INPUT OPERATOR NAME OR UNIQUE ARENA ID..."
                        className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-3 py-2 font-mono text-[10px] text-gray-950 focus:outline-none placeholder-gray-400 uppercase transition-all"
                      />
                      {searching && (
                        <span className="absolute right-3 top-2.5 font-mono text-[9px] text-shonen-orange animate-pulse">
                          SCANNING...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SEARCH RESULTS VIEW */}
                  {searchTerm.trim() !== '' && (
                    <div className="space-y-2 border-l-2 border-shonen-orange pl-2.5 py-1">
                      <span className="font-mono text-[8px] text-shonen-orange font-extrabold uppercase tracking-wider block">
                        LOCATED SECTOR SIGNALS ({searchResults.length})
                      </span>
                      
                      {searchResults.length === 0 ? (
                        <p className="font-mono text-[8px] text-gray-500 uppercase border border-gray-200 bg-gray-50 p-3 text-center">
                          NO RECON SIGNALS MATCHING TERM.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {searchResults.map((prof) => {
                            const isSelf = currentUser && prof.id === currentUser.id;
                            const isFollowed = follows.some(
                              f => f.follower_id === currentUser?.id && f.following_id === prof.id
                            );
                            
                            return (
                              <div
                                key={prof.id}
                                className="p-2 bg-gray-50 border border-gray-100 hover:border-shonen-orange transition-all flex justify-between items-center gap-2 rounded-none"
                              >
                                <div 
                                  className="min-w-0 cursor-pointer group"
                                  onClick={() => {
                                    sounds.playSelect();
                                    onOpenProfile(prof);
                                  }}
                                  title="VIEW OPERATOR DOSSIER"
                                >
                                  <span className="font-mono text-xs font-black text-gray-900 group-hover:text-shonen-orange uppercase block leading-none mb-1 underline decoration-dotted decoration-shonen-orange/50">
                                    {prof.username} {isSelf && '(YOU)'}
                                  </span>
                                  <span className="font-mono text-[8px] text-gray-400 group-hover:text-shonen-orange/80 uppercase block leading-none">
                                    ARENA-{prof.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                                
                                {!isSelf && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      sounds.playSelect();
                                      if (isFollowed) {
                                        if (onUnfollow) await onUnfollow(prof.id);
                                      } else {
                                        if (onFollow) await onFollow(prof.id, prof.username);
                                      }
                                    }}
                                    className={`font-mono text-[8px] px-2 py-1 font-black uppercase transition-all shrink-0 border-2 ${
                                      isFollowed
                                        ? 'bg-gray-100 border-gray-200 text-gray-500 hover:text-black hover:border-black'
                                        : 'bg-shonen-orange border-black text-white hover:bg-black hover:border-black'
                                    }`}
                                  >
                                    {isFollowed ? '[ ⚡ DISCONNECT ]' : '[ ⚡ ENGAGE FOLLOW ]'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="h-px bg-gray-100 my-1" />
                    </div>
                  )}

                  {/* INCOMING SHARED POLLS (TRANSMISSIONS) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-shonen-orange animate-pulse shrink-0" />
                      <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest">
                        📡 INCOMING BEAM TRANSMISSIONS ({sharedPolls.length})
                      </span>
                    </div>

                    {sharedPolls.length === 0 ? (
                      <p className="font-mono text-[8px] text-gray-400 uppercase border border-gray-200 bg-gray-50 p-3 text-center">
                        NO INCOMING STREAM OVERRIDES REPORTED BY OPERATORS.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {sharedPolls.map((sp) => (
                          <div
                            key={sp.id}
                            onClick={() => handleScrollToPoll(sp.poll_id)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-shonen-orange transition-all cursor-pointer flex justify-between items-center gap-2 rounded-none"
                          >
                            <div className="min-w-0">
                              <span className="font-mono text-[8px] text-gray-400 uppercase block leading-none">
                                FROM OP {sp.sender_username.toUpperCase()}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-gray-900 uppercase tracking-tight block truncate">
                                {sp.poll_title}
                              </span>
                            </div>
                            <span className="font-mono text-[8px] bg-shonen-orange text-white px-1.5 py-0.5 font-black uppercase border border-black shrink-0">
                              VIEW
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* ACTIVE OPERATOR CHAT CHANNELS */}
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-shonen-orange shrink-0" />
                      <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest">
                        ESTABLISHED TUNNEL CONNS ({mutualFollows.length})
                      </span>
                    </div>

                    {mutualFollows.length === 0 ? (
                      <div className="flex-1 flex flex-col justify-center items-center text-center p-4 border border-gray-200 bg-gray-50">
                        <Users className="w-5 h-5 text-gray-400 mb-1" />
                        <p className="font-mono text-[9px] text-gray-500 uppercase">
                          NO ACTIVE MUTUAL CONNS FOUND.
                        </p>
                        <p className="font-mono text-[8px] text-gray-400 uppercase mt-1 leading-relaxed">
                          ENGAGE SHARED INTERESTS: OPERATORS MUST MUTUALLY FOLLOW EACH OTHER TO ACTIVATE PRIVATE SECURE CHANNELS.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                        {mutualFollows.map((friend) => (
                          <div
                            key={friend.id}
                            onClick={() => {
                              sounds.playSelect();
                              setActiveChannel(friend);
                            }}
                            className="p-2.5 bg-gray-50 border border-gray-200 hover:border-shonen-orange transition-all cursor-pointer flex justify-between items-center rounded-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 border border-black shrink-0 flex items-center justify-center overflow-hidden">
                                {(() => {
                                  const friendProfile = allProfiles?.find(p => p.id === friend.id);
                                  const friendAvatarUrl = friendProfile?.avatar_url;
                                  if (friendAvatarUrl) {
                                    return <img src={friendAvatarUrl} alt={friend.username} className="w-full h-full object-cover" />;
                                  }
                                  return (
                                    <div className="w-full h-full bg-shonen-orange text-white text-[10px] font-mono font-black flex items-center justify-center">
                                      {friend.username.slice(0, 3).toUpperCase()}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-black text-gray-900 uppercase block leading-none mb-1">
                                  {friend.username}
                                </span>
                                <span className="font-mono text-[8px] text-shonen-orange uppercase block leading-none">
                                  ARENA-{friend.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-[8px] text-shonen-orange border border-shonen-orange/30 px-1 py-0.5 bg-white uppercase tracking-wider font-bold shrink-0">
                              CONNECT
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                /* 2. CHAT CONVERSATION FEED SCREEN */
                <div className="flex-1 flex flex-col overflow-hidden justify-between">
                  {/* Channel context header bar */}
                  <div className="p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <button
                      onClick={() => {
                        sounds.playTick();
                        setActiveChannel(null);
                      }}
                      className="font-mono text-[8px] text-shonen-orange border border-shonen-orange/30 px-1.5 py-0.5 bg-white hover:bg-shonen-orange hover:text-white uppercase tracking-widest font-black transition-all cursor-pointer"
                    >
                      [ BACK_TO_TUNNELS ]
                    </button>
                    <button
                      onClick={() => {
                        sounds.playSelect();
                        onOpenProfile(activeChannel);
                      }}
                      className="font-mono text-[8px] text-black border border-black px-1.5 py-0.5 hover:bg-black hover:text-white uppercase tracking-widest font-black transition-all cursor-pointer"
                    >
                      VIEW DOSSIER
                    </button>
                  </div>

                  {/* Messages logs */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
                    {loadingMsgs ? (
                      <div className="h-full flex justify-center items-center font-mono text-[10px] text-gray-400 uppercase animate-pulse">
                        DECRYPTING CHASSIS TRANSMISSIONS...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col justify-center items-center text-center p-4">
                        <Terminal className="w-5 h-5 text-gray-300 animate-spin mb-1.5" style={{ animationDuration: '6s' }} />
                        <p className="font-mono text-[9px] text-gray-500 uppercase">
                          SECURE END-TO-END FEED ESTABLISHED.
                        </p>
                        <p className="font-mono text-[8px] text-gray-400 uppercase mt-1">
                          BEGIN SECURE DIRECT TRANSMISSIONS BELOW.
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isSelf = m.sender_id === currentUser.id;
                        const senderProfile = allProfiles?.find(p => p.id === m.sender_id);
                        const senderAvatarUrl = senderProfile?.avatar_url;

                        return (
                          <div
                            key={m.id}
                            className={`flex gap-2.5 max-w-[90%] items-start ${isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
                          >
                            {/* Small message avatar bubble */}
                            <div className="w-6 h-6 rounded-full border border-gray-300 bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden mt-1 shadow-xs">
                              {senderAvatarUrl ? (
                                <img src={senderAvatarUrl} alt={m.sender_username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-mono font-black text-gray-600">
                                  {m.sender_username.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                              <span className="font-mono text-[7px] text-gray-400 uppercase mb-0.5">
                                {isSelf ? 'YOU' : m.sender_username.toUpperCase()} // {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className={`p-2.5 font-mono text-xs uppercase leading-relaxed rounded-none border ${
                                isSelf 
                                  ? 'bg-shonen-orange/10 border-shonen-orange/30 text-gray-950' 
                                  : 'bg-gray-50 border-gray-200 text-gray-950'
                              }`}>
                                {m.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input port */}
                  <form onSubmit={handleSendMessage} className="p-2.5 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <input
                      type="text"
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      placeholder="ENTER TRANSMISSION PACKETS..."
                      className="flex-1 bg-white border-2 border-gray-200 focus:border-shonen-orange px-2.5 py-2 font-mono text-xs focus:outline-none placeholder-gray-400 text-gray-950 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={!msgInput.trim()}
                      className="px-3.5 bg-shonen-orange hover:bg-black text-white border-2 border-black font-mono font-black uppercase text-xs transition-colors flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
