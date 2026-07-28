import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, HistoryItem, UserPreferences } from '../types';
import { sounds } from './SoundManager';
import { supabase } from '../lib/supabaseClient';
import ImageCropper from './ImageCropper';
import { OperatorApprovalConsole } from './OperatorApprovalConsole';
import { 
  X, 
  Terminal, 
  User as UserIcon, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles, 
  History, 
  Settings, 
  LogOut, 
  Sliders,
  Radio,
  Clock,
  Fingerprint,
  Crown,
  Camera
} from 'lucide-react';

const PRESET_AVATARS = [
  { name: 'KAGE', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=kage&backgroundColor=ff6b00' },
  { name: 'CHICA', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=chica&backgroundColor=00f0ff' },
  { name: 'SENSEI', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sensei&backgroundColor=ff0055' },
  { name: 'CYBORG', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cyborg&backgroundColor=ffcc00' },
  { name: 'MATRIX', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=matrix&backgroundColor=00ff66' },
  { name: 'ARENA', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=arena&backgroundColor=9900ff' }
];

interface CyberAuthProfileProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onUpgradePremium?: (utr?: string) => void;
  onUpdateAvatarUrl?: (url: string) => void;
}

export default function CyberAuthProfile({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onUpdatePreferences,
  onUpgradePremium,
  onUpdateAvatarUrl
}: CyberAuthProfileProps) {
  const [tab, setTab] = useState<'login' | 'profile'>('login');
  
  // Credentials for traditional Email & Password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State errors / status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Preference edit states
  const [prefAccent, setPrefAccent] = useState<'pink' | 'cyan' | 'yellow'>('cyan');
  const [prefAvatar, setPrefAvatar] = useState('OPS');
  const [prefSounds, setPrefSounds] = useState(true);
  const [prefBias, setPrefBias] = useState<'standard' | 'high-frequency' | 'sub-harmonic'>('standard');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Premium checkout screen states
  const [showPremiumCheckout, setShowPremiumCheckout] = useState(false);
  const [premiumUtr, setPremiumUtr] = useState('');
  const [isPremiumPending, setIsPremiumPending] = useState(false);

  // Sync preference state with current user
  useEffect(() => {
    if (currentUser) {
      setTab('profile');
      setPrefAccent(currentUser.preferences.accentColor);
      setPrefAvatar(currentUser.preferences.avatarTag);
      setPrefSounds(currentUser.preferences.enableAlertSounds);
      setPrefBias(currentUser.preferences.frequencyBias);
      setAvatarUrl(currentUser.avatar_url || '');
    } else {
      if (tab === 'profile') {
        setTab('login');
      }
    }
  }, [currentUser]);

  // Clean form errors
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [tab]);

  // Handle Sign Up (Register)
  const handleSignUp = async () => {
    sounds.playSelect();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError('EMAIL AND PASSWORD REQUIRED.');
      sounds.playError();
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      setSuccess('SIGN UP SUCCESSFUL! ACQUIRING GEOLOCATION TELEMETRY...');
      sounds.playImpact();

      // Instantly trigger browser location tracking and write details to 'user_logins' table
      let locationStr = 'PENDING_COORDINATES';
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            locationStr = `LAT:${position.coords.latitude.toFixed(4)}, LNG:${position.coords.longitude.toFixed(4)}`;
            try {
              await supabase.from('user_logins').insert({
                email: email,
                timestamp: new Date().toISOString(),
                location: locationStr
              });
            } catch (dbErr) {
              console.warn('Could not insert login entry:', dbErr);
            }
          },
          async (geoErr) => {
            console.warn('Geolocation failed or denied:', geoErr);
            locationStr = 'LOCATION_DENIED';
            try {
              await supabase.from('user_logins').insert({
                email: email,
                timestamp: new Date().toISOString(),
                location: locationStr
              });
            } catch (dbErr) {
              console.warn('Could not insert login entry:', dbErr);
            }
          },
          { timeout: 5000 }
        );
      } else {
        locationStr = 'GEOLOCATION_UNSUPPORTED';
        try {
          await supabase.from('user_logins').insert({
            email: email,
            timestamp: new Date().toISOString(),
            location: locationStr
          });
        } catch (dbErr) {
          console.warn('Could not insert login entry:', dbErr);
        }
      }

      if (data?.session) {
        // Clear session data to ensure they don't get auto-logged in with an unverified or verified state
        try {
          localStorage.removeItem('codekatana_user');
          await supabase.auth.signOut();
        } catch (e) {}
      }
      
      setSuccess('📬 VERIFICATION PROTOCOL SENT: Please open your email inbox and click the confirmation link before attempting to login!');
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'REGISTRATION PROTOCOL INTERRUPTED.');
      sounds.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email and Password Login
  const handleEmailLogin = async () => {
    sounds.playSelect();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError('EMAIL AND PASSWORD REQUIRED.');
      sounds.playError();
      return;
    }

    setIsSubmitting(true);
    try {
      const targetEmail = email.trim();
      const isAdmin = targetEmail.toLowerCase() === 'adhyangiri6@gmail.com';

      // 1. ADMIN INSTANT PASS AND FALLBACK BYPASS PROTOCOL
      if (isAdmin && password === 'adhyangiri2009') {
        let userToUse = null;
        try {
          // Attempt real Supabase sign in first
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password,
          });
          if (data?.session) {
            userToUse = data.session.user;
          }
        } catch (e) {
          console.warn("Supabase admin sign-in failed, trying fallback protocols:", e);
        }

        // If sign-in failed (e.g. user does not exist), attempt auto-signUp to register the user
        if (!userToUse) {
          try {
            const { data: signUpData } = await supabase.auth.signUp({
              email: targetEmail,
              password,
            });
            if (signUpData?.user) {
              userToUse = signUpData.user;
            }
          } catch (e) {
            console.warn("Supabase admin auto-registration failed:", e);
          }
        }

        // If both failed (e.g. Supabase connection issue or unconfirmed status blocking sign-in),
        // we use a synthetic user profile so they can access their arena instantly.
        if (!userToUse) {
          userToUse = {
            id: 'admin-adhyan-bypass-id',
            email: targetEmail,
            created_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { name: 'ADHYAN', username: 'ADHYAN' }
          };
        }

        try {
          localStorage.setItem('codekatana_user', JSON.stringify(userToUse));
        } catch (e) {}

        setSuccess('ADMIN CHASSIS ACCESS SECURED. BYPASS PROTOCOLS ACTIVE.');
        sounds.playImpact();

        onLogin({
          id: userToUse.id,
          username: 'ADHYAN',
          avatar: 'ADH',
          registeredAt: userToUse.created_at || new Date().toISOString(),
          preferences: {
            accentColor: 'cyan',
            avatarTag: 'ADH',
            enableAlertSounds: true,
            frequencyBias: 'standard'
          },
          history: [],
          is_premium: true,
          premium_expires_at: '2099-12-31T23:59:59.000Z',
          is_admin: true,
          email: targetEmail
        });

        setTimeout(() => {
          onClose();
        }, 500);
        return;
      }

      // 2. STANDARD PUBLIC USER LOGIN PROTOCOL
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (signInError) {
        const errMsg = signInError.message.toLowerCase();
        if (!isAdmin && (errMsg.includes('confirm') || errMsg.includes('verified') || errMsg.includes('verification') || errMsg.includes('unverified'))) {
          throw new Error('❌ ACCESS DENIED: Email protocol unverified. Check your inbox.');
        }
        throw signInError;
      }

      if (data?.session) {
        const user = data.session.user;

        // Strict email verification check for non-admin users if we get an unconfirmed session
        if (!isAdmin && !user.email_confirmed_at) {
          await supabase.auth.signOut();
          try {
            localStorage.removeItem('codekatana_user');
          } catch (e) {}
          throw new Error('❌ ACCESS DENIED: Email protocol unverified. Check your inbox.');
        }

        try {
          localStorage.setItem('codekatana_user', JSON.stringify(user));
        } catch (e) {}

        setSuccess('OPERATOR CHASSIS ACCESS SECURED.');
        sounds.playImpact();

        // Propagate login event immediately to sync local React states
        const name = user.user_metadata?.username || targetEmail.split('@')[0] || 'OPERATOR';
        const tag = name.slice(0, 3).toUpperCase();
        onLogin({
          id: user.id,
          username: name,
          avatar: tag,
          registeredAt: user.created_at || new Date().toISOString(),
          preferences: {
            accentColor: 'pink',
            avatarTag: tag,
            enableAlertSounds: true,
            frequencyBias: 'standard'
          },
          history: [],
          is_premium: false,
          is_admin: false,
          email: targetEmail
        });
        
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err.message || '';
      const targetEmail = email.trim();
      const isAdmin = targetEmail.toLowerCase() === 'adhyangiri6@gmail.com';
      if (!isAdmin && (errMsg.includes('CONFIRM YOUR EMAIL') || errMsg.toLowerCase().includes('confirm') || errMsg.toLowerCase().includes('verification') || errMsg.toLowerCase().includes('unverified'))) {
        setError('❌ ACCESS DENIED: Email protocol unverified. Check your inbox.');
      } else {
        setError(err.message || 'DECRYPTION KEY INCORRECT. ACCESS DENIED.');
      }
      sounds.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      sounds.playError();
      setError('AVATAR FILE SIZE EXCEEDS 2MB MAXIMUM.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setRawImageUrl(dataUrl);
      sounds.playTick();
    };
    reader.readAsDataURL(file);
  };

  // Save modified Preferences
  const handleSavePreferences = () => {
    sounds.playImpact();
    if (prefAvatar.length < 2 || prefAvatar.length > 4) {
      setError('AVATAR TAG CODE MUST BE 2 TO 4 LETTERS.');
      sounds.playError();
      return;
    }

    const updatedPrefs: UserPreferences = {
      accentColor: prefAccent,
      avatarTag: prefAvatar.toUpperCase(),
      enableAlertSounds: prefSounds,
      frequencyBias: prefBias
    };

    onUpdatePreferences(updatedPrefs);
    if (onUpdateAvatarUrl) {
      onUpdateAvatarUrl(avatarUrl);
    }
    setSuccess('PREFERENCES SYNCHRONIZED INTO GRID CORRUPTURE.');
    
    setTimeout(() => {
      setSuccess(null);
    }, 1800);
  };

  const activeAccentColorClass = () => {
    switch (prefAccent) {
      case 'pink': return 'text-shonen-orange border-shonen-orange';
      case 'yellow': return 'text-shonen-orange border-shonen-orange';
      default: return 'text-shonen-orange border-shonen-orange';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Background overlay */}
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

          {/* CRT lines on top of drawer */}
          <div className="absolute inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Sliding Side Panel Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg h-full bg-[#FFFDF9] border-l-4 border-shonen-orange p-6 md:p-8 overflow-y-auto flex flex-col justify-between z-50 shadow-[-10px_0_40px_rgba(255,107,0,0.15)] rounded-none text-gray-950"
          >
            {/* Top caution header decorative */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            <div>
              {/* Drawer Header info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="inline-flex items-center gap-1 font-mono text-shonen-orange text-[10px] font-black uppercase mb-1">
                    <Fingerprint className="w-3.5 h-3.5" />
                    SECURITY_TUNNEL // USER_AUTHENTICATION
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-950 uppercase tracking-tighter">
                    {currentUser ? 'OPERATOR' : 'GATEKEEPER'}{' '}
                    <span className="text-shonen-orange">CHASSIS</span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    sounds.playTick();
                    onClose();
                  }}
                  className="p-1.5 border border-gray-200 hover:border-shonen-orange hover:text-shonen-orange text-gray-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success / Error Banners */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 bg-shonen-orange/10 border border-shonen-orange p-3 font-mono text-[11px] text-shonen-orange flex items-start gap-2"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">DECRYPT FAULT:</span> {error}
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 bg-shonen-orange/10 border border-shonen-orange p-3 font-mono text-[11px] text-shonen-orange flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">SYSTEM SYNCED:</span> {success}
                  </div>
                </motion.div>
              )}

              {/* EMAIL/PASSWORD SIGN IN REQUISITION (only if NOT logged in) */}
              {!currentUser && (
                <div className="space-y-5">
                  <div className="p-4 bg-white border border-gray-200 clip-cyber-card relative overflow-hidden">
                    {/* Retro Grid Gridline Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:14px_24px]" />
                    
                    <h3 className="font-mono text-xs font-black text-shonen-orange flex items-center gap-2 mb-2 uppercase tracking-widest">
                      <Terminal className="w-4 h-4 animate-pulse text-shonen-orange" /> AUTHORIZATION SYSTEM
                    </h3>
                    <p className="text-[11px] font-mono text-gray-500 leading-relaxed uppercase">
                      SECURE YOUR CODENAME CREDENTIALS TO GAIN ENTRY TO THE ARENA STAGE.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="login-email" className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                        OPERATOR_EMAIL
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@arena.network"
                        className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-shonen-orange px-3 py-2.5 font-mono text-xs text-gray-950 focus:outline-none focus:ring-1 focus:ring-shonen-orange placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Password Input */}
                    <div>
                      <label htmlFor="login-password" className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                        DECRYPT_PASSWORD
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-shonen-orange px-3 py-2.5 font-mono text-xs text-gray-950 focus:outline-none focus:ring-1 focus:ring-shonen-orange placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        id="btn-login-submit"
                        onClick={handleEmailLogin}
                        disabled={isSubmitting}
                        className="bg-shonen-orange text-white hover:bg-black text-xs font-black py-3 px-4 uppercase tracking-widest transition-all duration-200 shadow-sm border-2 border-black cursor-pointer disabled:opacity-50"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}
                      >
                        {isSubmitting ? 'DECRYPTING...' : '[ LOGIN ]'}
                      </button>

                      <button
                        id="btn-signup-submit"
                        onClick={handleSignUp}
                        disabled={isSubmitting}
                        className="bg-transparent border-2 border-black text-black hover:bg-gray-100 text-[10px] font-black py-2.5 px-3 uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 0% 100%)' }}
                      >
                        {isSubmitting ? 'SYNCING...' : '[ SIGN UP / REGISTER ]'}
                      </button>
                    </div>

                    {/* Supabase Email Confirmation Helper Info */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm text-[10px] font-mono text-gray-500 leading-relaxed uppercase">
                      <span className="text-shonen-orange font-black block mb-1">⚠️ EMAIL PROTOCOL NOTICE:</span>
                      IF YOUR SUPABASE PROJECT INSTANCE HAS <span className="text-gray-900 font-bold">"CONFIRM EMAIL"</span> ENABLED, NEWLY CREATED ACCOUNTS MUST CLICK THE EMAILED VERIFICATION LINK BEFORE THEIR DECRYPT LOGIN PROTOCOL WILL SUCCEED.
                      <span className="block mt-1 text-gray-600">
                        TO DISABLE: SUPABASE DASHBOARD &gt; AUTH &gt; PROVIDERS &gt; EMAIL &gt; TURN OFF "CONFIRM EMAIL".
                      </span>
                    </div>

                    <div className="flex items-center gap-2 justify-center py-1 text-[10px] font-mono text-gray-600 uppercase">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                      <span>SECURE CONNECTION VIA SUPABASE DECRYPT</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MAIN CONTENT BLOCK */}
              <div className="space-y-5">
                {currentUser && (
                  <div className="space-y-6">
                    {/* Info Card Block */}
                    <div className="p-4 bg-white border border-gray-200 relative overflow-hidden clip-cyber-card shadow-sm">
                      <div className="absolute right-3 top-3 text-[10px] font-mono text-shonen-orange flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE STREAM OPERATOR
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Avatar tag representation with high-glow if premium */}
                        <div className={`relative w-14 h-14 text-white font-black text-xl flex items-center justify-center clip-cyber-card transform -skew-x-6 transition-all duration-300 bg-shonen-orange shadow-sm`}>
                          {currentUser.preferences.avatarTag || 'OPS'}
                          {currentUser.is_admin && (
                            <div className="absolute -top-1 -right-1 bg-white text-shonen-orange rounded-full p-0.5 border border-shonen-orange shadow-sm">
                              <Crown className="w-3.5 h-3.5 animate-bounce" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-mono text-[9px] text-gray-500 uppercase font-black flex items-center gap-1 flex-wrap">
                            OPERATOR_ID_0{currentUser.username.length}892 
                            {currentUser.is_premium && <span className="text-shonen-orange font-black">[PREMIUM]</span>}
                            {currentUser.is_admin && <span className="text-shonen-orange font-black">[ADMIN ACCESS]</span>}
                          </span>
                          <h3 className="text-xl font-black text-gray-950 uppercase leading-none mt-1 tracking-tight flex items-center gap-1.5">
                            {currentUser.username}
                            {currentUser.is_admin && (
                              <span className="bg-shonen-orange text-white font-mono text-[9px] px-1.5 py-0.5 font-black flex items-center gap-0.5 rounded-sm">
                                <Crown className="w-3 h-3 shrink-0" /> ADMIN
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] font-mono text-gray-500 block mt-1">
                            REGISTERED AT: {new Date(currentUser.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Micro specs */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-[10px] font-mono">
                        <div>
                          <span className="text-gray-500">SYNC STATUS:</span>{' '}
                          <span className="text-shonen-orange font-bold">99.8% OPTIMAL</span>
                        </div>
                        <div>
                          <span className="text-gray-500">POLL ACTIONS:</span>{' '}
                          <span className="text-shonen-orange font-bold">
                            {currentUser.history?.length || 1} TRANSMISSIONS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operator Console for adhyangiri6@gmail.com */}
                    {(currentUser.email?.toLowerCase() === 'adhyangiri6@gmail.com' ||
                      currentUser.username?.toUpperCase() === 'ADHYAN' ||
                      currentUser.is_admin) && (
                      <OperatorApprovalConsole currentUser={currentUser} />
                    )}

                    {/* Premium membership status / upgrade */}
                    <div className="p-4 bg-white border-2 border-shonen-orange clip-cyber-card relative overflow-hidden shadow-sm text-gray-950">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-shonen-orange/10 rounded-full blur-2xl pointer-events-none" />
                      {currentUser.is_premium ? (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs font-black text-shonen-orange flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 animate-spin text-shonen-orange" style={{ animationDuration: '6s' }} />
                            PREMIUM MEMBERSHIP ACTIVE
                          </h4>
                          <p className="text-[10px] font-mono text-gray-500 uppercase leading-relaxed">
                            EXPIRY PROTOCOL SECURED THROUGH: {currentUser.premium_expires_at ? new Date(currentUser.premium_expires_at).toLocaleDateString() : 'N/A'}
                          </p>
                          <div className="text-[9px] font-mono text-emerald-600 font-bold uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" />
                            BENEFITS SYNCED: UNLIMITED ARENAS // MATRIX RADAR GLOW // VIP ACCESS
                          </div>
                        </div>
                      ) : currentUser.premium_status === 'pending' || isPremiumPending ? (
                        <div className="space-y-2.5 p-3 bg-amber-50 border-2 border-amber-500 text-gray-950 font-mono">
                          <div className="flex items-center gap-1.5 text-amber-700 font-black text-xs uppercase">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>⌛ CONFIRMATION TRANSMITTED TO adhyangiri6@gmail.com</span>
                          </div>
                          <p className="text-[9px] uppercase leading-relaxed text-gray-800">
                            Your premium purchase request has been transmitted.
                            <strong> STATUS: PENDING OPERATOR ALLOW (YES).</strong>
                          </p>
                          <div className="p-2 bg-amber-100 border border-amber-300 text-[8px] text-amber-900 font-bold uppercase leading-tight">
                            Notice: Premium access will begin ONLY after adhyangiri6@gmail.com approves YES.
                            If rejected, request will show CANCELLED and no premium will be given.
                          </div>
                        </div>
                      ) : currentUser.premium_status === 'cancelled' ? (
                        <div className="space-y-2.5 p-3 bg-rose-50 border-2 border-rose-500 text-gray-950 font-mono">
                          <div className="flex items-center gap-1.5 text-rose-700 font-black text-xs uppercase">
                            <ShieldAlert className="w-4 h-4" />
                            <span>❌ REQUEST CANCELLED</span>
                          </div>
                          <p className="text-[9px] uppercase leading-relaxed text-gray-800">
                            Your recent purchase request was <strong>CANCELLED</strong> by Operator (adhyangiri6@gmail.com).
                            <strong> NO PREMIUM HAS BEEN ASSIGNED.</strong>
                          </p>
                          <button
                            onClick={() => {
                              sounds.playPunchyCTA();
                              setShowPremiumCheckout(true);
                            }}
                            className="w-full bg-rose-600 text-white hover:bg-black font-mono text-[9px] font-black py-1.5 px-2 uppercase tracking-wider transition-all"
                          >
                            [ 🔄 RE-SUBMIT PURCHASE REQUEST ]
                          </button>
                        </div>
                      ) : showPremiumCheckout ? (
                        <div className="space-y-3">
                          <h4 className="font-mono text-xs font-black text-shonen-orange flex items-center gap-1.5 uppercase tracking-wider">
                            👑 PREMIUM CHECKOUT GATEWAY
                          </h4>
                          
                          <div className="bg-gray-50 border border-gray-200 p-3 text-left space-y-2.5 text-gray-950">
                            <span className="font-mono text-[9px] text-gray-500 uppercase block text-center">TARGET GATEWAY: FAMPAY UPI ID</span>
                            <span className="font-black font-mono text-shonen-orange text-xs tracking-wider block text-center">9368427694@fam</span>
                            
                            {/* Mobile deep link or QR code */}
                            {typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768) ? (
                              <a
                                href="upi://pay?pa=9368427694@fam&pn=VOTE_ARENA_PREMIUM&am=100&cu=INR"
                                onClick={() => sounds.playPunchyCTA()}
                                className="block text-center bg-shonen-orange text-white font-black font-mono text-[9px] py-1.5 px-3 uppercase hover:bg-black transition-all rounded-none"
                              >
                                [ 📱 PAY INR WITH UPI WALLET ]
                              </a>
                            ) : (
                              <div className="space-y-1.5 text-center">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent("upi://pay?pa=9368427694@fam&pn=VOTE_ARENA_PREMIUM&am=100&cu=INR")}`} 
                                  alt="Premium UPI QR" 
                                  referrerPolicy="no-referrer"
                                  className="w-24 h-24 mx-auto border border-shonen-orange p-1 bg-white"
                                />
                                <span className="font-mono text-[8px] text-gray-500 uppercase block">SCAN WITH GPAY / PHONEPE / BHIM</span>
                              </div>
                            )}

                            <p className="font-mono text-[9px] text-gray-500 leading-relaxed uppercase text-justify border-t border-gray-200 pt-2">
                              ⚡ <span className="text-shonen-orange font-bold">CONFIRMATION NOTICE:</span> Request will be transmitted to adhyangiri6@gmail.com. Premium begins ONLY when adhyangiri6@gmail.com approves YES.
                            </p>
                          </div>

                          {/* Manual Verification Form */}
                          <div className="space-y-2">
                            <label className="block text-[8px] font-mono text-gray-500 uppercase font-black">
                              ENTER UPI TRANSACTION REF NO. / UTR TO TRANSMIT
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 12-digit UPI Transaction ID"
                              value={premiumUtr}
                              onChange={(e) => setPremiumUtr(e.target.value)}
                              className="w-full bg-white border border-gray-300 hover:border-shonen-orange px-2 py-1 font-mono text-[10px] text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-shonen-orange"
                            />
                            
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playTick();
                                  setShowPremiumCheckout(false);
                                  setPremiumUtr('');
                                }}
                                className="flex-1 bg-white text-gray-600 font-mono text-[9px] py-1.5 font-bold hover:text-gray-950 transition-colors uppercase border border-gray-300"
                              >
                                BACK
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!premiumUtr.trim()) {
                                    sounds.playError();
                                    alert("PLEASE ENTER YOUR UPI TRANSACTION REFERENCE ID / UTR.");
                                    return;
                                  }
                                  sounds.playImpact();
                                  setIsPremiumPending(true);
                                  if (onUpgradePremium) {
                                    onUpgradePremium(premiumUtr.trim());
                                  }
                                  setShowPremiumCheckout(false);
                                }}
                                className="flex-1 bg-shonen-orange text-white font-mono text-[9px] py-1.5 font-black hover:bg-black transition-colors uppercase"
                              >
                                SUBMIT REF
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <h4 className="font-mono text-xs font-black text-shonen-orange flex items-center gap-1.5 uppercase tracking-wider">
                            👑 ACTIVATE PREMIUM MEMBERSHIP
                          </h4>
                          <p className="text-[9px] font-mono text-gray-500 uppercase leading-relaxed">
                            UPGRADE CODENAME IDENT TO THE PREMIUM TIER TO UNLOCK UNLIMITED DAILY ARENA LAUNCHES (UP FROM 5) AND THE GLOWING PROFILE EFFECT FOR ONLY $1.
                          </p>
                          <button
                            onClick={() => {
                              sounds.playPunchyCTA();
                              setShowPremiumCheckout(true);
                            }}
                            className="w-full bg-shonen-orange text-white hover:bg-black hover:text-white border border-black font-mono text-[9px] font-black py-2 px-3 uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> UPGRADE ACCESS // $1 (1 MONTH)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section tab for preferences */}
                    <div className="space-y-4 text-gray-950">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-shonen-orange uppercase border-b border-gray-200 pb-1">
                        <Settings className="w-4 h-4" /> [PREFERENCES_CALIBRATOR]
                      </div>

                      {/* Customize Avatar abbreviation */}
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                          CODENAME AVATAR TAG (2-4 SYMBOLS)
                        </label>
                        <input
                          type="text"
                          value={prefAvatar}
                          onChange={(e) => setPrefAvatar(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-shonen-orange px-3 py-1.5 font-mono text-xs text-gray-950 focus:outline-none"
                        />
                      </div>

                      {/* Profile Picture Option */}
                      <div className="p-3 bg-gray-50 border border-gray-200 flex flex-col gap-2.5">
                        <span className="block text-[10px] font-mono text-gray-500 uppercase font-black tracking-widest text-left">
                          OPERATOR AVATAR / PROFILE PICTURE
                        </span>
                        
                        {rawImageUrl ? (
                          <ImageCropper
                            imageUrl={rawImageUrl}
                            onCropComplete={(croppedUrl) => {
                              setAvatarUrl(croppedUrl);
                              setRawImageUrl(null);
                              if (onUpdateAvatarUrl) {
                                onUpdateAvatarUrl(croppedUrl);
                              }
                            }}
                            onCancel={() => {
                              setRawImageUrl(null);
                            }}
                          />
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-3">
                              <div 
                                onClick={() => {
                                  sounds.playTick();
                                  fileInputRef.current?.click();
                                }}
                                className="relative w-12 h-12 bg-white border-2 border-black cursor-pointer group shrink-0 flex items-center justify-center overflow-hidden hover:border-shonen-orange transition-all shadow-sm"
                                title="Click to choose a file"
                              >
                                {avatarUrl ? (
                                  <img 
                                    src={avatarUrl} 
                                    alt="Avatar preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.username || 'OPERATOR'}`;
                                    }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-shonen-orange transition-colors">
                                    <Camera className="w-4 h-4 mb-0.5" />
                                    <span className="text-[6px] font-mono font-black uppercase">ADD PIC</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[8px] font-mono font-bold text-white uppercase text-center leading-none">UPLOAD</span>
                                </div>
                              </div>

                              <div className="flex-1 space-y-1.5">
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sounds.playTick();
                                      fileInputRef.current?.click();
                                    }}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 hover:border-black text-[8px] font-mono font-black py-1 px-1.5 uppercase transition-all text-center cursor-pointer"
                                  >
                                    [ CHOOSE FILE ]
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sounds.playTick();
                                      setShowPresetSelector(!showPresetSelector);
                                    }}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 hover:border-black text-[8px] font-mono font-black py-1 px-1.5 uppercase transition-all text-center cursor-pointer"
                                  >
                                    [ PRESETS ]
                                  </button>
                                </div>

                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="OR ENTER IMAGE URL..."
                                    value={avatarUrl && !avatarUrl.startsWith('data:') ? avatarUrl : ''}
                                    onChange={(e) => {
                                      setAvatarUrl(e.target.value);
                                    }}
                                    className="flex-1 bg-white border border-gray-300 hover:border-gray-400 focus:border-shonen-orange px-1.5 py-1 font-mono text-[8px] text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                                  />
                                  {avatarUrl && !avatarUrl.startsWith('data:') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        sounds.playTick();
                                        setRawImageUrl(avatarUrl);
                                      }}
                                      className="bg-shonen-orange text-white text-[8px] font-mono font-black px-1.5 py-1 uppercase animate-pulse"
                                    >
                                      CROP
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                            
                            {/* Presets Selector Row */}
                            {showPresetSelector && (
                              <div className="mt-1 border-t border-dashed border-gray-200 pt-2 w-full">
                                <p className="text-[7px] font-mono text-gray-400 uppercase mb-1.5 text-center font-bold tracking-wider">SELECT RETRO FIGHTER PORTRAITS & CROP</p>
                                <div className="grid grid-cols-6 gap-1.5">
                                  {PRESET_AVATARS.map((preset, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        sounds.playSelect();
                                        setRawImageUrl(preset.url);
                                      }}
                                      className={`aspect-square bg-white border cursor-pointer hover:border-shonen-orange transition-all p-0.5 overflow-hidden flex items-center justify-center ${
                                        avatarUrl === preset.url ? 'border-shonen-orange ring-1' : 'border-gray-200'
                                      }`}
                                      title={preset.name}
                                    >
                                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Accent Tint */}
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-2 tracking-widest">
                          SELECT PREFERRED ARENA ACCENT TINT
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['cyan', 'pink', 'yellow'] as const).map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                sounds.playTick();
                                setPrefAccent(col);
                              }}
                              className={`font-mono text-[10px] py-1.5 font-bold border capitalize transition-all ${
                                prefAccent === col
                                  ? 'bg-shonen-orange text-white border-shonen-orange'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-shonen-orange hover:text-shonen-orange'
                              }`}
                            >
                              {col} Accent
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Frequency Audio Bias */}
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-2 tracking-widest">
                          SYNTHESIZER OSCILLATOR BIAS
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['standard', 'high-frequency', 'sub-harmonic'] as const).map((bias) => (
                            <button
                              key={bias}
                              type="button"
                              onClick={() => {
                                sounds.playTick();
                                setPrefBias(bias);
                              }}
                              className={`font-mono text-[9px] py-1.5 font-bold border uppercase transition-all truncate px-1 ${
                                prefBias === bias
                                  ? 'bg-shonen-orange text-white border-shonen-orange'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-shonen-orange hover:text-shonen-orange'
                              }`}
                            >
                              {bias}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Alert toggles */}
                      <div className="flex justify-between items-center bg-white p-3 border border-gray-200">
                        <div className="font-mono text-xs">
                          <p className="font-bold text-gray-950 uppercase">ENABLE REACTIVE ALERTS</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-0.5">PLAY CUSTOM CLIENT AUDIO EMITTERS</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefSounds}
                          onChange={(e) => {
                            sounds.playTick();
                            setPrefSounds(e.target.checked);
                          }}
                          className="w-4 h-4 accent-shonen-orange cursor-pointer"
                        />
                      </div>

                      <button
                        onClick={handleSavePreferences}
                        className="w-full bg-shonen-orange text-white font-black text-xs py-2.5 px-4 uppercase tracking-widest transition-all hover:bg-black border border-black flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-4 h-4" /> COMMIT CALIBRATIONS
                      </button>
                    </div>

                    {/* Section history */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-shonen-orange uppercase border-b border-gray-200 pb-1">
                        <History className="w-4 h-4" /> [TRANSMISSION_HISTORY_LOG]
                      </div>

                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {currentUser.history && currentUser.history.length > 0 ? (
                          currentUser.history.slice().reverse().map((hist, idx) => (
                            <div key={idx} className="p-2.5 bg-white border border-gray-200 font-mono text-[10px] flex justify-between items-start gap-3 text-gray-950">
                              <div>
                                <span className="text-shonen-orange uppercase font-bold block">
                                  {hist.event}
                                </span>
                                <span className="text-gray-500 mt-0.5 block">{hist.details}</span>
                              </div>
                              <span className="text-gray-400 flex items-center gap-0.5 whitespace-nowrap">
                                <Clock className="w-3 h-3" /> {hist.timestamp}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center font-mono text-[10px] text-gray-500 py-4 uppercase">
                            NO ACTIVE LOGGED TRANSMISSIONS FOUND.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* De-Authorize Logout section at bottom */}
            {currentUser && (
              <div className="pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => {
                    sounds.playError();
                    onLogout();
                  }}
                  className="w-full bg-transparent border-2 border-black text-black hover:bg-shonen-orange hover:text-white font-mono text-xs font-black py-3 px-4 uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer clip-diagonal-reverse"
                >
                  <LogOut className="w-4 h-4" /> SECURE_DE-AUTHORIZE_LOG_OUT
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
