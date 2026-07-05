import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Poll, PollOption, User } from '../types';
import { sounds } from './SoundManager';
import { X, Plus, Trash2, Send, Terminal, AlertTriangle, Sparkles, Flame } from 'lucide-react';

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

interface LaunchRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoll: (poll: Poll) => void;
  currentUser: User | null;
  polls: Poll[];
}

export default function LaunchRoomModal({ isOpen, onClose, onAddPoll, currentUser, polls }: LaunchRoomModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'POP-CULTURE' | 'CLASSROOM' | 'TOURNAMENT'>('POP-CULTURE');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
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

  const isPremium = currentUser?.is_premium === true;

  // STRICT EQUALITIES CHECK: Ensure UPI payment layout is routed for ANY transaction value > 0
  const handlePayment = (amount: number) => {
    if (amount > 0) {
      setPaymentAmount(amount);
      setShowPaymentModal(true);
    } else {
      // PREMIUM_BYPASS or Free tier
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    // Validation
    if (!title.trim()) {
      setErrors('ARENA NAME OR POLL TITLE REQUIRED.');
      sounds.playError();
      return;
    }

    const filteredOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filteredOptions.length < 2) {
      setErrors('A MINIMUM OF TWO COMPETING ENTRIES REQUIRED.');
      sounds.playError();
      return;
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
      description: description.trim() || 'Custom transmission registered on main link.',
      totalVotes: 0,
      options: filteredOptions.map(opt => ({ text: opt, votes: 0 })),
      hostName: hostName.trim() || 'GATEKEEPER_ID_X',
      is_priority: isPriority,
      is_spotlight: isSpotlight,
      is_pending_verification: isPendingVerification,
      verification_utr: utrRef,
      comments_enabled: commentsEnabled,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      user_id: currentUser?.id || undefined
    };

    onAddPoll(newPoll);
    
    // Increment count
    creationLog.count += 1;
    safeLocalStorage.setItem(userStorageKey, JSON.stringify(creationLog));

    // Reset
    setTitle('');
    setDescription('');
    setHostName('');
    setOptions(['', '']);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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

          {/* CRT scanlines inside modal */}
          <div className="absolute inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border-4 border-black p-6 md:p-8 clip-cyber-card z-50 shadow-lg text-gray-950 scrollbar-thin"
          >
            {/* Caution Hatching Border at the top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playTick();
                onClose();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-shonen-orange border-2 border-transparent hover:border-shonen-orange/30 p-1.5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 font-mono text-shonen-orange text-xs font-black mb-1">
                <Terminal className="w-3.5 h-3.5" />
                SYSTEM_ACCESS // OPEN_ARENA_STREAM
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-950 uppercase tracking-tighter">
                LAUNCH <span className="text-shonen-orange">POLLING CHAMBER</span>
              </h2>
            </div>

            {/* Errors */}
            {errors && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 bg-shonen-orange/10 border-2 border-shonen-orange p-3.5 font-mono text-xs text-shonen-orange flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">TRANSMISSION ERROR:</span> {errors}
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-2 tracking-widest">
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
                      className={`font-mono text-[10px] font-bold py-2 border-2 transition-all duration-200 clip-diagonal-reverse ${
                        category === cat
                          ? 'bg-shonen-orange border-shonen-orange text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-shonen-orange'
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
                  POLL TOPIC OR BRACKET ROUNDS
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. BEST MECHA ANIME OF ALL TIME"
                  className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-4 py-2.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all clip-cyber-card-sm"
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
                    placeholder="e.g. SENSEI_A"
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-4 py-2.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all clip-cyber-card-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                    TRANSMISSION TAGLINE
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Physics class quiz or fun vote"
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-4 py-2.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all clip-cyber-card-sm"
                  />
                </div>
              </div>

              {/* Dynamic Lifespan Duration Dropdown Selector */}
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                  SELECT STREAM LIFESPAN TIME WINDOW
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => {
                    sounds.playTick();
                    setSelectedDuration(Number(e.target.value));
                  }}
                  className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-4 py-2.5 font-mono text-xs text-gray-950 focus:outline-none transition-all clip-cyber-card-sm uppercase"
                >
                  <option value={1}>1 HOUR (STANDARD)</option>
                  <option value={2}>2 HOURS (STANDARD)</option>
                  <option value={24}>24 HOURS / 1 DAY (STANDARD MAX)</option>
                  {isPremium ? (
                    <option value={48}>🚀 48 HOURS / 2 DAYS (PREMIUM ACCESS UNLOCKED)</option>
                  ) : (
                    <option value={48} disabled>🔒 48 HOURS / 2 DAYS (REQUIRES PREMIUM OPERATOR STATUS)</option>
                  )}
                </select>
              </div>

              {/* Contestants / Options List */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono text-gray-500 uppercase font-black tracking-widest">
                    COMPETING OPTIONS (2-5)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={options.length >= 5}
                    className="text-[10px] font-mono text-shonen-orange hover:text-black flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> ADD OPTION
                  </button>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="font-mono text-xs text-gray-500 font-bold select-none min-w-[20px]">
                        #{idx + 1}
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`e.g. Option ${idx + 1}`}
                        className="flex-1 bg-white border border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-3 py-1.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none clip-cyber-card-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={options.length <= 2}
                        className="text-gray-400 hover:text-shonen-orange p-1.5 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Boost Option */}
              <div className="bg-shonen-orange/5 border border-shonen-orange/20 p-3.5 flex items-center justify-between clip-cyber-card-sm">
                <div className="font-mono text-xs">
                  <p className="font-bold text-shonen-orange uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-shonen-orange" />
                    ACTIVATE PRIORITY BOOSTER [₹5]
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                    ELEVATE STREAM TO THE TOP FEATURED ARENA ROW
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={(e) => {
                    sounds.playTick();
                    const val = e.target.checked;
                    setIsPriority(val);
                    if (val) {
                      if (isPremium) {
                        setUtrRef('PREMIUM_BYPASS');
                        setIsPendingVerification(false);
                        alert("👑 PREMIUM SYSTEM BYPASS: PRIORITY BOOST ENFORCED INSTANTLY FOR FREE!");
                      } else {
                        handlePayment(5);
                      }
                    } else {
                      if (!isSpotlight) {
                        setUtrRef('');
                        setIsPendingVerification(false);
                      }
                    }
                  }}
                  className="w-4 h-4 accent-shonen-orange cursor-pointer"
                />
              </div>

              {/* 🔥 PROMOTED: PUSH TO GLOBAL SPOTLIGHT (₹100) */}
              <div className="bg-shonen-orange/5 border border-shonen-orange/20 p-3.5 flex flex-col gap-2 clip-cyber-card-sm">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs">
                    <p className="font-bold text-shonen-orange uppercase flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 animate-pulse text-shonen-orange" />
                      [ 🔥 PROMOTED: PUSH TO GLOBAL SPOTLIGHT (₹100) ]
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                      Remit ₹100 to anchor this tournament on the global spotlight banner.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSpotlight}
                    onChange={(e) => {
                      sounds.playTick();
                      const val = e.target.checked;
                      setIsSpotlight(val);
                      if (val) {
                        if (isPremium) {
                          setUtrRef('PREMIUM_BYPASS');
                          setIsPendingVerification(false);
                          alert("👑 PREMIUM SYSTEM BYPASS: SPOTLIGHT FEATURE ENFORCED INSTANTLY FOR FREE!");
                        } else {
                          handlePayment(100);
                        }
                      } else {
                        if (!isPriority) {
                          setUtrRef('');
                          setIsPendingVerification(false);
                        }
                      }
                    }}
                    className="w-4 h-4 accent-shonen-orange cursor-pointer"
                  />
                </div>
                {utrRef && (
                  <div className="font-mono text-[9px] text-emerald-600 bg-emerald-50 p-2 border border-emerald-200 flex items-center gap-1.5 rounded-sm">
                    <span className="animate-pulse">●</span>
                    <span>
                      {utrRef === 'PREMIUM_BYPASS' 
                        ? '👑 SPOTLIGHT CONFIRMED VIA PREMIUM BYPASS PROTOCOL'
                        : `SPOTLIGHT CONFIRMED (UTR: ${utrRef}) - PENDING ADMIN VERIFICATION`}
                    </span>
                  </div>
                )}
              </div>

              {/* Comments Section Control Toggle */}
              <div className="bg-shonen-orange/5 border border-shonen-orange/20 p-3.5 flex items-center justify-between clip-cyber-card-sm">
                <div className="font-mono text-xs">
                  <p className="font-bold text-shonen-orange uppercase flex items-center gap-1.5">
                    COMMENTS PROTOCOL [ENABLED]
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                    ALLOW OPERATORS TO POST PUBLIC TRANSMISSIONS UNDER THIS ARENA
                  </p>
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-shonen-orange text-white hover:bg-black border-2 border-black text-xs font-black py-3 px-4 uppercase tracking-widest transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer clip-diagonal mt-6"
              >
                <Send className="w-4 h-4" /> INJECT TRANSMISSION INTO STREAM
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
            {/* Caution stripes at top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:12px_12px]" />

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
              
              {/* Responsive UPI Button / QR Code Section */}
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
                  className="flex-1 bg-white text-gray-500 font-mono text-[10px] py-2 font-bold hover:text-gray-950 transition-colors border border-gray-200"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!tempUtr.trim()) {
                      sounds.playError();
                      alert("Please enter a valid reference UTR number.");
                      return;
                    }
                    sounds.playImpact();
                    setUtrRef(tempUtr.trim());
                    setIsPendingVerification(true);
                    alert("✨ ROUTE LOGGED: Admin will verify your transaction shortly!");
                    setShowPaymentModal(false);
                  }}
                  className="flex-1 bg-shonen-orange text-white font-mono text-[10px] py-2 font-black hover:bg-black transition-colors"
                >
                  SUBMIT REF
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
