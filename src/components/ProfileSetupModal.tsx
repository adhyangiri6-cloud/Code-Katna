import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from './SoundManager';
import { Terminal, ShieldAlert, CheckCircle2, UserCheck, Camera } from 'lucide-react';

const PRESET_AVATARS = [
  { name: 'KAGE', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=kage&backgroundColor=ff6b00' },
  { name: 'CHICA', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=chica&backgroundColor=00f0ff' },
  { name: 'SENSEI', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sensei&backgroundColor=ff0055' },
  { name: 'CYBORG', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cyborg&backgroundColor=ffcc00' },
  { name: 'MATRIX', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=matrix&backgroundColor=00ff66' },
  { name: 'ARENA', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=arena&backgroundColor=9900ff' }
];

interface ProfileSetupModalProps {
  isOpen: boolean;
  onSave: (profileData: {
    username: string;
    bio: string;
    gender: string;
    age: number | null;
    avatar_url?: string;
  }) => Promise<void>;
  initialUsername?: string;
  initialBio?: string;
  initialAvatarUrl?: string;
}

export default function ProfileSetupModal({ 
  isOpen, 
  onSave, 
  initialUsername = '',
  initialBio = '',
  initialAvatarUrl = ''
}: ProfileSetupModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [gender, setGender] = useState('UNSPECIFIED');
  const [age, setAge] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarUrl(reader.result as string);
      sounds.playTick();
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      sounds.playError();
      setError('OPERATOR CODE (USERNAME) REQUISITE IS MANDATORY.');
      return;
    }

    if (username.length < 3) {
      sounds.playError();
      setError('OPERATOR CODE MUST BE AT LEAST 3 CHARACTER SIGNALS.');
      return;
    }

    setIsSaving(true);
    sounds.playSelect();

    try {
      await onSave({
        username: username.trim(),
        bio: bio.trim(),
        gender,
        age: age ? parseInt(age, 10) : null,
        avatar_url: avatarUrl
      });
      
      setSuccess(true);
      sounds.playSelect();
    } catch (err: any) {
      sounds.playError();
      setError(err?.message || 'FAILED TO INTEGRATE PROFILE REGISTRY PROTOCOL.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Cyber Scanlines */}
          <div className="absolute inset-0 scanlines opacity-[0.03] pointer-events-none z-50" />

          {/* Container card */}
          <motion.div
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-lg bg-white border-4 border-black p-6 md:p-8 clip-cyber-card overflow-hidden z-50 shadow-lg text-gray-950"
          >
            {/* orange and white custom stripe bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 font-mono text-shonen-orange text-xs font-black uppercase mb-1">
                <Terminal className="w-3.5 h-3.5 animate-pulse" />
                SECURITY_CLEARANCE // COMPLETE_YOUR_PROFILE
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-950 uppercase tracking-tighter">
                ESTABLISH <span className="text-shonen-orange">OPERATOR SYSTEM ID</span>
              </h2>
              <p className="text-[10px] font-mono text-gray-500 mt-2 uppercase tracking-wider leading-relaxed">
                WELCOME, OPERATOR. COMPLETE YOUR NEURAL NETWORK HANDSHAKE TO ACCESS THE LIVE BRACKET SPECTRE ENGINE.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 bg-shonen-orange/10 border-2 border-shonen-orange p-3.5 font-mono text-xs text-shonen-orange flex items-start gap-2"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">AUTHENTICATION FAULT:</span> {error}
                </div>
              </motion.div>
            )}

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-full text-emerald-500">
                  <CheckCircle2 className="w-12 h-12 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-gray-950 uppercase">NEURAL INTERFACE CALIBRATED</h3>
                <p className="font-mono text-xs text-gray-500 max-w-xs mx-auto uppercase">
                  OPERATOR credentials have been securely stored in decentralized matrix schemas. Redirecting to Arena floor...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Picture Option */}
                <div className="p-4 bg-gray-50 border border-gray-200 mb-4 flex flex-col gap-3">
                  <span className="block text-[10px] font-mono text-gray-500 uppercase font-black tracking-widest text-left">
                    OPERATOR AVATAR / PROFILE PICTURE
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => {
                        sounds.playTick();
                        fileInputRef.current?.click();
                      }}
                      className="relative w-16 h-16 bg-white border-2 border-black cursor-pointer group shrink-0 flex items-center justify-center overflow-hidden hover:border-shonen-orange transition-all shadow-sm"
                      title="Click to choose a file"
                    >
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'OPERATOR'}`;
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-shonen-orange transition-colors">
                          <Camera className="w-5 h-5 mb-0.5" />
                          <span className="text-[7px] font-mono font-black uppercase">ADD PIC</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[9px] font-mono font-bold text-white uppercase text-center leading-none">UPLOAD</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTick();
                            fileInputRef.current?.click();
                          }}
                          className="flex-1 bg-white border border-gray-300 text-gray-700 hover:border-black text-[9px] font-mono font-black py-1.5 px-2 uppercase transition-all text-center cursor-pointer"
                        >
                          [ CHOOSE FILE ]
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTick();
                            setShowPresetSelector(!showPresetSelector);
                          }}
                          className="flex-1 bg-white border border-gray-300 text-gray-700 hover:border-black text-[9px] font-mono font-black py-1.5 px-2 uppercase transition-all text-center cursor-pointer"
                        >
                          [ PRESETS ]
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="OR PASTE IMAGE URL FROM WEB..."
                        value={avatarUrl}
                        onChange={(e) => {
                          sounds.playTick();
                          setAvatarUrl(e.target.value);
                        }}
                        className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-shonen-orange px-2 py-1.5 font-mono text-[9px] text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                      />
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
                    <div className="mt-1 border-t border-dashed border-gray-200 pt-2.5 w-full">
                      <p className="text-[8px] font-mono text-gray-400 uppercase mb-2 text-center font-bold tracking-wider">SELECT RETRO FIGHTER PORTRAITS</p>
                      <div className="grid grid-cols-6 gap-2">
                        {PRESET_AVATARS.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              sounds.playSelect();
                              setAvatarUrl(preset.url);
                            }}
                            className={`aspect-square bg-white border-2 cursor-pointer hover:border-shonen-orange transition-all p-0.5 overflow-hidden flex items-center justify-center ${
                              avatarUrl === preset.url ? 'border-shonen-orange ring-1 ring-shonen-orange' : 'border-gray-200'
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

                {/* Username Input */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                    OPERATOR NAME / USERNAME <span className="text-shonen-orange">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      sounds.playTick();
                      setUsername(e.target.value.toUpperCase());
                    }}
                    placeholder="ENTER OPERATOR CALLSIGN..."
                    maxLength={20}
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-3.5 py-2.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                  />
                  <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                    3-20 CHARACTER CODES, RENDERED NATIVELY ON STREAM GRID.
                  </p>
                </div>

                {/* Bio Textarea */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                    BIOGRAPHY / NEURAL SIGNATURE
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => {
                      sounds.playTick();
                      setBio(e.target.value);
                    }}
                    placeholder="DESCRIBE YOUR OPERATOR ROLE OR ALIAS..."
                    maxLength={160}
                    rows={3}
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-3.5 py-2.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all resize-none"
                  />
                  <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                    A BRIEF TRANSMISSION SHARD RENDERED TO OTHER OPERATORS.
                  </p>
                </div>

                {/* Grid layout for Gender and Age */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Gender Select */}
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                      IDENTITY SPECTRUM
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => {
                        sounds.playTick();
                        setGender(e.target.value);
                      }}
                      className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-3.5 py-2.5 font-mono text-xs text-gray-950 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="UNSPECIFIED">UNSPECIFIED</option>
                      <option value="CYBORG">CYBORG</option>
                      <option value="ANDROID">ANDROID</option>
                      <option value="MALE">OPERATOR_MALE</option>
                      <option value="FEMALE">OPERATOR_FEMALE</option>
                      <option value="HACKER">NET_HACKER</option>
                      <option value="NON_BINARY">NON_BINARY</option>
                    </select>
                  </div>

                  {/* Age Input */}
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase font-black mb-1.5 tracking-widest">
                      SYSTEM CYCLE (AGE)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => {
                        sounds.playTick();
                        setAge(e.target.value);
                      }}
                      min="1"
                      max="120"
                      placeholder="CYCLES..."
                      className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-shonen-orange px-3.5 py-2.5 font-mono text-xs text-gray-950 placeholder-gray-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Action Save button */}
                <div className="pt-4 flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSaving}
                    className={`w-full text-white font-black text-xs py-4 px-4 uppercase tracking-widest transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
                      isSaving 
                        ? 'bg-zinc-300 border-zinc-300 cursor-not-allowed text-zinc-500' 
                        : 'bg-shonen-orange border-2 border-black hover:bg-black'
                    }`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        SYNCING TERMINAL MATRIX...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 shrink-0" />
                        SAVE & INITIALIZE PROFILE
                      </>
                    )}
                  </motion.button>

                  <div className="font-mono text-[8px] text-gray-500 uppercase text-center tracking-wider">
                    DECRYPT CODE ID: SYNC_PASS_V4.9 // AUTHENTICITY VALIDATED BY SUPABASE PROTOCOL
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
