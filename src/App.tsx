import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Matchup, Poll, User, UserPreferences, HistoryItem, DbComment, DbFollow, PremiumRequest } from './types';
import { sounds } from './components/SoundManager';
import CyberGrid from './components/CyberGrid';
import ActiveBracketSpotlight from './components/ActiveBracketSpotlight';
import LivePollingGrid from './components/LivePollingGrid';
import LaunchRoomModal from './components/LaunchRoomModal';
import CyberAuthProfile from './components/CyberAuthProfile';
import ProfileSetupModal from './components/ProfileSetupModal';
import OperatorProfileModal from './components/OperatorProfileModal';
import ShareTransmitModal from './components/ShareTransmitModal';
import CombatCommsWidget from './components/CombatCommsWidget';
import TasteMatcherModal from './components/TasteMatcherModal';
import { AboutFaqSection } from './components/AboutFaqSection';
import { supabase } from './lib/supabaseClient';
import {
  hashToBigint,
  savePollStats,
  getAllPollStats,
  getUserCastVotes,
  saveUserCastVote,
  removeUserCastVote,
  syncVoteToSupabase,
  removeVoteFromSupabase,
  loadPersistedMatchups,
  saveMatchupVote,
  loadComments,
  saveComment,
  getPollLikes,
  getStoredProfiles,
  saveUserProfile,
  getCustomPosts,
  getTasteRequests
} from './lib/dataStorage';
import { 
  Trophy, 
  Swords, 
  Layers, 
  GraduationCap, 
  Radio, 
  Flame, 
  Volume2, 
  VolumeX, 
  Terminal, 
  ArrowUpRight, 
  ChevronRight, 
  Cpu, 
  Activity,
  Github,
  Zap,
  Search,
  Sparkles,
  Monitor,
  Bell,
  MessageSquare,
  Heart
} from 'lucide-react';

const memoryStorage: Record<string, string> = {};
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem blocked/unsupported:', e);
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem blocked/unsupported:', e);
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage.removeItem blocked/unsupported:', e);
      delete memoryStorage[key];
    }
  }
};

