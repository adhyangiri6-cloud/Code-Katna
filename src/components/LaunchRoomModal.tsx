import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Poll, PollOption, User } from '../types';
import { sounds } from './SoundManager';
import { saveCustomPost } from '../lib/dataStorage';
import { 
  X, 
  Plus, 
  Trash2, 
  Send, 
  Terminal, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Swords, 
  ShieldCheck, 
  Lock,
  Camera,
  Play
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

const PHOTO_PRESETS = [
  { name: '🔥 GOKU ULTRA INSTINCT', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80' },
  { name: '🌸 SAKURA TEMPLE', url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80' },
  { name: '⚡ NEON SHIBUYA', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80' },
  { name: '🌆 CYBERPUNK TOKYO', url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80' }
];

const VIDEO_PRESETS = [
  { name: '🎬 ANIME BATTLE SEQUENCE', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { name: '⚡ CYBERNETIC CLASH SPARK', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }
];

interface LaunchRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoll: (poll: Poll) => void;
  currentUser: User | null;
  polls: Poll[];
}

export default function LaunchRoomModal({ isOpen, onClose, onAddPoll, currentUser, polls }: LaunchRoomModalProps) {
  const [postType, setPostType] = useState<'POLL' | 'PHOTO' | 'VIDEO'>('POLL');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'POP-CULTURE' | 'CLASSROOM' | 'TOURNAMENT'>('POP-CULTURE');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [mediaUrl, setMediaUrl] = useState('');
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tempUtr, setTempUtr] = useState('');
  const [utrRef, setUtrRef] = useState('');
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPremium = currentUser?.is_premium === true;

  // STRICT EQUALITIES CHECK: Ensure UPI payment layout is routed for ANY transaction value > 0
  const handlePayment = (amount: number) => {
    if (amount > 0) {
      setPaymentAmount(amount);
      setShowPaymentModal(true);
    } else {
      setUtrRef('PREMIUM_BYPASS');
      setIsPendingVerification(false);
    }
  };

  // Sync today's count
  useEffect(() => {
    if (isOpen) {
      const userId = currentUser?.id || 'guest';
      const userStorageKey = `vote_arena_created_today_${userId}`;
      const todayStr = new Date().toISOString().split('T')[0];
      const savedLog = safeLocalStorage.getItem(userStorageKey);
      if (savedLog) {
        try {
          const parsed = JSON.parse(savedLog);
          if (parsed.date === todayStr) {
            setTodayCount(parsed.count || 0);
          } else {
            setTodayCount(0);
          }
        } catch (e) {
          setTodayCount(0);
        }
      } else {
        setTodayCount(0);
      }
    }
  }, [isOpen, currentUser]);

  const handleAddOption = () => {
    if (options.length >= 5) {
      sounds.playError();
      return;
    }
    sounds.playTick();
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      sounds.playError();
      return;
    }
    sounds.playTick();
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      sounds.playError();
      setErrors('MEDIA FILE EXCEEDS 15MB LIMIT.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
      sounds.playTick();
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    // Safety Covenant Check
    if (!guidelinesAccepted) {
      setErrors('YOU MUST FORMALLY ACCEPT THE COMMUNITY SAFETY COVENANT (NO NUDITY / NO HARMFUL CONTENT) BEFORE TRANSMITTING.');
      sounds.playError();
      return;
    }

    // Media validation if photo or video
    if (postType !== 'POLL' && !mediaUrl.trim()) {
      setErrors('MEDIA URL OR ATTACHMENT IS REQUIRED FOR PHOTO/VIDEO TRANSMISSIONS.');
      sounds.playError();
      return;
    }

    // Validation
    if (!title.trim()) {
      setErrors('ARENA NAME OR TRANSMISSION TITLE REQUIRED.');
      sounds.playError();
      return;
    }

    // If options are empty for media posts, provide default anime reactions
    let filteredOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filteredOptions.length < 2) {
      if (postType !== 'POLL') {
        filteredOptions = ['🌸 10/10 MASTERPIECE', '⚡ HYPE / GOATED'];
      } else {
        setErrors('A MINIMUM OF TWO COMPETING ENTRIES REQUIRED.');
        sounds.playError();
        return;
      }
    }

    // Limit Validation
    const userId = currentUser?.id || 'guest';
    const userStorageKey = `vote_arena_created_today_${userId}`;
    const todayStr = new Date().toISOString().split('T')[0];
    
    let creationLog = { date: todayStr, count: 0 };
    const savedLog = safeLocalStorage.getItem(userStorageKey);
    if (savedLog) {
      try {
        const parsed = JSON.parse(savedLog);
        if (parsed.date === todayStr) {
          creationLog = parsed;
        }
      } catch (err) {}
    }

    const limit = isPremium ? 99999 : 5;

    if (creationLog.count >= limit) {
      setErrors(`DAILY ARENA LIMIT REACHED. STANDARD ACCESS ONLY PERMITS 5 ARENAS PER DAY. UPGRADE CODENAME IN PROFILE DRAWER TO PREMIUM FOR UNLIMITED DAILY ARENAS!`);
      sounds.playError();
      return;
    }

    // Calculate exact expiration timestamp
    const maxAllowedHours = isPremium ? 48 : 24;
    const finalDurationHours = Math.min(Number(selectedDuration), maxAllowedHours);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + finalDurationHours);

    // Success
    sounds.playImpact();
    const newPoll: Poll = {
      id: String(Date.now()),
      title: title.trim(),
      category,
      description: description.trim() || (postType === 'PHOTO' ? 'Visual anime media transmission.' : postType === 'VIDEO' ? 'High-motion anime clash video.' : 'Custom interactive poll registered on main link.'),
      totalVotes: 0,
      options: filteredOptions.map(opt => ({ text: opt, votes: 0 })),
      hostName: hostName.trim() || currentUser?.username || 'ANIME_OPERATOR',
      is_priority: isPriority,
      is_spotlight: isSpotlight,
      is_pending_verification: isPendingVerification,
      verification_utr: utrRef,
      comments_enabled: commentsEnabled,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      user_id: currentUser?.id || undefined,
      media_type: postType === 'PHOTO' ? 'IMAGE' : postType === 'VIDEO' ? 'VIDEO' : 'NONE',
      media_url: mediaUrl.trim() || undefined,
      guidelines_accepted: true,
      author_avatar: currentUser?.avatar_url || currentUser?.avatar
    };

    // Save permanently to storage
    saveCustomPost(newPoll);
    onAddPoll(newPoll);
    
    // Increment count
    creationLog.count += 1;
    safeLocalStorage.setItem(userStorageKey, JSON.stringify(creationLog));

    // Reset
    setTitle('');
    setDescription('');
    setHostName('');
    setOptions(['', '']);
    setMediaUrl('');
    setGuidelinesAccepted(false);
    setIsPriority(false);
    setIsSpotlight(false);
    setUtrRef('');
    setTempUtr('');
    setIsPendingVerification(false);
    setCommentsEnabled(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start md:items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sounds.playTick();
              onClose();
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* CRT scanlines inside modal */}
          <div className="fixed inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            className="relative w-full max-w-xl bg-white border-4 border-black p-5 sm:p-8 clip-cyber-card my-8 z-50 shadow-2xl text-gray-950"
          >
            {/* Caution Line at Top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500" />

            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playTick();
                onClose();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black border-2 border-transparent hover:border-black p-1.5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 font-mono text-pink-600 text-xs font-black mb-1 bg-pink-50 border border-pink-200 px-2 py-0.5">
                <Terminal className="w-3.5 h-3.5" />
                SYSTEM_ACCESS // OPEN_ARENA_STREAM
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 uppercase tracking-tighter">
                TRANSMIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-amber-600">PHOTO, VIDEO OR POLL</span>
              </h2>
            </div>

            {/* POST TYPE SWITCHER (POLL vs PHOTO vs VIDEO) */}
            <div className="flex border-2 border-black bg-gray-100 p-1 mb-4 gap-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playTick();
                  setPostType('POLL');
                }}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  postType === 'POLL' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>⚔️ CLASH POLL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTick();
                  setPostType('PHOTO');
                }}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  postType === 'PHOTO' ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>📸 PHOTO POST</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTick();
                  setPostType('VIDEO');
                }}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  postType === 'VIDEO' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>🎬 VIDEO POST</span>
              </button>
            </div>

            {/* Errors */}
            {errors && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 bg-rose-50 border-2 border-rose-500 p-3.5 font-mono text-xs text-rose-900 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-extrabold">TRANSMISSION REQUISITION:</span> {errors}
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PHOTO / VIDEO MEDIA INPUT SECTION */}
              {postType !== 'POLL' && (
                <div className="bg-pink-50/70 border-2 border-black p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                      {postType === 'PHOTO' ? <ImageIcon className="w-4 h-4 text-pink-600" /> : <VideoIcon className="w-4 h-4 text-amber-600" />}
                      {postType === 'PHOTO' ? 'IMAGE SOURCE / FILE UPLOAD' : 'VIDEO STREAM URL / CLIP'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-black font-mono text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      <span>UPLOAD FILE</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={postType === 'PHOTO' ? 'image/*' : 'video/*'}
                    className="hidden"
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={postType === 'PHOTO' ? 'PASTE IMAGE URL (PNG, JPG, WEBP, GIF)...' : 'PASTE VIDEO URL (MP4, WEBM, CLIPS)...'}
                      className="flex-1 bg-white border-2 border-black px-3 py-2 font-mono text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    {mediaUrl && (
                      <button
                        type="button"
                        onClick={() => setMediaUrl('')}
                        className="px-2 py-1 bg-gray-200 border border-black text-gray-700 text-xs font-mono font-bold hover:bg-rose-500 hover:text-white transition-all"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>

                  {/* Preset Quick Selectors */}
                  <div className="space-y-1">
                    <span className="font-mono text-[8px] text-gray-500 uppercase font-bold">
                      QUICK ANIME ASSET PRESETS:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(postType === 'PHOTO' ? PHOTO_PRESETS : VIDEO_PRESETS).map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sounds.playSelect();
                            setMediaUrl(p.url);
                          }}
                          className="bg-white hover:bg-pink-100 text-gray-800 border border-black px-2 py-0.5 font-mono text-[9px] font-bold uppercase transition-all cursor-pointer"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media Preview Box */}
                  {mediaUrl && (
                    <div className="mt-2 border-2 border-black bg-black rounded-none overflow-hidden max-h-48 flex items-center justify-center relative">
                      {postType === 'PHOTO' ? (
                        <img src={mediaUrl} alt="Preview" className="max-h-48 w-full object-contain" />
                      ) : (
                        <video src={mediaUrl} controls className="max-h-48 w-full object-contain" />
                      )}
                      <span className="absolute top-1 right-1 bg-black/80 text-white text-[8px] font-mono px-1.5 py-0.5 border border-white/20 uppercase">
                        PREVIEW READY
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                  STREAM_TYPE / CATEGORY
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['POP-CULTURE', 'CLASSROOM', 'TOURNAMENT'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        sounds.playTick();
                        setCategory(cat);
                      }}
                      className={`font-mono text-[10px] font-bold py-2 border-2 transition-all duration-200 ${
                        category === cat
                          ? 'bg-shonen-orange border-black text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-black'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                  {postType === 'POLL' ? 'POLL TOPIC OR BRACKET ROUND' : 'POST CAPTION / TITLE'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={postType === 'POLL' ? 'e.g. BEST MECHA ANIME OF ALL TIME' : 'e.g. S-TIER CINEMATOGRAPHY IN THIS EPISODE 🔥'}
                  className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-black px-4 py-2 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                />
              </div>

              {/* Description & Host Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                    SYSTEM INSTANCE / HOST NAME
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder={currentUser?.username || 'ANIME_OPERATOR'}
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-black px-4 py-2 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                    DESCRIPTION / COMMENTARY
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Cast your vote & state your opinion!"
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-black px-4 py-2 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Poll Options (Optional for Media Posts, Required for Polls) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono text-gray-500 uppercase font-black tracking-widest">
                    {postType === 'POLL' ? 'COMPETING ENTRIES (2 TO 5)' : 'COMMUNITY VOTE OPTIONS (OPTIONAL)'}
                  </label>
                  {options.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-[9px] font-mono font-bold text-shonen-orange hover:text-black flex items-center gap-1 uppercase cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> ADD OPTION
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`OPTION #${idx + 1} ${postType !== 'POLL' ? '(e.g. 10/10 vs Mid)' : ''}`}
                        className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-black px-3 py-1.5 font-mono text-xs text-gray-950 focus:outline-none"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="px-2 py-1 bg-gray-100 hover:bg-rose-500 hover:text-white border border-gray-300 text-gray-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments toggle */}
              <div className="bg-gray-50 border border-gray-200 p-3 flex items-center justify-between">
                <div className="font-mono text-xs">
                  <p className="font-bold text-gray-950 uppercase">COMMENTS PROTOCOL [ENABLED]</p>
                  <p className="text-[9px] text-gray-500 uppercase mt-0.5">ALLOW OPERATORS TO POST PUBLIC DISCUSSIONS</p>
                </div>
                <input
                  type="checkbox"
                  checked={commentsEnabled}
                  onChange={(e) => {
                    sounds.playTick();
                    setCommentsEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 accent-shonen-orange cursor-pointer"
                />
              </div>

              {/* MANDATORY COMMUNITY SAFETY PLEDGE COVENANT */}
              <div className="bg-amber-50 border-2 border-black p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-mono text-[10px] font-black text-amber-950 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>MANDATORY COMMUNITY INTEGRITY & SAFETY COVENANT</span>
                </div>
                <p className="text-[9px] font-mono text-amber-900 leading-relaxed uppercase">
                  Before transmitting any photo, video, or poll, you must agree:
                  <span className="font-bold block mt-0.5 text-black">
                    "I solemnly pledge that this transmission contains NO nudity, adult/NSFW content, extreme violence, hate speech, or harmful material. I acknowledge that violations will result in permanent chassis decommissioning (ban) and IP forfeiture."
                  </span>
                </p>
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={guidelinesAccepted}
                    onChange={(e) => {
                      sounds.playSelect();
                      setGuidelinesAccepted(e.target.checked);
                    }}
                    className="w-4 h-4 accent-pink-600 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] font-black uppercase text-pink-900">
                    [ ✓ ] I ACCEPT COMMUNITY RULES & COMMIT TO ZERO NUDITY / ZERO HARM
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!guidelinesAccepted}
                className={`w-full text-xs font-black py-3 px-4 uppercase tracking-widest transition-all duration-200 border-2 border-black flex items-center justify-center gap-2 ${
                  guidelinesAccepted
                    ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-black hover:to-black text-white cursor-pointer shadow-md active:scale-98'
                    : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                }`}
              >
                {guidelinesAccepted ? (
                  <>
                    <Send className="w-4 h-4" />
                    <span>INJECT TRANSMISSION INTO STREAM</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>[ 🔒 ACCEPT SAFETY COVENANT TO TRANSMIT ]</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* UPI QR & Payment Verification Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="w-full max-w-sm bg-white border-4 border-black p-6 clip-cyber-card shadow-lg relative z-[100] text-gray-950"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500" />

            <h3 className="font-mono text-xs font-black text-shonen-orange flex items-center gap-1.5 mb-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-shonen-orange animate-pulse" />
              PROAL REQUISITION REQUIRED
            </h3>
            
            <p className="font-mono text-[11px] text-gray-600 leading-relaxed mb-4 uppercase">
              PROAL REQUISITION: Remit ₹{paymentAmount} to anchor this stream enhancement feature on the grid.
            </p>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm text-center mb-4 space-y-3">
              <span className="font-mono text-[9px] text-gray-500 uppercase block">TARGET GATEWAY: FAMPAY UPI ID</span>
              <span className="font-black font-mono text-shonen-orange text-sm tracking-wider block">9368427694@fam</span>
              
              {typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768) ? (
                <a
                  href={`upi://pay?pa=9368427694@fam&pn=VOTE_ARENA&am=${paymentAmount}&cu=INR`}
                  onClick={() => sounds.playPunchyCTA()}
                  className="inline-flex w-full items-center justify-center bg-shonen-orange text-white font-black font-mono text-xs py-2 px-4 uppercase hover:bg-black transition-all rounded-none"
                >
                  [ 📱 OPEN IN UPI WALLET ]
                </a>
              ) : (
                <div className="space-y-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`upi://pay?pa=9368427694@fam&pn=VOTE_ARENA&am=${paymentAmount}&cu=INR`)}`} 
                    alt="UPI QR Code" 
                    referrerPolicy="no-referrer"
                    className="w-40 h-40 mx-auto border-2 border-shonen-orange p-1 bg-white"
                  />
                  <span className="font-mono text-[9px] text-gray-500 uppercase block">SCAN WITH GOOGLE PAY / PHONEPE / BHIM</span>
                </div>
              )}
            </div>

            {/* Manual Verification Form */}
            <div className="space-y-3">
              <label className="block text-[9px] font-mono text-gray-500 uppercase font-black">
                ENTER TRANSACTION REF NO. / UTR TO VERIFY
              </label>
              <input
                type="text"
                placeholder="e.g. 12-digit UTR reference"
                value={tempUtr}
                onChange={(e) => setTempUtr(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-shonen-orange px-3 py-2 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none clip-cyber-card-sm"
              />
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTick();
                    setIsSpotlight(false);
                    setShowPaymentModal(false);
                    setTempUtr('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-xs py-2 font-bold uppercase transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!tempUtr.trim()) {
                      sounds.playError();
                      alert('PLEASE ENTER YOUR TRANSACTION UTR REF NO.');
                      return;
                    }
                    sounds.playImpact();
                    setUtrRef(tempUtr.trim());
                    setIsPendingVerification(true);
                    setShowPaymentModal(false);
                    setTempUtr('');
                  }}
                  className="flex-1 bg-shonen-orange hover:bg-black text-white font-mono text-xs py-2 font-black uppercase transition-all"
                >
                  VERIFY REF
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
