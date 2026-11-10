import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { loadCommsMessages, saveCommsMessage } from '../lib/dataStorage';
import { 
  MessageSquare, Send, X, Terminal, Users, User, Radio, Sparkles, Zap, Check, Trash2, Smile, Image, Film, MessageCircle
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

// Predefined Anime GIFs & Expression Stickers with verified animated Giphy endpoints
const CHIBI_STICKERS = [
  { name: 'HAPPY GOKU', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3pjdWc3ZHBnYjF6cmJ0NnR1MG1reWRnYW12cGJldTh5czA1bnJ4NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/9f2hmeIUtWYHC/giphy.gif' },
  { name: 'LUFFY MUNCH', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmpzMm4zNXZ2eTh2cWw3Z3g2czVmdmdidDF2MDU0bzEyb3hscWRzOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/13fTar4VLY1v4A/giphy.gif' },
  { name: 'PIKACHU WAVE', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXphNGptNDkzdG85eTJ1cmFvMnUwaXcyczBrODdkdnN2ZXNndGZ2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/xuXzc9vguZ7zO/giphy.gif' },
  { name: 'SAILOR MOON CHIBI', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG0zYm0yZ2N5NHN6MnB6ZHJ5bWcxbXp6cmVjNGx6ZnNsc3hjeWdveCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/9JnRMIFMYAKpa/giphy.gif' },
  { name: 'PIXEL HEART', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWNreWc4bWV4amRxM3lhZTFjOTlhajB0MDJ6bTh0a3g3am1zbnJmdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3oz8xALRf1vM50XNTo/giphy.gif' },
  { name: 'GAME OVER', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXZ0Z3F6MTB3ZW92czB3dHoxMnd3NXZmdmR6ZnA1bHRqM3hldXo5byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/bFv9EBXBdJ6b6/giphy.gif' },
  { name: 'ANIME THUMBS UP', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/XF9r9Lg8S5P06qgCMy/giphy.gif' },
  { name: 'CHIBI CRY', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PXN3/AAsj7j6nHIPZG/giphy.gif' },
];

const ACTION_GIFS = [
  { name: 'GOKU POWER UP', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTNuOHo2bmJ5NWdzZjNoZXJrbnpsczVrdmU4NWRlYTB5dWRlNDJidSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Z2lmX3NlYXJjaCZjdD1n/t6s3CHvOfp_Xq/giphy.gif' },
  { name: 'ZORO SLASH', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtpbnB6Mmx4cjIyeHV4Nzlza3M5MGJnYnM5YzdodHNoMHB0cmZlMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Z2lmX3NlYXJjaCZjdD1n/4OV1bLOIWwIXK/giphy.gif' },
  { name: 'NARUTO RUN', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTV4YmxhbzN4M245dGVzMHp5OHU0cm9pOG1kdm1yMWc1d3p0NDN6MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Z2lmX3NlYXJjaCZjdD1n/JRlqKEee9vIp5ZWoN1/giphy.gif' },
  { name: 'SAITAMA OK', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/32O8O6RQL1qy3sTJln/giphy.gif' },
  { name: 'DEMON SLAYER SPARKS', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/fWAlpo66f9vWM/giphy.gif' },
  { name: 'NEON WAVE', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXB0M3ByOWpxNWc0YWpxcmgyNHZ3cDFpYTBpNXE3YW9rZmRlYmNxOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Z2lmX3NlYXJjaCZjdD1n/b78Grcv8976GA/giphy.gif' },
  { name: 'ANIME DANCE', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNndrMWR2cHpxN3B3cjBzdTh4NWNjcGlwdGFobWdzcjF4ZXdtcjEzbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Z2lmX3NlYXJjaCZjdD1n/d1E2vyhPsgaGc/giphy.gif' },
  { name: 'REACTION WOW', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTNuOHo2bmJ5NWdzZjNoZXJrbnpsczVrdmU4NWRlYTB5dWRlNDJidSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Z2lmX3NlYXJjaCZjdD1n/12RfP2Od6VaALy/giphy.gif' },
];

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

  // Group chat states
  const [groupChats, setGroupChats] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vote_arena_group_chats') || '[]');
    } catch {
      return [];
    }
  });
  const [showCreateGc, setShowCreateGc] = useState(false);
  const [gcName, setGcName] = useState('');
  const [selectedGcMembers, setSelectedGcMembers] = useState<string[]>([]);
  const [allInboxMessages, setAllInboxMessages] = useState<Message[]>([]);

  // Search Engine state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Sticker & GIF selector states
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [mediaTab, setMediaTab] = useState<'GIF' | 'STICKER'>('GIF');

  // Deletion and Unread notification state managers
  const [lastReadTimes, setLastReadTimes] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('vote_arena_last_read_times') || '{}');
    } catch {
      return {};
    }
  });

  const [clearedChatTimestamps, setClearedChatTimestamps] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('vote_arena_cleared_chat_timestamps') || '{}');
    } catch {
      return {};
    }
  });

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

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

  // 3. Unified Inbox polling engine
  const fetchInbox = async () => {
    if (!currentUser) return;
    try {
      const localMsgs = loadCommsMessages();

      let dbMsgs: any[] = [];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id || '');
      if (isUuid) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: true });

          if (!error && data) {
            dbMsgs = data;
          }
        } catch (e) {
          console.warn("Supabase messages query error (handled):", e);
        }
      }

      let combined = [...localMsgs, ...dbMsgs];

      // Deduplicate by ID
      const unique = combined.filter((item, index, self) =>
        self.findIndex(t => t.id === item.id) === index
      );

      // Filter blocked users
      const filtered = unique.filter(m => !blockedUsers.includes(m.sender_id));

      // Sort chronologically
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setAllInboxMessages(filtered);
      localStorage.setItem('vote_arena_messages', JSON.stringify(filtered));

      // Scan for newly added Group Chats automatically
      const currentGcs = [...groupChats];
      let gcsUpdated = false;

      filtered.forEach((m: any) => {
        if (m.text.startsWith('[SYSTEM_GC_CREATED]')) {
          try {
            const bodyStr = m.text.substring(19).trim();
            const gcInfo = JSON.parse(bodyStr);
            if (gcInfo.id && gcInfo.members && gcInfo.members.includes(currentUser.id)) {
              const exists = currentGcs.some(g => g.id === gcInfo.id);
              if (!exists) {
                currentGcs.push(gcInfo);
                gcsUpdated = true;
              }
            }
          } catch (e) {}
        }
      });

      if (gcsUpdated) {
        setGroupChats(currentGcs);
        localStorage.setItem('vote_arena_group_chats', JSON.stringify(currentGcs));
      }

    } catch (e) {
      console.warn("Failed to fetch inbox messages", e);
    }
  };

  // 4. Trigger active inbox polling
  useEffect(() => {
    if (!currentUser) return;
    
    setLoadingMsgs(true);
    fetchInbox().then(() => setLoadingMsgs(false));

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    // Poll complete inbox every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchInbox();
    }, 3000);

    const handleMsgEvent = () => {
      fetchInbox();
    };
    window.addEventListener('vote-arena-messages-updated', handleMsgEvent);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      window.removeEventListener('vote-arena-messages-updated', handleMsgEvent);
    };
  }, [currentUser?.id]);

  // Derive message list for current active channel
  useEffect(() => {
    if (!currentUser || !activeChannel) {
      setMessages([]);
      return;
    }

    const channelId = activeChannel.id;
    const clearedTime = clearedChatTimestamps[channelId] || '1970-01-01T00:00:00.000Z';

    const isGc = channelId.startsWith('gc-');

    if (isGc) {
      // Group Chat message list
      const gcMsgs = allInboxMessages.filter(m => {
        if (m.text.startsWith('[GC_MSG]') && m.created_at > clearedTime) {
          try {
            const bodyStr = m.text.substring(8).trim();
            const payload = JSON.parse(bodyStr);
            return payload.gcId === channelId;
          } catch (e) {
            return false;
          }
        }
        return false;
      }).map(m => {
        try {
          const bodyStr = m.text.substring(8).trim();
          const payload = JSON.parse(bodyStr);
          return {
            ...m,
            text: payload.text,
            sender_username: payload.senderUsername || m.sender_username || 'OPERATOR'
          };
        } catch {
          return m;
        }
      });
      setMessages(gcMsgs);
    } else {
      // Direct message list
      const directMsgs = allInboxMessages.filter(m => {
        const isDirect = ((m.sender_id === currentUser.id && m.receiver_id === channelId) ||
                         (m.sender_id === channelId && m.receiver_id === currentUser.id)) &&
                         !m.text.startsWith('[GC_MSG]') &&
                         !m.text.startsWith('[SYSTEM_GC_CREATED]');
        return isDirect && m.created_at > clearedTime;
      });
      setMessages(directMsgs);
    }

    // Mark as read instantly
    const nowStr = new Date().toISOString();
    const updatedLastRead = { ...lastReadTimes, [channelId]: nowStr };
    setLastReadTimes(updatedLastRead);
    localStorage.setItem('vote_arena_last_read_times', JSON.stringify(updatedLastRead));
    window.dispatchEvent(new CustomEvent('recalc-unread-messages'));

  }, [allInboxMessages, activeChannel, currentUser?.id]);

  // 5. Scroll messages to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 6. Dynamic unread engine calculations (periodic & reactive)
  const calculateUnreadCounts = () => {
    if (!currentUser) return;
    try {
      const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
      const counts: Record<string, number> = {};

      // Direct chats unread counts
      mutualFollows.forEach(friend => {
        const lastRead = lastReadTimes[friend.id] || '1970-01-01T00:00:00.000Z';
        const clearedTime = clearedChatTimestamps[friend.id] || '1970-01-01T00:00:00.000Z';

        const unreadList = localMsgs.filter((m: any) => 
          m.sender_id === friend.id &&
          m.receiver_id === currentUser.id &&
          !m.text.startsWith('[GC_MSG]') &&
          m.created_at > lastRead &&
          m.created_at > clearedTime
        );

        counts[friend.id] = unreadList.length;
      });

      // Group Chats unread counts
      groupChats.forEach(gc => {
        const lastRead = lastReadTimes[gc.id] || '1970-01-01T00:00:00.000Z';
        const clearedTime = clearedChatTimestamps[gc.id] || '1970-01-01T00:00:00.000Z';

        const unreadList = localMsgs.filter((m: any) => {
          if (m.sender_id === currentUser.id) return false;
          if (m.text.startsWith('[GC_MSG]')) {
            try {
              const bodyStr = m.text.substring(8).trim();
              const payload = JSON.parse(bodyStr);
              return payload.gcId === gc.id && m.created_at > lastRead && m.created_at > clearedTime;
            } catch (e) {
              return false;
            }
          }
          return false;
        });

        counts[gc.id] = unreadList.length;
      });

      setUnreadCounts(counts);

      const totalUnreadMessages = Object.values(counts).reduce((acc, c) => acc + c, 0);
      setUnreadCount(totalUnreadMessages + sharedPolls.length);
      localStorage.setItem('vote_arena_total_unread_chat_count', String(totalUnreadMessages));
      window.dispatchEvent(new CustomEvent('recalc-unread-messages', { detail: { count: totalUnreadMessages } }));
    } catch (e) {
      console.warn("Failed to update unread counts", e);
    }
  };

  // Recalculate unread counts on changes
  useEffect(() => {
    calculateUnreadCounts();
    const unreadCheckInterval = setInterval(calculateUnreadCounts, 4000);
    return () => clearInterval(unreadCheckInterval);
  }, [allInboxMessages, lastReadTimes, clearedChatTimestamps, mutualFollows, groupChats, sharedPolls]);

  // 7. Group Chat Submission Handler
  const handleCreateGcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcName.trim() || selectedGcMembers.length === 0 || !currentUser) return;
    sounds.playSelect();

    const gcId = `gc-${Date.now()}`;
    const newGc = {
      id: gcId,
      name: gcName.toUpperCase().trim(),
      members: [currentUser.id, ...selectedGcMembers],
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    const updatedGcs = [...groupChats, newGc];
    setGroupChats(updatedGcs);
    localStorage.setItem('vote_arena_group_chats', JSON.stringify(updatedGcs));

    try {
      const promises = selectedGcMembers.map(async (memberId) => {
        const systemMsg = {
          id: `m-sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          sender_id: currentUser.id,
          receiver_id: memberId,
          text: `[SYSTEM_GC_CREATED] ${JSON.stringify(newGc)}`,
          created_at: new Date().toISOString()
        };
        return supabase.from('messages').insert([systemMsg]);
      });

      await Promise.all(promises);

      // Add GC creation system message locally too
      const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
      localMsgs.push({
        id: `m-sys-${Date.now()}-self`,
        sender_id: currentUser.id,
        receiver_id: currentUser.id,
        text: `[SYSTEM_GC_CREATED] ${JSON.stringify(newGc)}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('vote_arena_messages', JSON.stringify(localMsgs));

      setGcName('');
      setSelectedGcMembers([]);
      setShowCreateGc(false);
      setActiveChannel(newGc);
      fetchInbox();

      alert(`🔥 GC INITIALIZED: [${newGc.name}] ESTABLISHED WITH ${selectedGcMembers.length + 1} OPERATORS.`);
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Send Message Pipeline
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !currentUser || !activeChannel) return;

    sounds.playTick();
    const tempInput = msgInput.trim();
    setMsgInput('');

    const isGc = activeChannel.id.startsWith('gc-');

    if (isGc) {
      const gcId = activeChannel.id;
      const gcMembers = activeChannel.members || [];
      const gcPayload = JSON.stringify({
        gcId,
        text: tempInput,
        senderUsername: currentUser.username
      });

      const tempMsg: Message = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender_id: currentUser.id,
        receiver_id: gcId,
        text: `[GC_MSG] ${gcPayload}`,
        created_at: new Date().toISOString(),
        sender_username: currentUser.username
      };

      setMessages(prev => [...prev, {
        ...tempMsg,
        text: tempInput,
        sender_username: currentUser.username
      }]);

      try {
        const promises = gcMembers
          .filter((mId: string) => mId !== currentUser.id)
          .map(async (mId: string) => {
            const dbMsg = {
              sender_id: currentUser.id,
              receiver_id: mId,
              text: `[GC_MSG] ${gcPayload}`,
              created_at: new Date().toISOString()
            };
            return supabase.from('messages').insert([dbMsg]);
          });

        await Promise.all(promises);
      } catch (e) {
        // Fallback gracefully
      }
      saveCommsMessage(tempMsg);
      fetchInbox();
    } else {
      const friendId = activeChannel.id;
      const newMsg: Message = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender_id: currentUser.id,
        receiver_id: friendId,
        text: tempInput,
        created_at: new Date().toISOString(),
        sender_username: currentUser.username
      };

      setMessages(prev => [...prev, newMsg]);

      try {
        const { error } = await supabase.from('messages').insert([newMsg]);
        if (error && error.message?.includes('column')) {
          const { sender_username, ...dbPayload } = newMsg;
          await supabase.from('messages').insert([dbPayload]);
        }
      } catch (e) {
        // Fallback gracefully
      }
      saveCommsMessage(newMsg);
      fetchInbox();
    }
  };

  // 9. Send Gifs & Stickers pipeline
  const handleSendMedia = async (url: string, type: 'GIF' | 'STICKER') => {
    if (!currentUser || !activeChannel) return;
    sounds.playSelect();

    const mediaPayload = `[${type}] ${url}`;
    const isGc = activeChannel.id.startsWith('gc-');

    if (isGc) {
      const gcId = activeChannel.id;
      const gcMembers = activeChannel.members || [];
      const gcPayload = JSON.stringify({
        gcId,
        text: mediaPayload,
        senderUsername: currentUser.username
      });

      const tempMsg: Message = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender_id: currentUser.id,
        receiver_id: gcId,
        text: `[GC_MSG] ${gcPayload}`,
        created_at: new Date().toISOString(),
        sender_username: currentUser.username
      };

      setMessages(prev => [...prev, {
        ...tempMsg,
        text: mediaPayload,
        sender_username: currentUser.username
      }]);
      setShowMediaDrawer(false);

      try {
        const promises = gcMembers
          .filter((mId: string) => mId !== currentUser.id)
          .map(async (mId: string) => {
            const dbMsg = {
              sender_id: currentUser.id,
              receiver_id: mId,
              text: `[GC_MSG] ${gcPayload}`,
              created_at: new Date().toISOString()
            };
            return supabase.from('messages').insert([dbMsg]);
          });

        await Promise.all(promises);
      } catch (e) {
        // Fallback gracefully
      }
      saveCommsMessage(tempMsg);
      fetchInbox();
    } else {
      const friendId = activeChannel.id;
      const newMsg: Message = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender_id: currentUser.id,
        receiver_id: friendId,
        text: mediaPayload,
        created_at: new Date().toISOString(),
        sender_username: currentUser.username
      };

      setMessages(prev => [...prev, newMsg]);
      setShowMediaDrawer(false);

      try {
        const { error } = await supabase.from('messages').insert([newMsg]);
        if (error && error.message?.includes('column')) {
          const { sender_username, ...dbPayload } = newMsg;
          await supabase.from('messages').insert([dbPayload]);
        }
      } catch (e) {
        // Fallback gracefully
      }
      saveCommsMessage(newMsg);
      fetchInbox();
    }
  };

  // 9. Wipe/Erase Chat logs with contact or Leave Squad
  const handleDeleteChat = async (id: string, nameOrUsername: string) => {
    if (!currentUser) return;
    sounds.playTick();

    const isGc = id.startsWith('gc-');

    if (isGc) {
      const confirmed = window.confirm(
        `⚠️ SQUAD SEPARATION REQUISITION:\n\nARE YOU SURE YOU WANT TO DE-COMMISSION OR LEAVE SQUAD [${nameOrUsername.toUpperCase()}]?\n\nYOU WILL NO LONGER RECEIVE UPDATES FROM THIS CHANNEL.`
      );
      if (!confirmed) return;

      sounds.playImpact();
      
      // Filter out this group chat locally
      const updatedGcs = groupChats.filter(g => g.id !== id);
      setGroupChats(updatedGcs);
      localStorage.setItem('vote_arena_group_chats', JSON.stringify(updatedGcs));

      // Mark cleared
      const nowStr = new Date().toISOString();
      const updatedCleared = { ...clearedChatTimestamps, [id]: nowStr };
      setClearedChatTimestamps(updatedCleared);
      localStorage.setItem('vote_arena_cleared_chat_timestamps', JSON.stringify(updatedCleared));

      setActiveChannel(null);
      setMessages([]);
      alert(`💥 SQUAD VACATED: You have departed [${nameOrUsername.toUpperCase()}] successfully.`);
    } else {
      const confirmed = window.confirm(
        `⚠️ COMBAT LOGS ERASE REQUISITION:\n\nARE YOU SURE YOU WANT TO COMPLETELY DESTROY ALL CORRESPONDENCE AND SIGNALS TRANSFERRED WITH OP [${nameOrUsername.toUpperCase()}]?\n\nTHIS ACTION CANNOT BE UNDONE.`
      );
      if (!confirmed) return;

      sounds.playImpact();
      const nowStr = new Date().toISOString();

      // Store clear action timestamp locally
      const updatedCleared = { ...clearedChatTimestamps, [id]: nowStr };
      setClearedChatTimestamps(updatedCleared);
      localStorage.setItem('vote_arena_cleared_chat_timestamps', JSON.stringify(updatedCleared));

      // Remove active conversation messages from local backup file
      try {
        const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
        const filtered = localMsgs.filter((m: any) => 
          !((m.sender_id === currentUser.id && m.receiver_id === id) || 
            (m.sender_id === id && m.receiver_id === currentUser.id))
        );
        localStorage.setItem('vote_arena_messages', JSON.stringify(filtered));
      } catch (e) {
        console.warn(e);
      }

      setMessages([]);
      alert(`💥 DATA FLUSHED: Secure channel log history with OP [${nameOrUsername.toUpperCase()}] has been eradicated.`);
    }
  };

  // 10. Scroll & Flash shared poll target
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
      {/* Floating launcher trigger with bright message notification badge */}
      <div className="fixed bottom-6 right-6 z-[90]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            sounds.playSelect();
            setIsOpen(!isOpen);
          }}
          className={`px-5 py-3.5 rounded-full font-bold text-xs tracking-wide flex items-center gap-2.5 shadow-[0_8px_25px_rgba(255,101,132,0.35)] cursor-pointer relative overflow-visible transition-all duration-300 border-2 ${
            isOpen 
              ? 'bg-gray-900 border-gray-900 text-white' 
              : 'bg-gradient-to-r from-pink-500 to-rose-400 border-white text-white'
          }`}
        >
          {/* Pulsing state indicator */}
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isOpen ? 'bg-pink-300 animate-ping' : 'bg-white animate-pulse'
          }`} />
          
          <span className="flex items-center gap-1.5">
            {isOpen ? '✕ Close Chat' : '💌 Messages & Chat'}
          </span>
          
          {/* Main Comms Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-md">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Slide-out Chat Panel - ADORABLE KAWAII MESSENGER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-24 right-6 w-[calc(100%-2rem)] max-w-sm md:max-w-4xl md:w-[850px] h-[540px] md:h-[620px] bg-white/98 backdrop-blur-md border-2 border-pink-200 rounded-3xl flex flex-col justify-between z-[90] shadow-[0_20px_60px_rgba(255,182,193,0.35)] overflow-hidden text-gray-800"
          >
            {/* Cute top gradient stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-rose-300 to-purple-400 z-10" />

            {/* Header - Shared across channels */}
            <div className="p-4 bg-gradient-to-r from-pink-50/80 via-purple-50/40 to-pink-50/70 border-b border-pink-100 flex justify-between items-center z-10 pt-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shadow-xs">
                  💌
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-pink-500 font-bold uppercase tracking-wider block">
                    Velgre Messenger 🌸
                  </span>
                  <span className="text-xs font-black text-gray-900 tracking-tight block">
                    {activeChannel 
                      ? activeChannel.id.startsWith('gc-')
                        ? `Squad Chat: ${activeChannel.name}`
                        : `Chatting with @${activeChannel.username}`
                      : 'Direct Messages & Squads'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Clear chat logs context button */}
                {activeChannel && (
                  <button
                    onClick={() => handleDeleteChat(activeChannel.id, activeChannel.id.startsWith('gc-') ? activeChannel.name : activeChannel.username)}
                    className="flex items-center gap-1 text-[9px] text-rose-500 border border-rose-200 hover:border-rose-400 px-2.5 py-1 bg-white hover:bg-rose-50 rounded-full font-bold transition-all cursor-pointer shadow-xs"
                    title={activeChannel.id.startsWith('gc-') ? "Leave Squad" : "Clear Chat"}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">{activeChannel.id.startsWith('gc-') ? "Leave" : "Clear"}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sounds.playTick();
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-pink-200 hover:border-pink-300 hover:bg-pink-50 text-gray-500 hover:text-pink-600 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Terminal Viewport - DUAL COLUMN SPLIT */}
            <div className="flex-1 overflow-hidden flex flex-row bg-white relative">
              
              {/* LEFT COLUMN: THE INBOX SIDEBAR (Always on for desktop, toggles on mobile) */}
              <div 
                className={`w-full md:w-[310px] border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/70 h-full ${
                  activeChannel ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
                  
                  {/* SEARCH BAR COMPONENT */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest block">
                      🔎 NEURAL NETWORK LOCATOR
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="SEARCH OPERATOR OR ID..."
                        className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-2.5 py-1.5 font-mono text-[9px] text-gray-950 focus:outline-none placeholder-gray-400 uppercase transition-all"
                      />
                      {searching && (
                        <span className="absolute right-2 top-2 font-mono text-[8px] text-shonen-orange animate-pulse">
                          SCANNING...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SEARCH RESULTS VIEW */}
                  {searchTerm.trim() !== '' && (
                    <div className="space-y-1.5 border-l-2 border-shonen-orange pl-2 py-0.5">
                      <span className="font-mono text-[8px] text-shonen-orange font-extrabold uppercase tracking-wider block">
                        LOCATED SECTOR SIGNALS ({searchResults.length})
                      </span>
                      
                      {searchResults.length === 0 ? (
                        <p className="font-mono text-[8px] text-gray-500 uppercase border border-gray-200 bg-gray-50 p-2 text-center">
                          NO RECON SIGNALS FOUND.
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {searchResults.map((prof) => {
                            const isSelf = currentUser && prof.id === currentUser.id;
                            const isFollowed = follows.some(
                              f => f.follower_id === currentUser?.id && f.following_id === prof.id
                            );
                            
                            return (
                              <div
                                key={prof.id}
                                className="p-1.5 bg-white border border-gray-100 hover:border-shonen-orange transition-all flex justify-between items-center gap-2 rounded-none"
                              >
                                <div 
                                  className="min-w-0 cursor-pointer group flex-1"
                                  onClick={() => {
                                    sounds.playSelect();
                                    onOpenProfile(prof);
                                  }}
                                >
                                  <span className="font-mono text-[10px] font-black text-gray-950 group-hover:text-shonen-orange uppercase block truncate">
                                    {prof.username} {isSelf && '(YOU)'}
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
                                    className="font-mono text-[7px] px-1.5 py-0.5 font-black uppercase transition-all shrink-0 border border-black bg-shonen-orange text-white"
                                  >
                                    {isFollowed ? 'UNFOLLOW' : 'FOLLOW'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* INCOMING BEAMS (SHARED POLLS) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-shonen-orange animate-pulse shrink-0" />
                      <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest">
                        📡 INCOMING BEAMS ({sharedPolls.length})
                      </span>
                    </div>

                    {sharedPolls.length === 0 ? (
                      <p className="font-mono text-[8px] text-gray-400 uppercase border border-gray-100 bg-white/50 p-2 text-center rounded-sm">
                        NO BEAM TRANSMISSIONS INBOUND.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {sharedPolls.map((sp) => (
                          <div
                            key={sp.id}
                            onClick={() => handleScrollToPoll(sp.poll_id)}
                            className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 hover:border-shonen-orange transition-all cursor-pointer flex justify-between items-center gap-2 rounded-none"
                          >
                            <div className="min-w-0">
                              <span className="font-mono text-[7px] text-gray-400 uppercase block leading-none">
                                OP {sp.sender_username.toUpperCase()}
                              </span>
                              <span className="font-mono text-[9px] font-bold text-gray-900 uppercase block truncate">
                                {sp.poll_title}
                              </span>
                            </div>
                            <span className="font-mono text-[7px] bg-shonen-orange text-white px-1 py-0.5 font-black uppercase shrink-0">
                              VIEW
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* GROUP CHAT CREATOR / LIST */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-shonen-orange shrink-0" />
                        <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest">
                          TACTICAL SQUADS ({groupChats.length})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playSelect();
                          setShowCreateGc(!showCreateGc);
                        }}
                        className="font-mono text-[8px] bg-black text-white hover:bg-shonen-orange font-black px-1.5 py-0.5 uppercase border border-black"
                      >
                        {showCreateGc ? 'CANCEL' : 'CREATE SQUAD'}
                      </button>
                    </div>

                    {showCreateGc && (
                      <form onSubmit={handleCreateGcSubmit} className="p-2 border-2 border-dashed border-shonen-orange bg-shonen-orange/5 space-y-2">
                        <div className="space-y-1">
                          <label className="block font-mono text-[8px] font-black text-gray-700 uppercase">SQUAD CALLSIGN:</label>
                          <input
                            type="text"
                            maxLength={20}
                            placeholder="E.G. TEAM 7"
                            value={gcName}
                            onChange={(e) => setGcName(e.target.value)}
                            className="w-full font-mono text-xs p-1.5 border border-black bg-white rounded-none focus:outline-none focus:ring-1 focus:ring-shonen-orange text-gray-900"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-mono text-[8px] font-black text-gray-700 uppercase">RECRUIT OPERATORS:</label>
                          {mutualFollows.length === 0 ? (
                            <p className="font-mono text-[8px] text-gray-400 uppercase italic">No mutual follows available to recruit.</p>
                          ) : (
                            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                              {mutualFollows.map((friend) => {
                                const isSelected = selectedGcMembers.includes(friend.id);
                                return (
                                  <div
                                    key={friend.id}
                                    onClick={() => {
                                      sounds.playTick();
                                      if (isSelected) {
                                        setSelectedGcMembers(prev => prev.filter(id => id !== friend.id));
                                      } else {
                                        setSelectedGcMembers(prev => [...prev, friend.id]);
                                      }
                                    }}
                                    className={`p-1 border text-left cursor-pointer transition-all flex items-center justify-between ${
                                      isSelected 
                                        ? 'bg-black text-white border-black' 
                                        : 'bg-white text-gray-800 border-gray-200 hover:border-black'
                                    }`}
                                  >
                                    <span className="font-mono text-[10px] uppercase font-bold">{friend.username}</span>
                                    <span className="font-mono text-[8px]">{isSelected ? '✓ RECRUITED' : '+ ADD'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={!gcName.trim() || selectedGcMembers.length === 0}
                          className="w-full font-mono text-[10px] bg-shonen-orange text-white hover:bg-black font-black p-1.5 uppercase transition-colors disabled:opacity-50 disabled:hover:bg-shonen-orange"
                        >
                          INITIALIZE SQUAD CHAT
                        </button>
                      </form>
                    )}

                    {groupChats.length > 0 && (
                      <div className="space-y-1">
                        {groupChats.map((gc) => {
                          const isGcSelected = activeChannel?.id === gc.id;
                          const unreadCount = unreadCounts[gc.id] || 0;

                          return (
                            <div
                              key={gc.id}
                              onClick={() => {
                                sounds.playSelect();
                                setActiveChannel(gc);
                              }}
                              className={`p-2 border transition-all cursor-pointer flex justify-between items-center rounded-none relative overflow-hidden ${
                                isGcSelected
                                  ? 'bg-shonen-orange/10 border-shonen-orange/75 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-shonen-orange'
                              }`}
                            >
                              {isGcSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-shonen-orange" />
                              )}

                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full border border-black shrink-0 flex items-center justify-center overflow-hidden bg-black text-white font-mono text-[10px] font-black">
                                  {gc.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-mono text-xs font-black text-gray-900 uppercase block leading-none mb-1">
                                    {gc.name}
                                  </span>
                                  <span className="font-mono text-[8px] text-gray-400 uppercase block leading-none truncate">
                                    {gc.members?.length || 0} OPERATORS
                                  </span>
                                </div>
                              </div>

                              {unreadCount > 0 ? (
                                <span className="font-mono text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 animate-pulse border border-white flex items-center gap-1 shrink-0">
                                  🗡️ KATANA
                                </span>
                              ) : (
                                <span className="font-mono text-[8px] text-gray-400 border border-gray-100 px-1 py-0.5 bg-gray-50 uppercase shrink-0">
                                  SQUAD
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* ACTIVE CHATS DIRECTORY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-shonen-orange shrink-0" />
                      <span className="font-mono text-[9px] text-shonen-orange font-extrabold uppercase tracking-widest">
                        DIRECT COMMUNICATIONS ({mutualFollows.length})
                      </span>
                    </div>

                    {mutualFollows.length === 0 ? (
                      <div className="p-3 border border-gray-200 bg-white text-center">
                        <p className="font-mono text-[9px] text-gray-500 uppercase font-black mb-1">
                          NO ACTIVE CONNS
                        </p>
                        <p className="font-mono text-[7.5px] text-gray-400 uppercase leading-relaxed">
                          MUTUALLY FOLLOW OTHER OPERATORS TO INITIATE INSTANT CHANNELS!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {mutualFollows.map((friend) => {
                          const isFriendSelected = activeChannel?.id === friend.id;
                          const unreadCount = unreadCounts[friend.id] || 0;

                          return (
                            <div
                              key={friend.id}
                              onClick={() => {
                                sounds.playSelect();
                                setActiveChannel(friend);
                              }}
                              className={`p-2 border transition-all cursor-pointer flex justify-between items-center rounded-none relative overflow-hidden ${
                                isFriendSelected
                                  ? 'bg-shonen-orange/10 border-shonen-orange/75 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-shonen-orange'
                              }`}
                            >
                              {/* Left active border accent for selected channel */}
                              {isFriendSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-shonen-orange" />
                              )}

                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full border border-black shrink-0 flex items-center justify-center overflow-hidden bg-gray-50">
                                  {(() => {
                                    const friendProfile = allProfiles?.find(p => p.id === friend.id);
                                    const friendAvatarUrl = friendProfile?.avatar_url;
                                    if (friendAvatarUrl) {
                                      return <img src={friendAvatarUrl} alt={friend.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
                                    }
                                    return (
                                      <div className="w-full h-full bg-gray-200 text-gray-700 text-[10px] font-mono font-black flex items-center justify-center">
                                        {friend.username.slice(0, 2).toUpperCase()}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-mono text-xs font-black text-gray-900 uppercase block leading-none mb-1">
                                    {friend.username}
                                  </span>
                                  <span className="font-mono text-[8px] text-gray-400 uppercase block leading-none truncate">
                                    ARENA-{friend.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              {/* Unread Message count indicator badge */}
                              {unreadCount > 0 ? (
                                <span className="font-mono text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 animate-pulse border border-white flex items-center gap-1 shrink-0">
                                  🗡️ KATANA
                                </span>
                              ) : (
                                <span className="font-mono text-[8px] text-gray-400 border border-gray-100 px-1 py-0.5 bg-gray-50 uppercase shrink-0">
                                  CONN
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: THE CONVERSATION PANEL */}
              <div 
                className={`flex-1 flex flex-col h-full bg-white relative ${
                  !activeChannel ? 'hidden md:flex' : 'flex'
                }`}
              >
                {!activeChannel ? (
                  /* PLACEHOLDER: NO CHAT CHOSEN */
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-gradient-to-b from-pink-50/20 via-purple-50/10 to-pink-50/30">
                    <div className="w-16 h-16 rounded-full bg-pink-100/80 border-2 border-dashed border-pink-300 flex items-center justify-center mb-4 shadow-xs">
                      <MessageSquare className="w-8 h-8 text-pink-400 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <h4 className="text-base font-extrabold text-gray-800 tracking-tight">
                      No Chat Selected 🌸
                    </h4>
                    <p className="text-xs text-pink-500/80 mt-2 max-w-[280px] leading-relaxed font-medium">
                      Select a friend or squad on the left to send sweet messages, anime GIFs, and cute stickers!
                    </p>
                  </div>
                ) : (
                  /* ACTIVE DIRECT CHAT WINDOW */
                  <div className="flex-1 flex flex-col h-full justify-between overflow-hidden">
                    
                    {/* Header Controls for Mobile and quick actions */}
                    <div className="p-3 bg-pink-50/40 border-b border-pink-100 flex justify-between items-center shrink-0">
                      <button
                        onClick={() => {
                          sounds.playTick();
                          setActiveChannel(null);
                        }}
                        className="md:hidden text-xs text-pink-600 border border-pink-200 px-3 py-1 bg-white hover:bg-pink-100 rounded-full font-bold transition-all cursor-pointer shadow-xs"
                      >
                        ← Back
                      </button>
                      
                      <div className="hidden md:flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-gray-600 font-bold">
                          🌸 Active Connection
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          sounds.playSelect();
                          onOpenProfile(activeChannel);
                        }}
                        className="text-xs text-pink-600 border border-pink-200 px-3 py-1 bg-white hover:bg-pink-50 rounded-full font-bold transition-all cursor-pointer shadow-xs"
                      >
                        View Profile 🌸
                      </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin bg-gradient-to-b from-white via-pink-50/10 to-white">
                      {loadingMsgs ? (
                        <div className="h-full flex justify-center items-center text-xs text-pink-400 font-medium animate-pulse">
                          🌸 Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col justify-center items-center text-center p-6">
                          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-xl mb-2 shadow-xs">
                            💌
                          </div>
                          <p className="text-xs text-gray-800 font-bold">
                            Chat started with @{activeChannel.username}
                          </p>
                          <p className="text-xs text-pink-400 mt-1">
                            Say hi with a cute message or anime sticker below! 🌸
                          </p>
                        </div>
                      ) : (
                        messages.map((m) => {
                          const isSelf = m.sender_id === currentUser.id;
                          const senderProfile = allProfiles?.find(p => p.id === m.sender_id);
                          const senderAvatarUrl = senderProfile?.avatar_url;

                          // Media detection
                          const isGif = m.text.startsWith('[GIF]');
                          const isSticker = m.text.startsWith('[STICKER]');
                          const mediaUrl = (isGif || isSticker) ? m.text.split(' ').slice(1).join(' ') : null;

                          return (
                            <div
                              key={m.id}
                              className={`flex gap-2 max-w-[85%] items-end ${isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
                            >
                              {/* Avatar Bubble */}
                              <div className="w-7 h-7 rounded-full border border-pink-200 bg-pink-50 shrink-0 flex items-center justify-center overflow-hidden mb-1 shadow-xs">
                                {senderAvatarUrl ? (
                                  <img src={senderAvatarUrl} alt={m.sender_username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-[9px] font-bold text-pink-600">
                                    🌸
                                  </span>
                                )}
                              </div>

                              {/* Message bubble core */}
                              <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-pink-300 font-medium mb-1">
                                  {isSelf ? 'You' : m.sender_username} &bull; {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                
                                {mediaUrl ? (
                                  /* Image Media Rendering (GIFs & Stickers) */
                                  isSticker ? (
                                    <div className="p-1 max-w-[130px] bg-white border border-pink-200 rounded-2xl hover:scale-105 transition-transform duration-200 relative shadow-xs">
                                      <img 
                                        src={mediaUrl} 
                                        alt="Sticker Expression" 
                                        referrerPolicy="no-referrer"
                                        className="w-full h-auto object-contain rounded-xl"
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-1 border border-pink-200 max-w-[180px] bg-white rounded-2xl hover:scale-105 transition-transform duration-200 relative shadow-xs overflow-hidden">
                                      <img 
                                        src={mediaUrl} 
                                        alt="Anime GIF" 
                                        referrerPolicy="no-referrer"
                                        className="w-full h-auto object-cover rounded-xl"
                                      />
                                    </div>
                                  )
                                ) : (
                                  /* Text Message Rendering */
                                  <div className={`px-4 py-2.5 text-xs leading-relaxed transition-all shadow-xs ${
                                    isSelf 
                                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-3xl rounded-br-xs' 
                                      : 'bg-pink-50/80 border border-pink-200/80 text-gray-800 rounded-3xl rounded-bl-xs'
                                  }`}>
                                    {m.text}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Sticker/GIF media drawer toggle content drawer */}
                    <AnimatePresence>
                      {showMediaDrawer && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-pink-50/50 border-t border-pink-100 flex flex-col shrink-0 overflow-hidden"
                        >
                          {/* Media drawer category buttons */}
                          <div className="flex border-b border-pink-100">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playTick();
                                setMediaTab('GIF');
                              }}
                              className={`flex-1 py-2 text-xs font-bold uppercase text-center border-r border-pink-100 transition-colors ${
                                mediaTab === 'GIF' 
                                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white' 
                                  : 'bg-white/60 text-pink-500 hover:bg-pink-100'
                              }`}
                            >
                              ⚡ Anime GIFs
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playTick();
                                setMediaTab('STICKER');
                              }}
                              className={`flex-1 py-2 text-xs font-bold uppercase text-center transition-colors ${
                                mediaTab === 'STICKER' 
                                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white' 
                                  : 'bg-white/60 text-pink-500 hover:bg-pink-100'
                              }`}
                            >
                              🌸 Chibi Stickers
                            </button>
                          </div>

                          {/* Media grid list wrapper */}
                          <div className="p-3 max-h-40 overflow-y-auto grid grid-cols-4 gap-2 bg-white">
                            {mediaTab === 'GIF' ? (
                              ACTION_GIFS.map((gif) => (
                                <button
                                  key={gif.name}
                                  type="button"
                                  onClick={() => handleSendMedia(gif.url, 'GIF')}
                                  className="border border-pink-100 hover:border-pink-300 rounded-xl p-1 hover:scale-105 transition-all bg-pink-50/30 flex flex-col justify-between h-20 overflow-hidden cursor-pointer"
                                >
                                  <img src={gif.url} alt={gif.name} className="w-full h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                                  <span className="text-[7px] font-bold text-pink-500 truncate block w-full mt-0.5">
                                    {gif.name}
                                  </span>
                                </button>
                              ))
                            ) : (
                              CHIBI_STICKERS.map((stk) => (
                                <button
                                  key={stk.name}
                                  type="button"
                                  onClick={() => handleSendMedia(stk.url, 'STICKER')}
                                  className="border border-pink-100 hover:border-pink-300 rounded-xl p-1 hover:scale-105 transition-all bg-pink-50/30 flex flex-col justify-between h-20 overflow-hidden cursor-pointer"
                                >
                                  <img src={stk.url} alt={stk.name} className="w-full h-12 object-contain" referrerPolicy="no-referrer" />
                                  <span className="text-[7px] font-bold text-pink-500 truncate block w-full mt-0.5">
                                    {stk.name}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Chat Input form bar with GIF/Sticker toggle */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-pink-50/40 border-t border-pink-100 flex gap-2 shrink-0">
                      
                      {/* Toggle stickers panel button */}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playTick();
                          setShowMediaDrawer(!showMediaDrawer);
                        }}
                        className={`px-3 py-2 rounded-full border border-pink-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          showMediaDrawer 
                            ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-pink-400' 
                            : 'bg-white hover:bg-pink-50 text-pink-600'
                        }`}
                        title="Toggle Stickers / GIFs"
                      >
                        <Smile className="w-4 h-4 text-pink-500 shrink-0" />
                        <span className="hidden sm:inline">Stickers</span>
                      </button>

                      <input
                        type="text"
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        placeholder={showMediaDrawer ? "Choose a cute sticker or type message..." : "Type a sweet message... 🌸"}
                        className="flex-1 bg-white border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 rounded-full px-4 py-2 text-xs focus:outline-none placeholder-pink-300 text-gray-800 transition-all shadow-inner"
                      />
                      
                      <button
                        type="submit"
                        disabled={!msgInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-full font-bold text-xs transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 shadow-xs active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
