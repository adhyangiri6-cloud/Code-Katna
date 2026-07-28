import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { Terminal, Send, Search, Users, ShieldAlert, CheckCircle2, MessageCircle, X, Instagram, Copy, Download, Share2, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
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

  // Instagram Story specific state
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState<string | null>(null);

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
    const text = `Deploy your vote in this Arena bracket battle! ${window.location.origin}/?poll=${poll.id}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Instagram Story Share Helpers
  const getPollShareUrl = () => {
    return `${window.location.origin}/?poll=${poll.id}`;
  };

  const handleCopyStoryLink = async () => {
    sounds.playSelect();
    const url = getPollShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setSuccessMsg('INSTAGRAM STORY LINK COPIED! ADD AS "LINK STICKER" IN INSTAGRAM STORY.');
      sounds.playPunchyCTA();
      addHistoryItemLocal('IG_STORY_LINK_COPY', `Copied Instagram Story link sticker URL for poll: ${poll.title}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('FAILED TO COPY LINK TO CLIPBOARD.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleGenerateStoryGraphic = async (): Promise<Blob | null> => {
    setIsGeneratingStory(true);
    try {
      const blob = await createStoryCanvasBlob(poll);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setStoryImageUrl(url);
      }
      return blob;
    } catch (e) {
      console.error('Story canvas creation error:', e);
      return null;
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleDownloadStoryImage = async () => {
    sounds.playSelect();
    setErrorMsg(null);
    setSuccessMsg(null);
    let blob: Blob | null = null;
    if (storyImageUrl) {
      try {
        const res = await fetch(storyImageUrl);
        blob = await res.blob();
      } catch (e) {
        blob = null;
      }
    }
    if (!blob) {
      blob = await handleGenerateStoryGraphic();
    }

    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `velgre-instagram-story-${poll.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSuccessMsg('INSTAGRAM STORY GRAPHIC DOWNLOADED! UPLOAD TO INSTAGRAM STORY.');
      sounds.playPunchyCTA();
      addHistoryItemLocal('IG_STORY_GRAPHIC_DOWNLOAD', `Downloaded Instagram Story graphic for poll: ${poll.title}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('COULD NOT GENERATE STORY GRAPHIC.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleNativeShareInstagramStory = async () => {
    sounds.playSelect();
    setErrorMsg(null);
    setSuccessMsg(null);

    const shareUrl = getPollShareUrl();
    const shareText = `Vote live in this Velgre Arena poll: "${poll.title}"! 🔥`;

    // 1. Try navigator.share with generated story PNG image if supported
    try {
      let blob: Blob | null = null;
      if (storyImageUrl) {
        try {
          const res = await fetch(storyImageUrl);
          blob = await res.blob();
        } catch (e) {
          blob = null;
        }
      }
      if (!blob) {
        blob = await handleGenerateStoryGraphic();
      }

      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'story.png', { type: 'image/png' })] })) {
        const file = new File([blob], `velgre-poll-${poll.id}.png`, { type: 'image/png' });
        await navigator.share({
          title: `Velgre Poll: ${poll.title}`,
          text: shareText,
          url: shareUrl,
          files: [file]
        });
        setSuccessMsg('SHARED TO INSTAGRAM / SYSTEM SHARE SHEET SUCCESSFULLY!');
        sounds.playPunchyCTA();
        return;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return; // User cancelled
      console.warn('File share unavailable, falling back to URL share:', e);
    }

    // 2. Fallback to standard navigator.share
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Velgre Poll: ${poll.title}`,
          text: shareText,
          url: shareUrl
        });
        setSuccessMsg('SHARED TO INSTAGRAM / SYSTEM SHARE SHEET SUCCESSFULLY!');
        sounds.playPunchyCTA();
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }

    // 3. Fallback: Copy link and open Instagram app / web
    await handleCopyStoryLink();
    setTimeout(() => {
      window.open('https://instagram.com', '_blank');
    }, 1000);
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
            className="relative w-full max-w-md bg-white border-4 border-black p-6 md:p-8 clip-cyber-card overflow-hidden z-50 shadow-lg text-gray-950 max-h-[90vh] overflow-y-auto"
          >
            {/* Caution Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[linear-gradient(45deg,#FF6B00_25%,#fff_25%,#fff_50%,#FF6B00_50%,#FF6B00_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6 pt-2">
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
                className="p-1.5 border border-gray-200 hover:border-shonen-orange hover:text-shonen-orange transition-all cursor-pointer"
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

              {/* INSTAGRAM STORIES TRANSMISSION LAYER */}
              <div className="border-2 border-black p-4 bg-gradient-to-br from-purple-900 via-pink-700 to-amber-600 text-white relative overflow-hidden shadow-sm">
                <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                  <Instagram className="w-32 h-32 text-white" />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-amber-300" />
                      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-200">
                        INSTAGRAM STORY STUDIO
                      </span>
                    </div>
                    <span className="bg-black/40 text-amber-300 text-[8px] font-mono font-black uppercase px-2 py-0.5 border border-amber-300/40">
                      STORY READY
                    </span>
                  </div>

                  <p className="text-xs font-sans font-bold leading-tight">
                    Share this live poll to Instagram Stories as an interactive graphic card with a Link Sticker!
                  </p>

                  {/* Primary Share Button */}
                  <button
                    onClick={handleNativeShareInstagramStory}
                    disabled={isGeneratingStory}
                    className="w-full py-3 bg-white text-gray-950 hover:bg-amber-300 font-mono text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border-2 border-black shadow-md cursor-pointer"
                  >
                    <Instagram className="w-4 h-4 text-purple-700" />
                    <span>{isGeneratingStory ? 'GENERATING STORY...' : '[ 📸 SHARE TO INSTAGRAM STORIES ]'}</span>
                  </button>

                  {/* Secondary Story Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCopyStoryLink}
                      className="py-2 px-2 bg-black/60 hover:bg-black text-white font-mono text-[9px] font-bold uppercase tracking-tight transition-all border border-white/30 flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Copy URL for Instagram Story Link Sticker"
                    >
                      <Copy className="w-3 h-3 text-amber-300" />
                      <span>COPY LINK STICKER</span>
                    </button>

                    <button
                      onClick={handleDownloadStoryImage}
                      disabled={isGeneratingStory}
                      className="py-2 px-2 bg-black/60 hover:bg-black text-white font-mono text-[9px] font-bold uppercase tracking-tight transition-all border border-white/30 flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Download 1080x1920 Story PNG image"
                    >
                      <Download className="w-3 h-3 text-amber-300" />
                      <span>SAVE STORY PNG</span>
                    </button>
                  </div>

                  {/* Preview Toggle Button */}
                  <button
                    onClick={async () => {
                      sounds.playSelect();
                      if (!storyImageUrl) {
                        await handleGenerateStoryGraphic();
                      }
                      setShowStoryPreview(!showStoryPreview);
                    }}
                    className="w-full py-1.5 text-center text-[9px] font-mono font-bold uppercase text-amber-200 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{showStoryPreview ? 'HIDE STORY CARD PREVIEW' : 'PREVIEW 9:16 STORY CARD'}</span>
                  </button>

                  {/* Interactive Story Graphic Preview Overlay */}
                  {showStoryPreview && (
                    <div className="mt-3 p-3 bg-black/80 border-2 border-amber-300/60 rounded-none space-y-2">
                      <span className="font-mono text-[8px] text-amber-300 uppercase block font-bold">
                        1080x1920 STORY CANVAS PREVIEW
                      </span>
                      {storyImageUrl ? (
                        <div className="aspect-[9/16] w-full max-w-[200px] mx-auto border border-white/20 overflow-hidden shadow-lg bg-black">
                          <img src={storyImageUrl} alt="Instagram Story Preview" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="py-8 text-center font-mono text-[10px] text-gray-400">
                          {isGeneratingStory ? 'RENDERING CANVAS...' : 'CLICK GENERATE TO PREVIEW STORY CARD'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* EXTERNAL WHATSAPP PORT */}
              <div>
                <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-2">
                  OTHER EXTERNAL CHANNELS
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

// Canvas generator helper for 1080x1920 Instagram Story PNG image
function createStoryCanvasBlob(poll: Poll): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    // 1. Dark Shonen Arena Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGradient.addColorStop(0, '#0a0a0f');
    bgGradient.addColorStop(0.5, '#161822');
    bgGradient.addColorStop(1, '#050508');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Hazard Stripes Top
    for (let x = -100; x < 1200; x += 80) {
      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 40, 0);
      ctx.lineTo(x + 10, 28);
      ctx.lineTo(x - 30, 28);
      ctx.closePath();
      ctx.fill();
    }

    // Top Title & Subtitle
    ctx.fillStyle = '#FF6B00';
    ctx.font = '900 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ VELGRE // INSTAGRAM STORY ARENA', 540, 180);

    ctx.fillStyle = '#A0A5B5';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('REAL-TIME MATCHUP TRANSMISSION', 540, 225);

    // Card Box Dimensions
    const cardX = 90;
    const cardY = 280;
    const cardW = 900;
    const cardH = 1180;

    // Outer Glow / Accent Shadow
    ctx.fillStyle = 'rgba(255, 107, 0, 0.25)';
    ctx.fillRect(cardX + 24, cardY + 24, cardW, cardH);

    // Main Card Box
    ctx.fillStyle = '#12131C';
    ctx.fillRect(cardX, cardY, cardW, cardH);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 14;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 4;
    ctx.strokeRect(cardX + 10, cardY + 10, cardW - 20, cardH - 20);

    // Category Tag
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(cardX + 50, cardY + 60, 300, 56);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((poll.category || 'LIVE ARENA').toUpperCase(), cardX + 75, cardY + 98);

    // Title (wrapped)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px sans-serif';
    const words = (poll.title || '').toUpperCase().split(' ');
    let line = '';
    let currentY = cardY + 180;
    const maxTitleWidth = cardW - 120;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && i > 0) {
        ctx.fillText(line, cardX + 50, currentY);
        line = words[i] + ' ';
        currentY += 62;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, cardX + 50, currentY);

    // Total Votes
    const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    // Options rendering
    let optionStartY = Math.max(currentY + 70, cardY + 400);
    const optionsToRender = poll.options.slice(0, 4);

    optionsToRender.forEach((opt, idx) => {
      const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;

      // Container background
      ctx.fillStyle = '#1B1C28';
      ctx.fillRect(cardX + 50, optionStartY, cardW - 100, 110);

      // Percentage bar
      if (pct > 0) {
        const barWidth = ((cardW - 100) * pct) / 100;
        ctx.fillStyle = idx === 0 ? '#FF6B00' : '#2A2C3E';
        ctx.fillRect(cardX + 50, optionStartY, barWidth, 110);
      }

      // Border around option
      ctx.strokeStyle = idx === 0 ? '#FF6B00' : '#2F3246';
      ctx.lineWidth = 4;
      ctx.strokeRect(cardX + 50, optionStartY, cardW - 100, 110);

      // Option Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((opt.text || '').slice(0, 24).toUpperCase(), cardX + 80, optionStartY + 66);

      // Percentage
      ctx.font = '900 36px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = idx === 0 ? '#FF6B00' : '#FFFFFF';
      ctx.fillText(`${pct}%`, cardX + cardW - 80, optionStartY + 66);

      optionStartY += 135;
    });

    // Total votes badge inside card
    ctx.fillStyle = '#FF6B00';
    ctx.font = '900 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${totalVotes.toLocaleString()} VOTES RECORDED`, 540, cardY + cardH - 50);

    // Call To Action below card
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔗 ADD LINK STICKER TO VOTE LIVE!', 540, 1560);

    ctx.fillStyle = '#FF6B00';
    ctx.font = '900 32px monospace';
    ctx.fillText(window.location.host.toUpperCase(), 540, 1610);

    // Bottom hazard stripes
    for (let x = -100; x < 1200; x += 80) {
      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.moveTo(x, 1920);
      ctx.lineTo(x + 40, 1920);
      ctx.lineTo(x + 70, 1892);
      ctx.lineTo(x + 30, 1892);
      ctx.closePath();
      ctx.fill();
    }

    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
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