export default function App() {
  // Modal Open state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false);
  
  // Audio Mute state
  const [isMuted, setIsMuted] = useState(false);
  
  // Screen shake state for fight impact
  const [isShaking, setIsShaking] = useState(false);

  // Active view filters ('ALL' | 'POP-CULTURE' | 'CLASSROOM')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'POP-CULTURE' | 'CLASSROOM' | 'TOURNAMENT'>('ALL');

  // Instagram view mode ('FEED' | 'GRID')
  const [viewMode, setViewMode] = useState<'FEED' | 'GRID'>('FEED');

  // Search filter query state
  const [searchQuery, setSearchQuery] = useState('');

  // Social search, profile, sharing states
  const [navSearch, setNavSearch] = useState('');
  const [navSearchResults, setNavSearchResults] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allVotes, setAllVotes] = useState<any[]>([]);
  const [messagesTick, setMessagesTick] = useState(0);

  const fetchAllVotes = async () => {
    try {
      const { data, error } = await supabase.from('votes').select('*');
      if (!error && data) {
        setAllVotes(data);
      }
    } catch (err) {
      console.warn('Failed to fetch all votes:', err);
    }
  };

  useEffect(() => {
    const handleRecalc = () => {
      setMessagesTick(t => t + 1);
    };
    window.addEventListener('recalc-unread-messages', handleRecalc);
    return () => window.removeEventListener('recalc-unread-messages', handleRecalc);
  }, []);

  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pollToShare, setPollToShare] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTasteMatcherOpen, setIsTasteMatcherOpen] = useState(false);
  const [tasteMatcherTarget, setTasteMatcherTarget] = useState<any | null>(null);

  const getMentions = () => {
    const staticMentions = [
      {
        id: 'm1',
        sender: 'SAKURA_CHAN',
        text: '✨ Welcome to Anime Clash Arena! Send a Taste Matcher request to find your anime taste twin 🌸💖',
        timestamp: Date.now() - 300000,
        sourceTitle: 'BEST SHONEN PROTAGONIST MATCH',
        sourceId: 'goku-saitama'
      },
      {
        id: 'm2',
        sender: 'SENSEI_TANAKA',
        text: 'Check out the physics energy checkpoint quiz in the Class 11 stream!',
        timestamp: Date.now() - 900000,
        sourceTitle: 'PHYSICS CLASS 11 - ENERGY PROPAGATION',
        sourceId: 'physics-11'
      },
      {
        id: 'm3',
        sender: 'cyber_kage',
        text: 'The stickman sparring animations on Velgre polls are extremely responsive!',
        timestamp: Date.now() - 1800000,
        sourceTitle: 'CYBERPUNK CHRONICLES DUEL',
        sourceId: 'edgerunners-akira'
      }
    ];

    let chatMentions: any[] = [];
    try {
      const uId = currentUser?.id;
      if (uId) {
        const localMsgs = JSON.parse(localStorage.getItem('vote_arena_messages') || '[]');
        const blocked = blockedUsers || [];
        const receivedMsgs = localMsgs.filter((m: any) => 
          m.receiver_id === uId && 
          m.sender_id !== uId &&
          !m.text.startsWith('[SYSTEM_GC_CREATED]') &&
          !blocked.includes(m.sender_id)
        );

        chatMentions = receivedMsgs.map((m: any) => {
          let senderUsername = m.sender_username;
          if (!senderUsername) {
            const senderProf = allProfiles?.find(p => p.id === m.sender_id);
            senderUsername = senderProf?.username || 'ANONYMOUS OPERATOR';
          }

          let cleanText = m.text;
          if (cleanText.startsWith('[GC_MSG]')) {
            try {
              const payload = JSON.parse(cleanText.substring(8).trim());
              cleanText = payload.text;
              senderUsername = payload.senderUsername || senderUsername;
            } catch {}
          }

          return {
            id: m.id,
            sender: senderUsername,
            senderId: m.sender_id,
            text: cleanText,
            timestamp: new Date(m.created_at).getTime(),
            sourceTitle: 'COMBAT COMMUNICATIONS DIRECT MSG',
            sourceId: 'direct-message',
            isChat: true
          };
        });
      }
    } catch (e) {
      console.warn("Failed to derive chat mentions", e);
    }

    const combined = [...chatMentions, ...staticMentions];
    combined.sort((a, b) => b.timestamp - a.timestamp);
    return combined;
  };

  const getUnreadMentionsCount = () => {
    try {
      const uId = currentUser?.id || 'guest';
      const seenStored = localStorage.getItem(`vote_arena_seen_notifications_${uId}`);
      if (hasCheckedNotifications) return 0;
      const seenIds = seenStored ? JSON.parse(seenStored) : [];
      const currentMentions = getMentions();
      const unread = currentMentions.filter(m => !seenIds.includes(m.id));
      return unread.length;
    } catch (e) {
      return 0;
    }
  };

  const markNotificationsAsSeen = () => {
    try {
      const uId = currentUser?.id || 'guest';
      const currentMentions = getMentions();
      const mentionIds = currentMentions.map(m => m.id);
      localStorage.setItem(`vote_arena_seen_notifications_${uId}`, JSON.stringify(mentionIds));
      setHasCheckedNotifications(true);
    } catch (e) {}
  };

  // Fetch profiles from Supabase profiles table and local storage
  const fetchAllProfiles = async () => {
    try {
      const combinedMap = new Map<string, any>();
      
      // 1. Recover locally saved profiles
      const localProfiles = getStoredProfiles();
      Object.values(localProfiles).forEach((p: any) => {
        if (p?.id) combinedMap.set(p.id, p);
      });

      // 2. Fetch remote Supabase profiles
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        data.forEach((p: any) => {
          const existing = combinedMap.get(p.id);
          combinedMap.set(p.id, { ...existing, ...p });
        });
      }

      setAllProfiles(Array.from(combinedMap.values()));
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  useEffect(() => {
    fetchAllProfiles();
    fetchAllVotes();
    fetchPolls();
    fetchActivePolls();

    const handleProfileUpdate = () => fetchAllProfiles();
    const handlePostUpdate = () => fetchPolls();
    window.addEventListener('vote-arena-profiles-updated', handleProfileUpdate);
    window.addEventListener('vote-arena-posts-updated', handlePostUpdate);

    const interval = setInterval(() => {
      fetchAllProfiles();
      fetchAllVotes();
      fetchPolls();
      fetchActivePolls();
    }, 5000); // 5 seconds polling to ensure ultra-responsive real-time updates for all users on any server!
    return () => {
      clearInterval(interval);
      window.removeEventListener('vote-arena-profiles-updated', handleProfileUpdate);
      window.removeEventListener('vote-arena-posts-updated', handlePostUpdate);
    };
  }, []);

  const handleNavSearch = (val: string) => {
    setNavSearch(val);
    if (!val.trim()) {
      setNavSearchResults([]);
      return;
    }
    const valLower = val.toLowerCase().trim();
    const results = allProfiles.filter(p => {
      const username = (p.username || '').toLowerCase();
      const arenaId = `ARENA-${(p.id || '').slice(0, 8).toUpperCase()}`;
      return username.includes(valLower) || arenaId.toLowerCase().includes(valLower);
    });
    setNavSearchResults(results);
  };

  const handleTransmitPollTrigger = (poll: any) => {
    sounds.playSelect();
    setPollToShare(poll);
    setIsShareModalOpen(true);
  };

  // Active User session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vote_arena_blocked_users_guest');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync blocked users when current user is loaded/changed
  useEffect(() => {
    try {
      const uId = currentUser?.id || 'guest';
      const stored = localStorage.getItem(`vote_arena_blocked_users_${uId}`);
      setBlockedUsers(stored ? JSON.parse(stored) : []);
    } catch (e) {
      setBlockedUsers([]);
    }
  }, [currentUser?.id]);

  const handleBlockUser = (userId: string) => {
    try {
      const uId = currentUser?.id || 'guest';
      const updated = [...blockedUsers];
      if (!updated.includes(userId)) {
        updated.push(userId);
      }
      setBlockedUsers(updated);
      localStorage.setItem(`vote_arena_blocked_users_${uId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnblockUser = (userId: string) => {
    try {
      const uId = currentUser?.id || 'guest';
      const updated = blockedUsers.filter(id => id !== userId);
      setBlockedUsers(updated);
      localStorage.setItem(`vote_arena_blocked_users_${uId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Chat message unread count for message icon notification
  const [unreadChatCount, setUnreadChatCount] = useState(() => {
    try {
      return Number(localStorage.getItem('vote_arena_total_unread_chat_count') || '0');
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const updateCount = () => {
      try {
        const count = Number(localStorage.getItem('vote_arena_total_unread_chat_count') || '0');
        setUnreadChatCount(count);
      } catch (e) {
        console.warn(e);
      }
    };

    // Update count when custom event is dispatched
    window.addEventListener('recalc-unread-messages', updateCount);

    // Also run a 3-second polling interval as fallback
    const interval = setInterval(updateCount, 3000);

    return () => {
      window.removeEventListener('recalc-unread-messages', updateCount);
      clearInterval(interval);
    };
  }, []);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('codekatana_user');
    } catch (e) {
      return false;
    }
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // CODEKATANA PRESENTS pink glitch splash screen state
  const [isSplashActive, setIsSplashActive] = useState(true);

  // Splash Screen 2-second timeout or immediate bypass
  useEffect(() => {
    let hasCachedUser = false;
    try {
      hasCachedUser = !!localStorage.getItem('codekatana_user');
    } catch (e) {}

    if (hasCachedUser) {
      setIsSplashActive(false);
      setIsAuthOpen(false);
      setIsLoggedIn(true);
      sounds.playSelect();
      return;
    }

    // Play intro sounds
    setTimeout(() => {
      sounds.playImpact();
    }, 100);

    const timer = setTimeout(() => {
      setIsSplashActive(false);
      // Play system loaded select sound
      sounds.playSelect();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle Supabase Session Translation to Cyberpunk User type (strictly synchronous to prevent auth loop locks)
  const handleSupabaseSession = (session: any, profileData: any = null) => {
    if (!session) {
      setCurrentUser(null);
      return;
    }

    const sUser = session.user;
    const userId = sUser.id;
    const email = sUser.email || '';
    const name = profileData?.username || sUser.user_metadata?.full_name || sUser.user_metadata?.name || email.split('@')[0] || 'OPERATOR';
    const tag = name.slice(0, 3).toUpperCase();

    // Default premium statuses initially
    let is_premium = profileData?.is_premium || false;
    let premium_expires_at = profileData?.premium_expires_at;

    // Bypass for the founder's email
    let is_admin = false;
    if (email.toLowerCase() === 'adhyangiri6@gmail.com') {
      is_premium = true;
      is_admin = true;
      premium_expires_at = '2099-12-31T23:59:59.000Z'; // eternity
    }

    // Load preferences and history from local storage keyed by Supabase user ID
    const userStorageKey = `vote_arena_user_${userId}`;
    const savedData = safeLocalStorage.getItem(userStorageKey);
    let preferences: UserPreferences = {
      accentColor: 'cyan',
      avatarTag: tag,
      enableAlertSounds: true,
      frequencyBias: 'standard'
    };
    let history: HistoryItem[] = [
      {
        id: 'h-init',
        timestamp: new Date().toLocaleTimeString(),
        event: 'SUPABASE AUTH SUCCESS',
        details: `Operator secured terminal session via Google Cloud.`
      }
    ];

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.preferences) preferences = { ...preferences, ...parsed.preferences };
        if (parsed.history) history = parsed.history;
      } catch (e) {}
    } else {
      // Save initial defaults
      safeLocalStorage.setItem(userStorageKey, JSON.stringify({ preferences, history }));
    }

    setCurrentUser({
      id: userId,
      username: name,
      avatar: tag,
      registeredAt: sUser.created_at || new Date().toISOString(),
      preferences,
      history,
      is_premium,
      premium_expires_at,
      is_admin,
      email
    });

    // Seamlessly transition the view: Dismiss splash screen and close Gatekeeper auth drawer on successful session
    setIsSplashActive(false);
    setIsAuthOpen(false);
  };


  // Check the operator profile status and perform conditional routing (onboarding vs dashboard)
  const checkProfileAndRoute = async (session: any) => {
    if (!session?.user) return;
    const userId = session.user.id;
    const email = session.user.email || '';
    if (email.toLowerCase() === 'adhyangiri6@gmail.com') {
      setShowProfileSetup(false);
      handleSupabaseSession(session, { username: 'ADHYAN', is_premium: true, premium_expires_at: '2099-12-31T23:59:59.000Z' });
      return;
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && data.username) {
        // Return operator: route to VOTE//ARENA dashboard
        setShowProfileSetup(false);
        handleSupabaseSession(session, data);
      } else {
        // New operator / missing username: Show the complete profile form
        setShowProfileSetup(true);
        handleSupabaseSession(session, null);
      }
    } catch (err) {
      console.warn('Profiles check database read error, fallback to onboarding:', err);
      setShowProfileSetup(true);
    }
  };

  // Onboard new operators by writing profile details to Supabase profiles table
  const handleSaveProfile = async (profileData: {
    username: string;
    bio: string;
    gender: string;
    age: number | null;
  }) => {
    const sessionResponse = await supabase.auth.getSession();
    const session = sessionResponse.data.session;
    if (!session || !session.user) {
      throw new Error('SECURE TERMINAL RE-AUTHENTICATION REQUIRED.');
    }

    const userId = session.user.id;

    // Resilient upsert: try all columns first, fall back to id & username on database constraint anomalies
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: profileData.username.trim(),
        bio: profileData.bio.trim(),
        gender: profileData.gender,
        age: profileData.age,
        is_premium: false
      });

    if (error) {
      console.warn('Full profile upsert failed, retrying with fallback id and username:', error.message);
      const { error: fallbackError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: profileData.username.trim()
        });

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }
    }

    // Success: let the operator into the main app
    setShowProfileSetup(false);

    // Retrieve updated session profile to update current user state
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    handleSupabaseSession(session, updatedProfile || { username: profileData.username });
  };


  // Sync session & Listen for Popup success messages
  useEffect(() => {
    // 1. Recover session from localStorage immediately on mount to prevent timing race conditions
    let cachedUser: any = null;
    try {
      const stored = localStorage.getItem('codekatana_user');
      if (stored) {
        cachedUser = JSON.parse(stored);
      }
    } catch (e) {}

    if (cachedUser) {
      const reconstructedSession = { user: cachedUser };
      setIsLoggedIn(true);
      setIsSplashActive(false);
      setIsAuthOpen(false);
      
      // Load current user profile from local storage immediately as a fallback
      handleSupabaseSession(reconstructedSession);
      
      // Validate profile on server asynchronously
      checkProfileAndRoute(reconstructedSession);
    }

    // 2. Handle direct redirect authentication (hash for implicit, query search for PKCE)
    const codeParam = new URLSearchParams(window.location.search).get('code');
    const hashParam = window.location.hash;

    if (codeParam) {
      supabase.auth.exchangeCodeForSession(codeParam).then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error exchanging code for session:', error);
        } else if (session) {
          try {
            localStorage.setItem('codekatana_user', JSON.stringify(session.user));
          } catch (e) {}
          window.history.replaceState(null, '', window.location.pathname);
          setIsLoggedIn(true);
          setIsSplashActive(false);
          setIsAuthOpen(false);
          checkProfileAndRoute(session);
        }
      });
    } else if (hashParam.includes('access_token')) {
      const params = new URLSearchParams(hashParam.substring(1));
      const access_token = params.get('access_token') || '';
      const refresh_token = params.get('refresh_token') || '';
      if (access_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
          if (session) {
            try {
              localStorage.setItem('codekatana_user', JSON.stringify(session.user));
            } catch (e) {}
            window.history.replaceState(null, '', window.location.pathname);
            setIsLoggedIn(true);
            setIsSplashActive(false);
            setIsAuthOpen(false);
            checkProfileAndRoute(session);
          }
        });
      }
    }

    // 3. Check current real Supabase session on mount (non-destructive)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        try {
          localStorage.setItem('codekatana_user', JSON.stringify(session.user));
        } catch (e) {}
        window.history.replaceState(null, '', window.location.pathname);
        setIsLoggedIn(true);
        setIsSplashActive(false);
        setIsAuthOpen(false);
        checkProfileAndRoute(session);
      }
    });

    // 4. Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('SUPABASE_AUTH_EVENT:', event);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || session?.user) {
        if (session?.user) {
          try {
            localStorage.setItem('codekatana_user', JSON.stringify(session.user));
          } catch (e) {}
          setIsLoggedIn(true);
          setIsSplashActive(false);
          setIsAuthOpen(false);
          checkProfileAndRoute(session);
        }
      } else if (event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem('codekatana_user');
        } catch (e) {}
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    // 5. Handle popup communications
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'SUPABASE_OAUTH_SUCCESS') {
        const { hash, search } = event.data;
        
        let access_token = '';
        let refresh_token = '';
        let code = '';
        
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          access_token = params.get('access_token') || '';
          refresh_token = params.get('refresh_token') || '';
        }

        if (search) {
          const params = new URLSearchParams(search);
          code = params.get('code') || '';
        }
        
        if (code) {
          // Exchange PKCE code
          supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
            if (session) {
              try {
                localStorage.setItem('codekatana_user', JSON.stringify(session.user));
              } catch (e) {}
              setIsLoggedIn(true);
              setIsSplashActive(false);
              setIsAuthOpen(false);
              checkProfileAndRoute(session);
            } else if (error) {
              console.error('Popup PKCE code exchange failed:', error);
            }
          });
        } else if (access_token) {
          // Explicitly set the session inside the iframe using the token passed from the popup
          supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
            if (session) {
              try {
                localStorage.setItem('codekatana_user', JSON.stringify(session.user));
              } catch (e) {}
              setIsLoggedIn(true);
              setIsSplashActive(false);
              setIsAuthOpen(false);
              checkProfileAndRoute(session);
            }
          });
        } else {
          // Fallback to getSession
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              try {
                localStorage.setItem('codekatana_user', JSON.stringify(session.user));
              } catch (e) {}
              window.history.replaceState(null, '', window.location.pathname);
              setIsLoggedIn(true);
              setIsSplashActive(false);
              setIsAuthOpen(false);
              checkProfileAndRoute(session);
            }
          });
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  // SEPARATE ADMIN CHECK
  useEffect(() => {
    if (currentUser && currentUser.email) {
      if (currentUser.email.toLowerCase() === 'adhyangiri6@gmail.com') {
        setIsAdmin(true);
        // Apply the admin badge/glow
        if (!currentUser.is_admin) {
          setCurrentUser(prev => prev ? { ...prev, is_admin: true, is_premium: true } : null);
        }
      } else {
        setIsAdmin(false);
        // Clear any admin badges and treat them as a standard user
        if (currentUser.is_admin) {
          setCurrentUser(prev => prev ? { ...prev, is_admin: false } : null);
        }
      }
    } else {
      setIsAdmin(false);
    }
  }, [currentUser?.email]);

  // ASYNC PROFILE SYNC (Isolated from auth state change path to prevent lock loops)
  useEffect(() => {
    if (!currentUser?.id) return;

    // Skip if it is the admin
    const email = currentUser.email || '';
    if (email.toLowerCase() === 'adhyangiri6@gmail.com') return;

    let active = true;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!active) return;

        if (data) {
          let is_premium = data.is_premium || false;
          let premium_expires_at = data.premium_expires_at;

          // Check if premium is expired
          if (is_premium && premium_expires_at) {
            const expiryDate = new Date(premium_expires_at);
            if (expiryDate < new Date()) {
              is_premium = false; // expired!
            }
          }

          setCurrentUser(prev => {
            if (prev && prev.id === currentUser.id) {
              return {
                ...prev,
                is_premium,
                premium_expires_at
              };
            }
            return prev;
          });
        } else {
          // Create initial profile if missing
          const name = currentUser.username;
          await supabase
            .from('profiles')
            .insert([{ id: currentUser.id, username: name, is_premium: false }]);
        }
      } catch (err) {
        console.warn('Could not read profiles from Supabase. Table may not exist yet:', err);
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  // Popup closer callback (executed if this instance is opened as a popup window)
  useEffect(() => {
    if (window.opener && (window.location.hash.includes('access_token') || window.location.hash.includes('id_token') || window.location.search.includes('code='))) {
      window.opener.postMessage({ 
        type: 'SUPABASE_OAUTH_SUCCESS',
        hash: window.location.hash,
        search: window.location.search
      }, '*');
      window.close();
    }
  }, []);

  // Update preference colors dynamically on layout if selected
  const getThemeAccentClass = () => {
    if (!currentUser) return 'text-neon-cyan';
    switch (currentUser.preferences.accentColor) {
      case 'pink': return 'text-cyber-pink';
      case 'yellow': return 'text-neon-yellow';
      default: return 'text-neon-cyan';
    }
  };

  const getThemeBorderClass = () => {
    if (!currentUser) return 'border-neon-cyan';
    switch (currentUser.preferences.accentColor) {
      case 'pink': return 'border-cyber-pink';
      case 'yellow': return 'border-neon-yellow';
      default: return 'border-neon-cyan';
    }
  };

  const getThemeBgClass = () => {
    if (!currentUser) return 'bg-neon-cyan';
    switch (currentUser.preferences.accentColor) {
      case 'pink': return 'bg-cyber-pink';
      case 'yellow': return 'bg-neon-yellow';
      default: return 'bg-neon-cyan';
    }
  };

  // Helper to append log items to the active operator
  const addHistoryItem = (event: string, details: string) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const userId = session.user.id;
      const userStorageKey = `vote_arena_user_${userId}`;
      const savedData = safeLocalStorage.getItem(userStorageKey);
      let preferences: UserPreferences = {
        accentColor: 'cyan',
        avatarTag: 'OPS',
        enableAlertSounds: true,
        frequencyBias: 'standard'
      };
      let history: HistoryItem[] = [];

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.preferences) preferences = parsed.preferences;
          if (parsed.history) history = parsed.history;
        } catch (e) {}
      }

      const newItem: HistoryItem = {
        id: `h-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        event,
        details
      };

      const updatedHistory = [...history, newItem];
      safeLocalStorage.setItem(userStorageKey, JSON.stringify({ preferences, history: updatedHistory }));
      setCurrentUser(prev => prev ? { ...prev, history: updatedHistory } : null);
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    sounds.playError();
    try {
      localStorage.removeItem('codekatana_user');
    } catch (e) {}
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleUpdatePreferences = (updatedPrefs: UserPreferences) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const userId = session.user.id;
      const userStorageKey = `vote_arena_user_${userId}`;
      const savedData = safeLocalStorage.getItem(userStorageKey);
      let history: HistoryItem[] = [];

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.history) history = parsed.history;
        } catch (e) {}
      }

      safeLocalStorage.setItem(userStorageKey, JSON.stringify({ preferences: updatedPrefs, history }));
      setCurrentUser(prev => prev ? { ...prev, preferences: updatedPrefs } : null);
    });
  };

  const handleUpdateAvatarUrl = (url: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar_url: url };
    setCurrentUser(updated);
    try {
      localStorage.setItem('codekatana_user', JSON.stringify(updated));
      if (currentUser.id) {
        localStorage.setItem(`vote_arena_user_${currentUser.id}`, JSON.stringify(updated));
      }
    } catch (e) {}

    if (currentUser.id) {
      saveUserProfile({
        id: currentUser.id,
        username: currentUser.username,
        avatar_url: url
      });
      supabase.from('profiles').upsert({
        id: currentUser.id,
        username: currentUser.username,
        avatar_url: url
      }).then(() => {});
    }
    fetchAllProfiles();
  };

  const handleUpdateProfile = async (updatedData: {
    username: string;
    bio: string;
    avatar_url: string;
    preferences: UserPreferences;
  }) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      username: updatedData.username,
      bio: updatedData.bio,
      avatar_url: updatedData.avatar_url,
      avatar: updatedData.preferences.avatarTag,
      preferences: updatedData.preferences
    };

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('codekatana_user', JSON.stringify(updatedUser));
      if (currentUser.id) {
        localStorage.setItem(`vote_arena_user_${currentUser.id}`, JSON.stringify(updatedUser));
      }
    } catch (e) {}

    if (currentUser.id) {
      saveUserProfile({
        id: currentUser.id,
        username: updatedData.username,
        bio: updatedData.bio,
        avatar_url: updatedData.avatar_url
      });

      try {
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          username: updatedData.username,
          bio: updatedData.bio,
          avatar_url: updatedData.avatar_url
        });
      } catch (err) {
        console.warn('Remote profile sync error (handled):', err);
      }
    }
    fetchAllProfiles();
  };

  // Handle upgrading active user or requesting premium confirmation
  const handleUpgradeToPremium = async (utrRef?: string) => {
    if (!currentUser || !currentUser.id) return;
    
    // If the operator adhyangiri6@gmail.com is self-upgrading:
    const isOperatorSelf = currentUser.email?.toLowerCase() === 'adhyangiri6@gmail.com';

    if (isOperatorSelf) {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      const premiumExpires = oneMonthFromNow.toISOString();

      try {
        await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            is_premium: true,
            premium_status: 'approved',
            premium_expires_at: premiumExpires,
            username: currentUser.username
          });
      } catch (err) {}

      setCurrentUser(prev => prev ? {
        ...prev,
        is_premium: true,
        premium_status: 'approved',
        premium_expires_at: premiumExpires
      } : null);

      sounds.playPunchyCTA();
      alert("👑 OPERATOR PRE-CONFIRMED: Premium activated for adhyangiri6@gmail.com.");
      return;
    }

    // Normal user purchase request -> MUST send confirmation to adhyangiri6@gmail.com
    const newRequest: PremiumRequest = {
      id: `req-${Date.now()}`,
      user_id: currentUser.id,
      username: currentUser.username,
      user_email: currentUser.email || `${currentUser.username.toLowerCase()}@arena.user`,
      item_type: 'PREMIUM_MEMBERSHIP',
      utr_ref: utrRef || 'DIRECT_REQUEST',
      amount: '₹100 / $1.00',
      status: 'pending',
      created_at: new Date().toISOString(),
      target_email: 'adhyangiri6@gmail.com'
    };

    // 1. Save to local requests queue
    try {
      const savedReqs: PremiumRequest[] = JSON.parse(safeLocalStorage.getItem('vote_arena_premium_requests') || '[]');
      savedReqs.unshift(newRequest);
      safeLocalStorage.setItem('vote_arena_premium_requests', JSON.stringify(savedReqs));
    } catch (e) {}

    // 2. Try inserting into Supabase premium_requests
    try {
      await supabase.from('premium_requests').insert([newRequest]);
    } catch (e) {}

    // 3. Mark user's status as pending in Supabase (NO premium granted)
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          is_premium: false,
          premium_status: 'pending',
          username: currentUser.username
        });
    } catch (err) {}

    // 4. Also update local storage user history
    const userStorageKey = `vote_arena_user_${currentUser.id}`;
    const savedData = safeLocalStorage.getItem(userStorageKey);
    let history = currentUser.history || [];
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.history) history = parsed.history;
      } catch (e) {}
    }

    const pendingLog = {
      id: `h-prem-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      event: 'PREMIUM PURCHASE REQUESTED',
      details: 'Confirmation email sent to adhyangiri6@gmail.com. Pending operator allow.'
    };

    const updatedHistory = [...history, pendingLog];

    setCurrentUser(prev => prev ? {
      ...prev,
      is_premium: false,
      premium_status: 'pending',
      history: updatedHistory
    } : null);

    sounds.playPunchyCTA();
    alert("📧 CONFIRMATION EMAIL TRANSMITTED TO adhyangiri6@gmail.com!\n\nYour purchase request is now PENDING OPERATOR CONFIRMATION.\nIf adhyangiri6@gmail.com allows YES, premium will begin on your account.\nOtherwise, if rejected, request will show CANCELLED and no premium will be given.");
  };

  // Seed data for 1-vs-1 Tournament matchups
  const DEFAULT_MATCHUPS: Matchup[] = [
    {
      id: 'goku-saitama',
      title: 'BEST SHONEN PROTAGONIST MATCH',
      round: 'FINALS OF 16',
      totalVotes: 9613,
      hasVoted: null,
      contestantA: {
        name: 'SON GOKU',
        subName: 'Dragon Ball Z / Ultra Instinct',
        votes: 4892,
        accentColor: 'text-neon-yellow',
        avatarCode: '悟空',
      },
      contestantB: {
        name: 'SAITAMA',
        subName: 'One Punch Man / Serious Punch',
        votes: 4721,
        accentColor: 'text-cyber-pink',
        avatarCode: 'ワン',
      }
    },
    {
      id: 'spike-mugen',
      title: 'NEO-NOIR SPACE COB VS SAMURAI',
      round: 'SEMI-FINALS',
      totalVotes: 4500,
      hasVoted: null,
      contestantA: {
        name: 'SPIKE SPIEGEL',
        subName: 'Cowboy Bebop / Bebop Captain',
        votes: 2311,
        accentColor: 'text-neon-yellow',
        avatarCode: 'スパ',
      },
      contestantB: {
        name: 'MUGEN',
        subName: 'Samurai Champloo / Wild Vagabond',
        votes: 2189,
        accentColor: 'text-cyber-pink',
        avatarCode: 'ムゲ',
      }
    },
    {
      id: 'edgerunners-akira',
      title: 'CYBERPUNK CHRONICLES DUEL',
      round: 'QUARTER-FINALS',
      totalVotes: 3032,
      hasVoted: null,
      contestantA: {
        name: 'DAVID MARTINEZ',
        subName: 'Cyberpunk Edgerunners / Sandevistan',
        votes: 1540,
        accentColor: 'text-neon-yellow',
        avatarCode: 'ダビ',
      },
      contestantB: {
        name: 'SHOTARO KANEDA',
        subName: 'Akira / Neo-Tokyo Capsule Leader',
        votes: 1492,
        accentColor: 'text-cyber-pink',
        avatarCode: '金田',
      }
    },
    {
      id: 'ruby-ai',
      title: 'ASTROLOGICAL IDOL EXTRAVAGANZA',
      round: 'ROUNDS OF 32',
      totalVotes: 7300,
      hasVoted: null,
      contestantA: {
        name: 'RUBY HOSHINO',
        subName: 'Oshi no Ko / B-Komachi Reborn',
        votes: 3820,
        accentColor: 'text-neon-yellow',
        avatarCode: 'ルビ',
      },
      contestantB: {
        name: 'AI HOSHINO',
        subName: 'Oshi no Ko / Ultimate Idol Star',
        votes: 3480,
        accentColor: 'text-cyber-pink',
        avatarCode: 'アイ',
      }
    }
  ];

  const [matchups, setMatchups] = useState<Matchup[]>(() => loadPersistedMatchups(DEFAULT_MATCHUPS));

  // Keep matchups state synced with user login changes
  useEffect(() => {
    setMatchups(loadPersistedMatchups(DEFAULT_MATCHUPS, currentUser?.id));
  }, [currentUser?.id]);

  // Seed data for 3-card Polling Grid
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 'movie-2026',
      title: 'MOST ANTICIPATED MECHA SCIFI',
      category: 'POP-CULTURE',
      description: 'Subnetwork vote for the upcoming summer box office mecha blockbuster adaptations.',
      totalVotes: 1420,
      options: [
        { text: 'GUNDAM METEOR FALL', votes: 680 },
        { text: 'NEO TOKYO RECON', votes: 420 },
        { text: 'NIGHT CITY CHRONICLES', votes: 320 }
      ],
      hostName: 'ARENA_MOD_X',
      is_priority: true,
      comments_enabled: true,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'physics-11',
      title: 'PHYSICS CLASS 11 - ENERGY PROPAGATION',
      category: 'CLASSROOM',
      description: 'Sensei Tanaka live checkpoint quiz: Does speed of light vary when traversing crystalline mediums?',
      totalVotes: 32,
      options: [
        { text: 'YES, DEPENDS ON REFRACTIVE RATIOS', votes: 26 },
        { text: 'NO, CONSTANT UNIVERSALLY', votes: 4 },
        { text: 'ONLY UNDER EM-FIELD INDUCTION', votes: 2 }
      ],
      hostName: 'SENSEI_TANAKA',
      is_priority: false,
      comments_enabled: true,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'community-adapt',
      title: 'NEXT MANGA ADAPTATION ROUNDS',
      category: 'TOURNAMENT',
      description: 'Cooperative polling to nominate the next serialized visual novel adapted for tournament brackets.',
      totalVotes: 5122,
      options: [
        { text: 'CHAINSAW MAN REZE ARC', votes: 2422 },
        { text: 'SOLO LEVELING SEQUELS', votes: 2100 },
        { text: 'VAGABOND CHRONICLES VOL 1', votes: 600 }
      ],
      hostName: 'COMMUNITY_CORE',
      is_priority: true,
      comments_enabled: true,
      created_at: new Date(Date.now() - 10800000).toISOString()
    }
  ]);

  // Handle Mute Button Toggle
  const handleToggleMute = () => {
    const isNowMuted = sounds.toggleMute();
    setIsMuted(isNowMuted);
  };

  // Play entry chime on load and scan direct routing links
  useEffect(() => {
    sounds.playSelect();
    
    const path = window.location.pathname;
    if (path.includes('/tournament/')) {
      const parts = path.split('/tournament/');
      const tournamentId = parts[parts.length - 1];
      if (tournamentId) {
        setTimeout(() => {
          const el = document.getElementById(`poll-card-${tournamentId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('flash-neon-glow');
            setTimeout(() => {
              el.classList.remove('flash-neon-glow');
            }, 4000);
          }
        }, 1800);
      }
    }
  }, []);

  // Synchronous vote applicator based on loaded list
  const applyVotesToPollsSync = (loadedPolls: Poll[], currentUserId?: string) => {
    const uId = currentUserId || currentUser?.id || 'guest';
    const userVotes = getUserCastVotes(uId);
    const localStats = getAllPollStats();
    const pollLikes = getPollLikes();

    const voteMap = new Map<string, number>();
    Object.entries(userVotes).forEach(([pId, optIndex]) => {
      if (typeof optIndex === 'number') {
        voteMap.set(pId, optIndex);
      }
    });

    return loadedPolls.map(p => {
      let updatedPoll = { ...p };

      // Overwrite options & totalVotes for any poll that has persisted stats
      if (localStats[p.id]) {
        updatedPoll.options = localStats[p.id].options;
        updatedPoll.totalVotes = localStats[p.id].totalVotes;
      }

      if (pollLikes[p.id] !== undefined) {
        const base = p.likes || (p.totalVotes > 0 ? Math.floor(p.totalVotes * 0.4) : 0);
        updatedPoll.likes = base + pollLikes[p.id];
      }

      const numId = hashToBigint(p.id).toString();
      if (voteMap.has(p.id)) {
        updatedPoll.votedIndex = voteMap.get(p.id);
      } else if (voteMap.has(numId)) {
        updatedPoll.votedIndex = voteMap.get(numId);
      } else {
        // If the user hasn't voted on this poll, make sure votedIndex is undefined
        updatedPoll.votedIndex = undefined;
      }

      return updatedPoll;
    });
  };

  // ASYNC DB VOTE SYNCER: fetches user votes from DB and updates state & localStorage cache
  const syncDbVotes = async (currentUserId: string) => {
    if (!currentUserId || currentUserId === 'guest') return;
    try {
      const { data: dbVotes, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', currentUserId);

      if (error) {
        console.warn('Could not fetch DB votes:', error.message);
        return;
      }

      if (dbVotes && dbVotes.length > 0) {
        dbVotes.forEach((v: any) => {
          const optStr = v.selected_option || v.candidate_option;
          if (optStr !== undefined && optStr !== null) {
            const parsed = parseInt(optStr, 10);
            if (!isNaN(parsed)) {
              saveUserCastVote(currentUserId, v.tournament_id.toString(), parsed);
            }
          }
        });

        // Update state consistently with local stats and votes
        setPolls(prev => applyVotesToPollsSync(prev, currentUserId));
      }
    } catch (err) {
      console.error('syncDbVotes error:', err);
    }
  };

  // Fetch polls from Supabase if table exists
  const fetchPolls = async () => {
    try {
      let mapped: Poll[] = [];

      // 1. Fetch from Supabase polls table if available
      try {
        const { data: dbPolls, error } = await supabase
          .from('polls')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch polls from Supabase, relying on local streams:', error.message);
        } else if (dbPolls && dbPolls.length > 0) {
          mapped = dbPolls.map((p: any) => ({
            id: p.id,
            title: p.title,
            category: p.category,
            description: p.description,
            totalVotes: p.total_votes || p.totalVotes || 0,
            options: p.options || [],
            votedIndex: p.voted_index !== undefined ? p.voted_index : p.votedIndex,
            hostName: p.host_name || p.hostName || 'GATEKEEPER',
            is_priority: p.is_priority || false,
            is_spotlight: p.is_spotlight || false,
            is_pending_verification: p.is_pending_verification || false,
            verification_utr: p.verification_utr || '',
            created_at: p.created_at,
            expires_at: p.expires_at,
            user_id: p.user_id
          }));
        }
      } catch (dbErr) {
        console.warn('Database query bypassed or failed:', dbErr);
      }

      // 2. Fetch from localStorage hosted fallback copy to prevent losing self-hosted arenas
      let localCustomPolls: Poll[] = [];
      try {
        const stored = localStorage.getItem('vote_arena_hosted_polls');
        if (stored) {
          localCustomPolls = JSON.parse(stored);
        }
      } catch (localErr) {
        console.warn('Failed to recover locally hosted polls from storage:', localErr);
      }

      // Combine database streams, local hosted streams, and custom photo/video media posts
      const customPosts = getCustomPosts();
      const combined = [...customPosts, ...mapped, ...localCustomPolls];

      // Filter out any expired polls
      const activeCombined = combined.filter((poll: Poll) => {
        if (poll.expires_at) {
          const hasExpired = new Date() > new Date(poll.expires_at);
          return !hasExpired;
        }
        return true;
      });

      // Update state with de-duplicated polls, preserving local initial seeds as fallback
      setPolls(prev => {
        const seen = new Set<string>();
        // First, add all active combined polls (DB + localStorage) which are fresh
        const uniqueMapped = activeCombined.filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        const existingIds = new Set(uniqueMapped.map(p => p.id));
        // Keep initial seed polls if they are not overridden by fetched polls
        const uniqueSeed = prev.filter(p => !existingIds.has(p.id));
        const finalCombined = [...uniqueMapped, ...uniqueSeed];
        
        const finalSeen = new Set<string>();
        const merged = finalCombined.filter(p => {
          if (finalSeen.has(p.id)) return false;
          finalSeen.add(p.id);
          return true;
        });
        return applyVotesToPollsSync(merged);
      });
    } catch (err) {
      console.error('Fetch polls error:', err);
    }
  };

  const fetchActivePolls = async () => {
    // Refresh polls safely with persistent votes and stats
    await fetchPolls();
  };

  useEffect(() => {
    fetchPolls();
    fetchActivePolls();
    setPolls(prev => applyVotesToPollsSync(prev));
  }, []);

  // Sync user database votes whenever logged in ID changes
  useEffect(() => {
    if (currentUser?.id) {
      syncDbVotes(currentUser.id);
    } else {
      setPolls(prev => applyVotesToPollsSync(prev, 'guest'));
    }
  }, [currentUser?.id]);

  // 1. UNIFIED VOTE HANDLER: Works for Featured, Spotlight, AND Standard Grids
  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!currentUser) {
      sounds.playError();
      alert("AUTHENTICATION REQUIRED // Log in to participate in the arena.");
      return;
    }

    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll) return;

    // Check 1: In-memory state check
    if (targetPoll.votedIndex !== undefined) {
      sounds.playError();
      alert("ALREADY VOTED // You have already cast a vote on this poll. Please undo your previous vote if you wish to change it.");
      return;
    }

    // Check 2: Local storage check
    const uId = currentUser.id || 'guest';
    const localVotes = getUserCastVotes(uId);
    const numId = hashToBigint(pollId).toString();

    if (localVotes[pollId] !== undefined || localVotes[numId] !== undefined) {
      sounds.playError();
      alert("ALREADY VOTED // You have already cast a vote on this poll. Please undo your previous vote if you wish to change it.");
      return;
    }

    // Check 3: Database votes cache check
    const dbVoteExists = (allVotes || []).some(
      v => v.user_id === currentUser.id && (v.tournament_id === pollId || v.tournament_id?.toString() === numId)
    );
    if (dbVoteExists) {
      sounds.playError();
      alert("ALREADY VOTED // You have already cast a vote on this poll. Please undo your previous vote if you wish to change it.");
      return;
    }

    // Optimistically update the option's vote
    const updatedOptions = [...targetPoll.options];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      votes: (updatedOptions[optionIndex].votes || 0) + 1
    };
    const totalVotes = (targetPoll.totalVotes || 0) + 1;

    // 1. Save poll stats permanently in unified storage
    savePollStats(pollId, updatedOptions, totalVotes);

    // 2. Save user cast vote permanently
    saveUserCastVote(uId, pollId, optionIndex);
    saveUserCastVote(uId, numId, optionIndex);

    // 3. Sync to Supabase votes table asynchronously
    syncVoteToSupabase(currentUser.id, pollId, optionIndex);

    // 4. Update local React state immediately
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: updatedOptions,
        votedIndex: optionIndex,
        totalVotes
      };
    }));

    // 5. Synchronize to hosted polls fallback
    try {
      const stored = localStorage.getItem('vote_arena_hosted_polls');
      if (stored) {
        const localPolls = JSON.parse(stored);
        const updated = localPolls.map((p: any) => {
          if (p.id !== pollId) return p;
          return {
            ...p,
            options: updatedOptions,
            totalVotes,
            votedIndex: optionIndex
          };
        });
        localStorage.setItem('vote_arena_hosted_polls', JSON.stringify(updated));
      }
    } catch (e) {}

    fetchAllVotes();
    alert("SUCCESS // Vote anchored to the grid.");
  };

  const handleRemoveVote = async (pollId: string) => {
    if (!currentUser) {
      sounds.playError();
      alert("AUTHENTICATION REQUIRED // Log in to participate in the arena.");
      return;
    }

    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll || targetPoll.votedIndex === undefined) return;

    const optionIndex = targetPoll.votedIndex;

    const updatedOptions = [...targetPoll.options];
    if (updatedOptions[optionIndex]) {
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        votes: Math.max(0, (updatedOptions[optionIndex].votes || 0) - 1)
      };
    }
    const totalVotes = Math.max(0, (targetPoll.totalVotes || 0) - 1);
    const uId = currentUser.id || 'guest';
    const numId = hashToBigint(pollId).toString();

    // 1. Persist updated poll stats
    savePollStats(pollId, updatedOptions, totalVotes);

    // 2. Remove user cast vote locally
    removeUserCastVote(uId, pollId);
    removeUserCastVote(uId, numId);

    // 3. Remove vote from Supabase
    removeVoteFromSupabase(currentUser.id, pollId);

    // 4. Update React state
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: updatedOptions,
        votedIndex: undefined,
        totalVotes
      };
    }));

    // 5. Update local hosted polls copy
    try {
      const stored = localStorage.getItem('vote_arena_hosted_polls');
      if (stored) {
        const localPolls = JSON.parse(stored);
        const updated = localPolls.map((p: any) => {
          if (p.id !== pollId) return p;
          return {
            ...p,
            options: updatedOptions,
            totalVotes,
            votedIndex: undefined
          };
        });
        localStorage.setItem('vote_arena_hosted_polls', JSON.stringify(updated));
      }
    } catch (e) {}

    fetchAllVotes();
    alert("SUCCESS // Vote retracted from the grid.");
  };

  // 2. UNIFIED PERSISTENT SPOTLIGHT ACTIVATOR
  const activateSpotlight = async (pollId: string) => {
    const isNumericId = /^\d+$/.test(pollId);

    if (isNumericId) {
      // Update the database record directly so it stays spotlighted after refresh
      const { error } = await supabase
        .from('shared_polls')
        .update({ 
          is_featured: true, 
          spotlight_activated_at: new Date().toISOString() 
        })
        .eq('id', pollId);

      // Also update the polls table to set is_spotlight=true so it is spotlighted everywhere
      try {
        await supabase
          .from('polls')
          .update({ is_spotlight: true })
          .eq('id', pollId);
      } catch (e) {
        console.warn("Polls table spotlight update warning:", e);
      }

      if (error) {
        console.error("SPOTLIGHT SYNC ERROR:", error.message);
        alert("FAILED // Subnet failed to anchor spotlight status.");
        return;
      }
    }

    // Also update local state instantly
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        return { ...p, is_spotlight: true };
      }
      return p;
    }));

    if (isNumericId) {
      fetchActivePolls(); // Forces the UI to re-render with the permanent spotlight status
    }
  };

  const [comments, setComments] = useState<DbComment[]>(() => loadComments());
  const [follows, setFollows] = useState<DbFollow[]>([]);

  // Keep comments in sync reactively across tabs and components
  useEffect(() => {
    const handleCommentsUpdate = () => {
      setComments(loadComments());
    };
    window.addEventListener('vote-arena-comments-updated', handleCommentsUpdate);
    return () => window.removeEventListener('vote-arena-comments-updated', handleCommentsUpdate);
  }, []);

  // Load local or remote follows & comments
  useEffect(() => {
    const fetchFollowsAndComments = async () => {
      // 1. Fetch Follows
      try {
        const { data: dbFollows, error } = await supabase
          .from('follows')
          .select('*');
        if (!error && dbFollows && dbFollows.length > 0) {
          const uniqueDbFollows: DbFollow[] = [];
          const seen = new Set<string>();
          for (const f of dbFollows) {
            if (!seen.has(f.id)) {
              seen.add(f.id);
              uniqueDbFollows.push(f);
            }
          }
          setFollows(uniqueDbFollows);
        } else {
          const localFollows = safeLocalStorage.getItem('vote_arena_follows');
          if (localFollows) {
            setFollows(JSON.parse(localFollows));
          } else {
            const initialFollows: DbFollow[] = [
              { id: 'f-seed-1', follower_id: currentUser?.id || 'guest', following_id: 'ARENA_MOD_X', created_at: new Date().toISOString(), following_username: 'ARENA_MOD_X' },
              { id: 'f-seed-2', follower_id: currentUser?.id || 'guest', following_id: 'SENSEI_TANAKA', created_at: new Date().toISOString(), following_username: 'SENSEI_TANAKA' }
            ];
            setFollows(initialFollows);
            safeLocalStorage.setItem('vote_arena_follows', JSON.stringify(initialFollows));
          }
        }
      } catch (err) {
        const localFollows = safeLocalStorage.getItem('vote_arena_follows');
        if (localFollows) setFollows(JSON.parse(localFollows));
      }

      // 2. Load Comments safely from unified storage
      setComments(loadComments());
    };

    fetchFollowsAndComments();
  }, [currentUser?.id]);

  const handleFollow = async (followingId: string, followingUsername: string) => {
    if (!currentUser) {
      sounds.playError();
      alert("PLEASE SECURE LOG-IN ACCESS TO FOLLOW OPERATORS.");
      return;
    }
    const followerId = currentUser.id || 'guest';
    
    // Check if already following
    if (follows.some(f => f.follower_id === followerId && f.following_id === followingId)) {
      return;
    }

    const newFollow: DbFollow = {
      id: `f-${Date.now()}`,
      follower_id: followerId,
      following_id: followingId,
      created_at: new Date().toISOString(),
      follower_username: currentUser.username,
      following_username: followingUsername
    };

    setFollows(prev => {
      if (prev.some(f => f.id === newFollow.id || (f.follower_id === newFollow.follower_id && f.following_id === newFollow.following_id))) {
        return prev;
      }
      const updated = [...prev, newFollow];
      safeLocalStorage.setItem('vote_arena_follows', JSON.stringify(updated));
      return updated;
    });
    sounds.playSelect();
    addHistoryItem('SOCIAL PROTOCOL ENGAGED', `Began following operator "${followingUsername.toUpperCase()}".`);

    try {
      await supabase
        .from('follows')
        .insert([
          {
            id: newFollow.id,
            follower_id: followerId,
            following_id: followingId,
            created_at: newFollow.created_at,
            follower_username: newFollow.follower_username,
            following_username: newFollow.following_username
          }
        ]);
    } catch (err) {
      console.warn("Supabase insert for follows failed, synchronized locally.");
    }
  };

  const handleUnfollow = async (followingId: string) => {
    if (!currentUser) return;
    const followerId = currentUser.id || 'guest';
    const following = follows.find(f => f.follower_id === followerId && f.following_id === followingId);
    const followingName = following?.following_username || 'Operator';

    setFollows(prev => {
      const updated = prev.filter(f => !(f.follower_id === followerId && f.following_id === followingId));
      safeLocalStorage.setItem('vote_arena_follows', JSON.stringify(updated));
      return updated;
    });
    sounds.playError();
    addHistoryItem('SOCIAL PROTOCOL TERMINATED', `Unfollowed operator "${followingName.toUpperCase()}".`);

    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
    } catch (err) {
      console.warn("Supabase delete for follows failed, synchronized locally.");
    }
  };

  const handleAddComment = async (pollId: string, text: string) => {
    if (!currentUser) {
      sounds.playError();
      alert("PLEASE SECURE LOG-IN ACCESS TO TRANSMIT PUBLIC COMMENTS.");
      return;
    }
    const userId = currentUser.id || 'guest';
    const newComment: DbComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      poll_id: pollId,
      user_id: userId,
      text: text.trim(),
      created_at: new Date().toISOString(),
      username: currentUser.username,
      avatar: currentUser.avatar
    };

    const updated = saveComment(newComment);
    setComments(updated);
    sounds.playPunchyCTA();
    addHistoryItem('TRANSMITTED COMMENT', `Posted comment on arena stream ID: ${pollId}.`);
  };

  // Handle Spotlight Matchup Vote Injection
  const handleSpotlightVote = (matchupId: string, choice: 'A' | 'B') => {
    sounds.playImpact();
    setMatchups(prev => saveMatchupVote(matchupId, choice, prev, currentUser?.id));
    const targetMatch = matchups.find(m => m.id === matchupId);
    const chosenContestant = choice === 'A' ? targetMatch?.contestantA.name : targetMatch?.contestantB.name;
    addHistoryItem('MATCHUP VOTE', `Cast bracket vote for ${chosenContestant || choice} in matchup "${targetMatch?.title || matchupId}".`);
  };

  // Handle Live Poll Vote Submission
  const handlePollVote = async (pollId: string, optionIndex: number) => {
    await handleVote(pollId, optionIndex);
  };

  // Handle adding custom launch poll
  const handleAddPoll = async (newPoll: Poll) => {
    try {
      const { error } = await supabase
        .from('polls')
        .insert([
          {
            id: newPoll.id,
            title: newPoll.title,
            category: newPoll.category,
            description: newPoll.description,
            options: newPoll.options,
            host_name: newPoll.hostName,
            is_priority: newPoll.is_priority || false,
            is_spotlight: newPoll.is_spotlight || false,
            is_pending_verification: newPoll.is_pending_verification || false,
            verification_utr: newPoll.verification_utr || null,
            created_at: newPoll.created_at || new Date().toISOString(),
            expires_at: newPoll.expires_at || null,
            user_id: newPoll.user_id || null
          }
        ]);
      if (error) {
        console.warn('Could not insert poll into Supabase. Table may not exist yet:', error.message);
      }
    } catch (err) {
      console.error('Supabase poll insert error:', err);
    }

    // Try-catch block for tournaments table to satisfy exact prompt database specification
    try {
      await supabase
        .from('tournaments')
        .insert([
          {
            id: newPoll.id,
            title: newPoll.title,
            category: newPoll.category,
            description: newPoll.description,
            options: newPoll.options,
            host_name: newPoll.hostName,
            is_priority: newPoll.is_priority || false,
            is_spotlight: newPoll.is_spotlight || false,
            is_pending_verification: newPoll.is_pending_verification || false,
            verification_utr: newPoll.verification_utr || null,
            created_at: newPoll.created_at || new Date().toISOString(),
            expires_at: newPoll.expires_at || null,
            user_id: newPoll.user_id || null
          }
        ]);
    } catch (tourneyErr) {
      console.warn('Silent skip: Supabase tournaments table is currently not provisioned. Defaulting to polls database fallback.');
    }

    // Also support inserting into shared_polls in case it is configured
    try {
      await supabase
        .from('shared_polls')
        .insert([
          {
            id: newPoll.id,
            user_id: newPoll.user_id || null,
            question: newPoll.title,
            options: (newPoll.options || []).map(opt => opt.text),
            duration_hours: 1,
            expires_at: newPoll.expires_at || null,
            created_at: newPoll.created_at || new Date().toISOString()
          }
        ]);
    } catch (sharedErr) {
      // ignore
    }

    setPolls(prev => {
      const combined = [newPoll, ...prev];
      const finalSeen = new Set<string>();
      return combined.filter(p => {
        if (finalSeen.has(p.id)) return false;
        finalSeen.add(p.id);
        return true;
      });
    });

    // Also store in localStorage and unified stats as a high-reliability fallback to survive refreshes
    savePollStats(newPoll.id, newPoll.options, newPoll.totalVotes || 0);
    try {
      const stored = localStorage.getItem('vote_arena_hosted_polls');
      const localPolls = stored ? JSON.parse(stored) : [];
      localPolls.push(newPoll);
      localStorage.setItem('vote_arena_hosted_polls', JSON.stringify(localPolls));
    } catch (e) {
      console.warn('Could not save custom poll to localStorage:', e);
    }

    addHistoryItem('LAUNCHED ROOM POLL', `Provisioned custom interactive poll titled "${newPoll.title}".`);
  };

  // Secure Creator-Only Deletion Protocol
  const handleDeletePoll = async (pollId: string, creatorId: string) => {
    // Hard check: Ensure the operator trying to delete actually owns the record
    if (currentUser?.id !== creatorId) {
      sounds.playError();
      alert("SECURITY VIOLATION // You do not possess structural ownership of this poll node.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to permanently scrap this poll from the grid?");
    if (!confirmDelete) return;

    try {
      // 1. Delete from 'polls'
      const { error: error1 } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      // 2. Delete from 'tournaments' if provisioned
      try {
        await supabase
          .from('tournaments')
          .delete()
          .eq('id', pollId);
      } catch (e) {}

      // 3. Delete from 'shared_polls' if provisioned
      try {
        await supabase
          .from('shared_polls')
          .delete()
          .eq('id', pollId);
      } catch (e) {}

      // Also delete from localStorage hosted fallback
      try {
        const stored = localStorage.getItem('vote_arena_hosted_polls');
        if (stored) {
          const localPolls = JSON.parse(stored);
          const updated = localPolls.filter((p: any) => p.id !== pollId);
          localStorage.setItem('vote_arena_hosted_polls', JSON.stringify(updated));
        }
      } catch (e) {}

      if (error1) {
        console.warn("Delete error on polls:", error1.message);
      }

      // Update local state instantly to purge from UI
      setPolls(prev => prev.filter(p => p.id !== pollId));
      addHistoryItem('PURGED POLL NODE', `Permanently purged poll stream ID: ${pollId}.`);
      sounds.playImpact();
      alert("NODE SUCCESSFULLY PURGED FROM THE MATRIX.");
    } catch (err: any) {
      sounds.playError();
      alert(`DELETE ERROR // Subnet failed to purge: ${err.message || err}`);
    }
  };

  // Trigger fighting-game style screen impact shake
  const triggerScreenShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  // Filtered polls incorporating real-time query match
  const filteredPolls = polls.filter(p => {
    // Filter out if expired
    if (p.expires_at) {
      const hasExpired = new Date() > new Date(p.expires_at);
      if (hasExpired) return false;
    }

    const categoryMatches = activeCategoryFilter === 'ALL' || p.category === activeCategoryFilter;
    if (!categoryMatches) return false;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatches = p.title.toLowerCase().includes(query);
      const descMatches = p.description.toLowerCase().includes(query);
      const categoryTextMatches = p.category.toLowerCase().includes(query);
      const hostMatches = (p.hostName || '').toLowerCase().includes(query);
      return titleMatches || descMatches || categoryTextMatches || hostMatches;
    }

    return true;
  });

  // Framer Motion Animation Variants
  const navbarVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 20 }
    }
  };

  const heroTitleVariants = {
    hidden: { skewX: -20, opacity: 0, scale: 0.95 },
    visible: { 
      skewX: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12, delay: 0.25 }
    }
  };

  const shakeVariants = {
    shaking: {
      x: [-12, 12, -10, 10, -6, 6, -3, 3, 0],
      y: [-6, 6, -5, 5, -3, 3, -1, 1, 0],
      rotate: [-1.5, 1.5, -1, 1, -0.5, 0.5, 0],
      transition: { duration: 0.45, ease: 'easeInOut' }
    },
    static: { x: 0, y: 0, rotate: 0 }
  };

  return (
    <motion.div 
      variants={shakeVariants}
      animate={isShaking ? "shaking" : "static"}
      className="relative min-h-screen bg-[#fdfdfd] text-gray-950 font-sans selection:bg-shonen-orange selection:text-white overflow-x-hidden flex flex-col"
    >
      {/* 2-SECOND VELGRE SPLASH SCREEN */}
      <AnimatePresence>
        {isSplashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.05,
              filter: 'blur(8px)',
              transition: { duration: 0.5, ease: 'easeOut' }
            }}
            className="fixed inset-0 bg-gradient-to-b from-[#FFF5F7] via-[#FFF9FB] to-[#FFF0F4] z-[100] flex flex-col items-center justify-center select-none overflow-hidden"
          >
            {/* Soft ambient glow */}
            <div className="absolute inset-0 bg-radial-at-c from-pink-200/40 via-transparent to-pink-100/30 pointer-events-none" />

            <div className="relative text-center px-4 max-w-xl">
              {/* Top status tag */}
              <div className="inline-flex items-center gap-2 text-xs font-bold text-pink-600 bg-pink-100/80 border border-pink-200 px-4 py-1.5 rounded-full mb-6 shadow-xs animate-bounce">
                <span>🌸</span>
                <span>SWEET ANIME COMMUNITY &bull; VELGRE</span>
                <span>✨</span>
              </div>

              {/* VELGRE Kawaii display */}
              <div className="relative mb-4">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 select-none drop-shadow-sm font-sans">
                  VELGRE 🌸
                </h1>
              </div>

              <div className="text-xs text-pink-400 font-bold tracking-widest uppercase mb-10">
                <span>Sweet Polls &bull; Anime Clashes &bull; Taste Resonance</span>
              </div>

              {/* Animated high-density progress loading bar */}
              <div className="w-64 mx-auto h-2 bg-pink-100 rounded-full overflow-hidden p-[2px] relative mb-4 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.8, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 rounded-full shadow-[0_0_10px_rgba(255,101,132,0.5)]"
                />
              </div>

              {/* Status details */}
              <div className="text-xs text-pink-400 font-medium space-y-1">
                <p className="animate-pulse">🌸 Gathering sweet polls & sakura petals... ✨</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Background effects */}
      <CyberGrid />

      {/* FIXED RETRO TICKER MARQUEE AT VERY TOP */}
      <div className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 text-white py-1.5 overflow-hidden whitespace-nowrap z-40 select-none shadow-xs font-bold text-xs relative">
        <div className="inline-block animate-marquee tracking-wide">
          🌸 Welcome to Velgre ✦ Cast your votes in real-time anime matchups ✦ Share sweet photos & videos ✦ Discover your anime taste soulmates ✦ Fast, lag-free and adorable 💖 ✦ Live tournament spotlight active ✦ Stay kind and have fun 🌸
          🌸 Welcome to Velgre ✦ Cast your votes in real-time anime matchups ✦ Share sweet photos & videos ✦ Discover your anime taste soulmates ✦ Fast, lag-free and adorable 💖 ✦ Live tournament spotlight active ✦ Stay kind and have fun 🌸
        </div>
      </div>

      {/* 1. KAWAII NAVBAR */}
      <motion.nav 
        variants={navbarVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-pink-100 px-4 md:px-8 py-3 flex justify-between items-center z-40 shadow-xs"
      >
        {/* Left Logo */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sounds.playSelect();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 text-white px-4 py-1.5 rounded-full font-black text-xl tracking-tight shadow-md flex items-center gap-1.5 select-none"
          >
            <span>🌸</span>
            <span>VELGRE</span>
          </motion.div>
          <div className="text-pink-400 text-xs font-bold hidden lg:flex items-center gap-1 ml-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Community Online</span>
          </div>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-3 text-xs font-bold">
          <a 
            href="#bracket-spotlight" 
            onClick={() => sounds.playTick()}
            className="text-gray-600 hover:text-pink-600 hover:bg-pink-50/70 px-3.5 py-1.5 rounded-full transition-all"
          >
            🏆 Tournaments
          </a>
          <a 
            href="#live-polls" 
            onClick={() => sounds.playTick()}
            className="text-gray-600 hover:text-pink-600 hover:bg-pink-50/70 px-3.5 py-1.5 rounded-full transition-all"
          >
            🌸 Live Polls
          </a>
          <button 
            onClick={() => {
              sounds.playTick();
              setActiveCategoryFilter('CLASSROOM');
              const el = document.getElementById('live-polls');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-gray-600 hover:text-pink-600 hover:bg-pink-50/70 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
          >
            🎒 Classroom
          </button>
        </div>

        {/* Search component */}
        <div className="relative max-w-[150px] sm:max-w-[200px] lg:max-w-xs w-full ml-4 mr-auto hidden sm:block">
          <div className="relative">
            <input
              type="text"
              value={navSearch}
              onChange={(e) => handleNavSearch(e.target.value)}
              placeholder="Search creators..."
              className="w-full bg-pink-50/50 border border-pink-200 hover:border-pink-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 py-1.5 pl-8 pr-3 text-xs text-gray-800 focus:outline-none transition-all placeholder-pink-300 rounded-full"
            />
            <Search className="w-3.5 h-3.5 text-pink-400 absolute left-2.5 top-2.5 pointer-events-none" />
            
            {/* Clear button */}
            {navSearch && (
              <button
                onClick={() => {
                  sounds.playTick();
                  handleNavSearch('');
                }}
                className="absolute right-2.5 top-2 text-xs text-pink-400 hover:text-pink-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Results Overlay Dropdown */}
          <AnimatePresence>
            {navSearchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border border-pink-200 rounded-2xl mt-2 p-2 space-y-1 z-50 max-h-48 overflow-y-auto shadow-lg"
              >
                {navSearchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedProfile(p);
                      setIsProfileModalOpen(true);
                      handleNavSearch('');
                    }}
                    className="p-2 bg-pink-50/40 hover:bg-pink-100/60 rounded-xl transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div className="min-w-0 pr-1 text-left">
                      <span className="text-xs font-bold text-gray-800 block truncate">
                        {p.username}
                      </span>
                      <span className="text-[10px] text-pink-500 block">
                        🌸 #{p.id.slice(0, 6)}
                      </span>
                    </div>
                    <span className="text-[10px] text-pink-600 font-bold shrink-0">
                      Profile 🌸
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right CTA Actions & Mute button */}
        <div className="flex items-center gap-2">
          {/* PROFILE / AUTH */}
          {currentUser ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                sounds.playSelect();
                setIsAuthOpen(true);
              }}
              className="bg-white border border-pink-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 transition-all hover:bg-pink-50 shadow-xs cursor-pointer"
            >
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Profile avatar" className="w-5 h-5 rounded-full border border-pink-200 object-cover shrink-0" />
              ) : (
                <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-pulse shrink-0" />
              )}
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentUser.username}</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                sounds.playSelect();
                setIsAuthOpen(true);
              }}
              className="bg-pink-50 border border-pink-200 text-pink-600 hover:bg-pink-500 hover:text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs"
            >
              🌸 Sign In
            </motion.button>
          )}

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => {
                sounds.playSelect();
                setIsNotificationOpen(true);
                markNotificationsAsSeen();
              }}
              title="Notifications"
              className="w-9 h-9 rounded-full border border-pink-200 bg-white hover:bg-pink-50 text-pink-500 hover:text-pink-600 transition-all flex items-center justify-center relative cursor-pointer shadow-xs"
            >
              <Bell className="w-4 h-4" />
              {getUnreadMentionsCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce border border-white shadow-xs">
                  {getUnreadMentionsCount()}
                </span>
              )}
            </button>
          </div>

          {/* DIRECT MESSAGES ICON */}
          <div className="relative">
            <button
              onClick={() => {
                sounds.playSelect();
                window.dispatchEvent(new CustomEvent('open-combat-comms'));
              }}
              title="Messages & Chat"
              className="w-9 h-9 rounded-full border border-pink-200 bg-white hover:bg-pink-50 text-pink-500 hover:text-pink-600 transition-all flex items-center justify-center relative cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse border border-white shadow-xs">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>

          {/* TASTE MATCHER BUTTON */}
          <div className="relative">
            <button
              onClick={() => {
                sounds.playFanfare();
                setTasteMatcherTarget(null);
                setIsTasteMatcherOpen(true);
              }}
              title="Two-Way Anime Taste Matcher"
              className="px-3 py-1.5 border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 hover:from-pink-500 hover:to-rose-400 hover:text-white transition-all duration-200 rounded-full relative cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
              <span className="hidden sm:inline">Taste Matcher</span>
              {(() => {
                const pendingCount = getTasteRequests().filter(
                  r => r.to_user_id === (currentUser?.id || 'guest') && r.status === 'pending'
                ).length;
                return pendingCount > 0 ? (
                  <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-bounce border border-white">
                    {pendingCount}
                  </span>
                ) : null;
              })()}
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
            className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs ${
              isMuted 
                ? 'border-gray-200 text-gray-400 bg-white hover:border-pink-200' 
                : 'border-pink-200 text-pink-500 bg-white hover:bg-pink-50'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Launch Room / Post Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => sounds.playHoverLaunch()}
            onClick={() => {
              sounds.playSelect();
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 hover:opacity-95 text-white text-xs font-bold px-4 sm:px-5 py-2 rounded-full uppercase tracking-wider transition-all duration-200 shadow-[0_4px_16px_rgba(255,101,132,0.35)] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-100" />
            <span>✨ Post / Poll</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* SYSTEM ADVICE BANNER */}
      <div className="bg-gradient-to-r from-pink-50/80 via-white to-pink-50/80 border-b border-pink-100 py-2.5 px-4 text-center select-none z-30 relative shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-pink-600">
          <span>🌸</span>
          <span>
            Welcome to Velgre! Vote in polls, share adorable anime moments, and find people with your exact taste! 💖
          </span>
          <span>🌸</span>
        </div>
      </div>

      {/* INSTAGRAM STORIES ROW */}
      <div className="w-full bg-white/80 backdrop-blur-xs border-b border-pink-100 py-4 select-none z-30 relative overflow-x-auto scrollbar-none shadow-xs">
        <div className="max-w-4xl mx-auto px-4 flex gap-6 items-center">
          <div className="text-xs font-bold text-pink-400 uppercase tracking-wider pr-4 border-r border-pink-100 shrink-0">
            🌸 Community<br/>Stories
          </div>
          
          <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-none shrink-0">
            {/* Story 1: ALL MATCHES */}
            <div 
              onClick={() => {
                sounds.playSelect();
                setActiveCategoryFilter('ALL');
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${activeCategoryFilter === 'ALL' ? 'insta-story-ring' : 'bg-pink-100'}`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                  🌸
                </div>
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${activeCategoryFilter === 'ALL' ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-600'}`}>
                All Polls
              </span>
            </div>

            {/* Story 2: POP-CULTURE */}
            <div 
              onClick={() => {
                sounds.playSelect();
                setActiveCategoryFilter('POP-CULTURE');
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${activeCategoryFilter === 'POP-CULTURE' ? 'insta-story-ring' : 'bg-pink-100'}`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                  ✨
                </div>
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${activeCategoryFilter === 'POP-CULTURE' ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-600'}`}>
                Pop Culture
              </span>
            </div>

            {/* Story 3: CLASSROOM */}
            <div 
              onClick={() => {
                sounds.playSelect();
                setActiveCategoryFilter('CLASSROOM');
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${activeCategoryFilter === 'CLASSROOM' ? 'insta-story-ring' : 'bg-pink-100'}`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                  🎒
                </div>
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${activeCategoryFilter === 'CLASSROOM' ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-600'}`}>
                Classroom
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative w-full max-w-6xl mx-auto px-4 py-14 md:py-18 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="max-w-2xl">
            {/* Big Bold Headline */}
            <motion.h1 
              variants={heroTitleVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-6xl md:text-6xl font-black tracking-tight leading-tight mb-3 text-gray-900"
            >
              VELGRE. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500">
                SWEET ANIME POLLS & VOTING 🌸
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xl font-medium"
            >
              Vote in adorable anime character clashes, share your favorite photos and videos, and run the two-way anime taste matcher to find your soulmates! 💖
            </motion.p>

            {/* Cute Anime Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2.5"
            >
              <span className="bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
                ✨ Anime Matchups & Resonance
              </span>
              <span className="bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-spin-slow" />
                Vote, Post & Discover Friends 🌸
              </span>
            </motion.div>
          </div>

          {/* Two CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            {/* Enter Pop-Culture Button */}
            <motion.a
              href="#bracket-spotlight"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => sounds.playPunchyCTA()}
              className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-8 py-4 font-bold rounded-full text-sm shadow-[0_6px_20px_rgba(255,101,132,0.35)] hover:shadow-[0_8px_25px_rgba(255,101,132,0.5)] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🌸 Explore Matchups</span>
            </motion.a>

            {/* Classroom control button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                sounds.playPunchyCTA();
                setActiveCategoryFilter('CLASSROOM');
                const el = document.getElementById('live-polls');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 px-8 py-4 font-bold rounded-full text-sm shadow-xs transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-pink-500" /> 
              <span>Classroom Polls</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* STYLISH CUTE BANNER DIVIDER */}
      <div className="w-full relative py-4 bg-gradient-to-r from-pink-50/60 via-purple-50/40 to-pink-50/60 border-y border-pink-100 select-none overflow-hidden my-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 relative z-10 text-xs font-bold text-pink-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500 animate-spin-slow" />
            <span>🌸 Real-Time Polls & Community Voting</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✨ 100% Safe, Friendly & Kind Community</span>
          </div>
          <div className="flex items-center gap-2 text-purple-600">
            <span>💖 Two-Way Anime Taste Matcher Ready</span>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE BRACKET SPOTLIGHT (Fighter selects) */}
      <ActiveBracketSpotlight 
        matchups={matchups} 
        onVote={handleSpotlightVote}
        triggerScreenShake={triggerScreenShake}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* FILTER CONTROL TAB BAR FOR POLLS */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-16 z-10 space-y-6">
        <div className="border-b-2 border-gray-200 flex flex-col md:flex-row justify-between items-stretch md:items-end pb-3 gap-4">
          <h3 className="font-mono text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1">
            <Layers className="w-4 h-4 text-shonen-orange" /> SUBNETWORK TUNER
          </h3>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'POP-CULTURE', 'CLASSROOM', 'TOURNAMENT'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  sounds.playTick();
                  setActiveCategoryFilter(filter);
                }}
                className={`font-mono text-[10px] md:text-xs font-bold px-3 py-1.5 border-2 transition-all duration-200 clip-diagonal-reverse ${
                  activeCategoryFilter === filter
                    ? 'bg-shonen-orange text-white border-shonen-orange shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-shonen-orange hover:border-shonen-orange'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* NEON-STYLED CYBERPUNK SEARCH BAR COMPONENT */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-shonen-orange animate-pulse" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              sounds.playTick();
              setSearchQuery(e.target.value);
            }}
            placeholder="ACCESS STREAM REGISTRY... SEARCH BY TITLE, TOPIC, OR TAG"
            className="w-full bg-white border-2 border-gray-200 hover:border-shonen-orange focus:border-shonen-orange pl-10 pr-4 py-3 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all duration-200 shadow-sm uppercase tracking-wider"
            style={{ clipPath: 'polygon(0 0, 100% 0, 99% 100%, 0% 100%)' }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                sounds.playTick();
                setSearchQuery('');
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-shonen-orange transition-colors text-xs font-mono"
            >
              [CLEAR]
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: 🔥 Top Featured Arenas */}
      <LivePollingGrid 
        gridId="featured-polls"
        polls={filteredPolls.filter(p => p.is_spotlight === true || p.is_priority === true)
          .sort((a, b) => {
            if (a.is_spotlight && !b.is_spotlight) return -1;
            if (!a.is_spotlight && b.is_spotlight) return 1;
            if (a.is_priority && !b.is_priority) return -1;
            if (!a.is_priority && b.is_priority) return 1;
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3)}
        onVote={handleVote}
        onActivateSpotlight={activateSpotlight}
        title="🔥 TOP FEATURED ARENAS"
        tagline="BOOSTER GATEWAYS ENGAGED. HIGH-PRIORITY REGISTRY CHANNELS WITH VIP OVERRIDES."
        badgeText="FEATURED STREAM"
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-shonen-yellow animate-spin" style={{ animationDuration: '4s' }} />}
        emptyMessage="NO HIGH-PRIORITY FEATURED ARENAS TRANSMITTING AT THE MOMENT."
        currentUser={currentUser}
        follows={follows}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        comments={comments}
        onAddComment={handleAddComment}
        onTransmitPoll={handleTransmitPollTrigger}
        onDeletePoll={handleDeletePoll}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        allProfiles={allProfiles}
        allVotes={allVotes}
        onUndoVote={handleRemoveVote}
      />

      {/* SECTION 2: 🏆 All Tournaments */}
      <LivePollingGrid 
        gridId="all-polls"
        polls={[...filteredPolls].filter(p => {
          const featuredIds = new Set(
            filteredPolls
              .filter(f => f.is_spotlight === true || f.is_priority === true)
              .sort((a, b) => {
                if (a.is_spotlight && !b.is_spotlight) return -1;
                if (!a.is_spotlight && b.is_spotlight) return 1;
                if (a.is_priority && !b.is_priority) return -1;
                if (!a.is_priority && b.is_priority) return 1;
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 3)
              .map(f => f.id)
          );
          return !featuredIds.has(p.id);
        }).sort((a, b) => {
          if (a.is_spotlight && !b.is_spotlight) return -1;
          if (!a.is_spotlight && b.is_spotlight) return 1;
          if (a.is_priority && !b.is_priority) return -1;
          if (!a.is_priority && b.is_priority) return 1;
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })}
        onVote={handleVote}
        onActivateSpotlight={activateSpotlight}
        title="🏆 ALL ACTIVE TOURNAMENTS"
        tagline="CONTINUOUS STREAM FEED OF ALL POP-CULTURE, CLASSROOM, AND CUSTOM ARENAS."
        badgeText="STREAM INDEX"
        badgeIcon={<Radio className="w-3.5 h-3.5 text-shonen-blue animate-pulse" />}
        emptyMessage="NO ACTIVE TRANSMISSIONS FOUND UNDER CURRENT FILTER PROTOCOLS."
        currentUser={currentUser}
        follows={follows}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        comments={comments}
        onAddComment={handleAddComment}
        onTransmitPoll={handleTransmitPollTrigger}
        onDeletePoll={handleDeletePoll}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        allProfiles={allProfiles}
        allVotes={allVotes}
        onUndoVote={handleRemoveVote}
      />

      {/* CREATIVE STATIC SPECIFICATION CARD BOARD (Arcade details) */}
      <section className="relative w-full max-w-6xl mx-auto px-4 py-8 pb-16 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 border-2 border-black clip-cyber-card shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-shonen-orange font-black">ARENA ENGINE SPEC_01</span>
            <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight">HIGH-ENERGY SPRING PHYSICS</h4>
            <p className="text-gray-600 font-mono text-xs leading-relaxed">
              Every click triggers reactive elastic coordinate transforms mapped to real interactive multipliers. Touch target zones are calibrated to exactly 48px optimal arcade bounds.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-shonen-orange font-black">ARENA ENGINE SPEC_02</span>
            <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight">TENSION SOUND EFFECTS</h4>
            <p className="text-gray-600 font-mono text-xs leading-relaxed">
              Includes procedural oscillators, filters, and white noise impact generators utilizing native browser Web Audio contexts. Pure client-side synthesis. No files, zero latency.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-shonen-orange font-black">ARENA ENGINE SPEC_03</span>
            <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight">CLASSROOM CODES</h4>
            <p className="text-gray-600 font-mono text-xs leading-relaxed">
              Launch instant customizable tablets. Installs as local state so creators can test active classroom engagement index ratios dynamically before streaming live matches.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT & FAQ SECTION FOR DEEP GOOGLE SEARCH INDEXING & USER CLARITY */}
      <AboutFaqSection onPlaySound={() => sounds.playTick()} />

      {/* FOOTER STATUS BAR (HIGH DENSITY THEME) */}
      <footer className="w-full bg-white border-t-2 border-gray-200 z-10 relative">
        <div className="bg-shonen-orange text-white h-9 flex items-center px-4 md:px-8 justify-between font-mono text-[9px] font-bold uppercase select-none">
          <div className="truncate pr-4">CONNECTION: ENCRYPTED // LATENCY: 14MS // OPERATOR: {isMuted ? "SILENT" : "AUDIO_SYNTH_ACTIVE"}</div>
          <div className="flex space-x-4 shrink-0">
            <span className="hidden sm:inline">TERM_01 [SECURED]</span>
            <span>DATA_STREAM [ACTIVE]</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-gray-500">
          <div>
            <span className="font-black text-gray-950">VELGRE</span> // ALL STREAM NETWORKS ACTIVE
          </div>
          <div className="flex gap-4 items-center">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => sounds.playTick()}
              className="text-gray-500 hover:text-shonen-orange transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <span>BUILD: V4.98 // PROTOCOL_ONLINE</span>
          </div>
        </div>

        {/* Global Support Protocol */}
        <div className="w-full border-t border-gray-200 bg-gray-50 py-4">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="font-mono text-[9px] md:text-[10px] tracking-widest text-shonen-orange/70 hover:text-shonen-orange transition-colors uppercase leading-relaxed">
              ⚡ SECURE COMMS // FOR ANY PAYMENT ISSUES OR ACCOUNT FAULTS, CONTACT THE OPERATOR AT: adhyangiri6@gmail.com
            </p>
          </div>
        </div>
      </footer>

      {/* 5. CHAMBER LAUNCH MODAL */}
      <LaunchRoomModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPoll={handleAddPoll}
        currentUser={currentUser}
        polls={polls}
      />

      {/* 6. SECURITY OPERATOR AUTH PROFILE SIDE PANEL */}
      <CyberAuthProfile
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdatePreferences={handleUpdatePreferences}
        onUpgradePremium={handleUpgradeToPremium}
        onUpdateAvatarUrl={handleUpdateAvatarUrl}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* 7. PROFILE COMPLETE ONBOARDING FORM */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onSave={handleSaveProfile}
        initialUsername={currentUser?.username}
      />

      {/* 8. Operator Dossier / Profile Viewer Modal */}
      <OperatorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={selectedProfile}
        currentUser={currentUser}
        follows={follows}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onOpenDirectChat={(friendId) => {
          window.dispatchEvent(new CustomEvent('open-combat-comms', { detail: { friendId } }));
        }}
        blockedUsers={blockedUsers}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
        polls={polls}
        allProfiles={allProfiles}
        onSelectProfile={(p) => setSelectedProfile(p)}
        onOpenTasteMatcher={(target) => {
          setSelectedProfile(null);
          setTasteMatcherTarget(target);
          setIsTasteMatcherOpen(true);
        }}
      />

      {/* 8.5 Two-Way Taste Matcher Modal */}
      <TasteMatcherModal
        isOpen={isTasteMatcherOpen}
        onClose={() => {
          setIsTasteMatcherOpen(false);
          setTasteMatcherTarget(null);
        }}
        currentUser={currentUser}
        allProfiles={allProfiles}
        polls={polls}
        initialTargetUser={tasteMatcherTarget}
        onOpenDirectChat={(friendId, friendUsername) => {
          window.dispatchEvent(new CustomEvent('open-combat-comms', { detail: { friendId, friendUsername } }));
        }}
      />

      {/* 9. Share / Transmit Stream Modal */}
      <ShareTransmitModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        poll={pollToShare}
        currentUser={currentUser}
        follows={follows}
        allProfiles={allProfiles}
      />

      {/* 10. Combat Comms / Chat Widget */}
      <CombatCommsWidget
        currentUser={currentUser}
        follows={follows}
        allProfiles={allProfiles}
        onOpenProfile={(prof) => {
          setSelectedProfile(prof);
          setIsProfileModalOpen(true);
        }}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        blockedUsers={blockedUsers}
      />

      {/* NEURAL NOTIFICATION DRAWER */}
      <AnimatePresence>
        {isNotificationOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white border-l-2 border-shonen-orange z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-shonen-orange text-white p-4 flex justify-between items-center select-none shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-white animate-bounce" />
                  <div>
                    <h3 className="font-sans text-sm font-black uppercase tracking-widest leading-none">VELGRE // ALERTS</h3>
                    <span className="font-mono text-[8px] text-white/80 tracking-widest">MENTIONS & BROADCASTS HUB</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sounds.playError();
                    setIsNotificationOpen(false);
                  }}
                  className="font-mono text-xs text-white hover:text-black border border-white/20 px-2.5 py-1 uppercase cursor-pointer"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Tagline of Notification Center */}
              <div className="bg-pink-50 border-b border-pink-100 p-2.5 text-center shrink-0">
                <span className="font-mono text-[9px] text-pink-600 font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                  ✨ ANIME TASTE ARENA • NEURAL COMMS & MENTIONS 🌸
                </span>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                {getMentions().length === 0 ? (
                  <div className="text-center py-20 font-mono text-xs text-gray-400 uppercase">
                    No neural mentions registered on this terminal.
                  </div>
                ) : (
                  getMentions().map((mention) => (
                    <div 
                      key={mention.id}
                      onClick={() => {
                        sounds.playSelect();
                        setIsNotificationOpen(false);
                        if (mention.isChat && mention.senderId) {
                          // Trigger opening the tactical direct chat panel with the sender!
                          window.dispatchEvent(new CustomEvent('open-combat-comms', { 
                            detail: { friendId: mention.senderId } 
                          }));
                        } else {
                          // Scroll to the active poll post!
                          const el = document.getElementById(`feed-post-${mention.sourceId}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Briefly highlight or flash the card
                            el.classList.add('ring-4', 'ring-shonen-orange');
                            setTimeout(() => el.classList.remove('ring-4', 'ring-shonen-orange'), 2000);
                          } else {
                            // Try to search if not found
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }
                      }}
                      className="p-3 bg-white border-2 border-gray-200 hover:border-shonen-orange transition-all cursor-pointer group flex flex-col gap-1.5 relative hover:translate-x-1"
                    >
                      {/* Left indicator accent line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-shonen-orange opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-center select-none">
                        <span className="font-sans text-xs font-black text-shonen-orange uppercase tracking-wide flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-shonen-orange shrink-0 animate-ping" />
                          @{mention.sender}
                        </span>
                        <span className="font-mono text-[8px] text-gray-400">
                          {new Date(mention.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs font-sans text-gray-800 leading-normal font-medium">
                        {mention.text}
                      </p>

                      <div className="border-t border-dashed border-gray-100 pt-1.5 mt-0.5 flex justify-between items-center select-none">
                        <span className="font-mono text-[8px] text-gray-400 uppercase truncate max-w-[200px]">
                          ON: {mention.sourceTitle}
                        </span>
                        <span className="font-mono text-[8px] text-shonen-orange font-bold tracking-tight shrink-0 flex items-center gap-0.5 group-hover:underline">
                          ENGAGE <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
