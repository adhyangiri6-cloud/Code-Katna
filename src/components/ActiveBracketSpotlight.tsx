import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Matchup, User } from '../types';
import { sounds } from './SoundManager';
import { Trophy, Swords, Sparkles, Heart, Star, Flame } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SpotlightProps {
  matchups: Matchup[];
  onVote: (matchupId: string, choice: 'A' | 'B') => void;
  triggerScreenShake: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export default function ActiveBracketSpotlight({ 
  matchups, 
  onVote, 
  triggerScreenShake,
  currentUser,
  onOpenAuth
}: SpotlightProps) {
  const [activeId, setActiveId] = useState<string>(matchups[0]?.id || 'goku-saitama');
  const [hoveredCard, setHoveredCard] = useState<'A' | 'B' | null>(null);
  const [impactEffect, setImpactEffect] = useState<'A' | 'B' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const activeMatch = matchups.find((m) => m.id === activeId) || matchups[0];

  const handleVoteClick = async (choice: 'A' | 'B') => {
    if (!activeMatch || activeMatch.hasVoted) {
      sounds.playError();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      sounds.playError();
      setNotification('Please sign in to cheer for your favorite character! ✨');
      setTimeout(() => setNotification(null), 4000);
      onOpenAuth();
      return;
    }

    const contestantName = choice === 'A' ? activeMatch.contestantA.name : activeMatch.contestantB.name;
    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.user_metadata?.full_name || userEmail?.split('@')[0] || 'Cute Fan';

    (async () => {
      try {
        await supabase
          .from('votes')
          .insert([
            {
              matchup_id: activeMatch.id,
              character_name: contestantName,
              choice: choice,
              timestamp: new Date().toISOString(),
              user_id: userId,
              user_email: userEmail,
              user_name: userName
            }
          ]);
      } catch (err) {
        // handled silently
      }
    })();
    
    sounds.playWhooshImpact();
    triggerScreenShake();
    
    setImpactEffect(choice);
    setTimeout(() => setImpactEffect(null), 500);

    onVote(activeMatch.id, choice);
  };

  const handleVote = async (tournamentId: string, optionId: 'A' | 'B', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await handleVoteClick(optionId);
  };

  if (!activeMatch) return null;

  const total = activeMatch.contestantA.votes + activeMatch.contestantB.votes;
  const percentA = total > 0 ? ((activeMatch.contestantA.votes / total) * 100).toFixed(1) : '50.0';
  const percentB = total > 0 ? ((activeMatch.contestantB.votes / total) * 100).toFixed(1) : '50.0';

  return (
    <div id="bracket-spotlight" className="relative w-full max-w-6xl mx-auto px-4 py-10 z-10">
      {/* Adorable Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-pink-100/90 text-pink-700 text-xs font-black px-3.5 py-1 rounded-full border border-pink-200 mb-2 shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
            <span>COMMUNITY SPOTLIGHT BATTLES</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            FAVORITE <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-500">CLASH SHOWDOWN</span>
            <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
          </h2>
          <p className="text-gray-500 font-sans text-xs md:text-sm mt-1">
            Tap a contender to cheer and cast your vote! Instant real-time community results.
          </p>
        </div>

        {/* Adorable Quick Battle Select Slider */}
        <div className="flex flex-wrap gap-2 max-w-full">
          {matchups.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                sounds.playTick();
                setActiveId(m.id);
              }}
              className={`font-sans text-xs font-bold px-4 py-2 transition-all rounded-full border-2 cursor-pointer duration-200 shadow-xs ${
                activeId === m.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 border-pink-500 text-white shadow-md scale-105'
                  : 'bg-white border-pink-100 text-gray-600 hover:border-pink-300 hover:text-pink-600'
              }`}
            >
              🌸 {m.contestantA.name.split(' ')[0]} vs {m.contestantB.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="mb-4 bg-pink-50 border-2 border-pink-300 text-pink-800 font-sans text-xs md:text-sm p-3.5 text-center font-bold rounded-2xl shadow-sm"
        >
          ✨ {notification}
        </motion.div>
      )}

      {/* Main Adorable VS Container */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5 p-4 md:p-6 bg-white/90 border-2 border-pink-100 rounded-3xl shadow-[0_12px_40px_rgba(255,182,193,0.2)]">
        {/* CONTESTANT A (Left Contender) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => handleVote(activeMatch.id, 'A', e)}
          onMouseEnter={() => {
            sounds.playTick();
            setHoveredCard('A');
          }}
          onMouseLeave={() => setHoveredCard(null)}
          className={`relative cursor-pointer overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[300px] md:min-h-[360px] border-2 rounded-3xl transition-all duration-300 ${
            activeMatch.hasVoted === 'A'
              ? 'border-pink-500 bg-pink-50/70 shadow-md ring-2 ring-pink-400'
              : hoveredCard === 'A'
              ? 'border-pink-400 bg-pink-50/40 shadow-lg'
              : 'border-pink-100 bg-gradient-to-b from-white to-pink-50/30'
          }`}
        >
          {/* Flash Effect on Vote */}
          <AnimatePresence>
            {impactEffect === 'A' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pink-400/20 z-30 pointer-events-none rounded-3xl flex items-center justify-center text-4xl"
              >
                💖
              </motion.div>
            )}
          </AnimatePresence>

          {/* Round Header / Status */}
          <div className="flex justify-between items-center z-10">
            <span className="font-sans text-xs font-bold text-pink-700 bg-pink-100/90 px-3 py-1 rounded-full border border-pink-200">
              🌸 {activeMatch.round}
            </span>
            {activeMatch.hasVoted === 'A' && (
              <span className="font-black text-white bg-pink-500 text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Heart className="w-3 h-3 fill-white" /> VOTED!
              </span>
            )}
          </div>

          {/* Contender Avatar Portrait */}
          <div className="my-6 flex justify-center items-center z-10">
            <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-pink-300 animate-spin" style={{ animationDuration: '30s' }} />
              <div className="w-24 h-24 md:w-30 md:h-30 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-black flex items-center justify-center text-4xl shadow-md">
                <span className="select-none font-black text-5xl">
                  {activeMatch.contestantA.avatarCode}
                </span>
              </div>
            </div>
          </div>

          {/* Title & Info */}
          <div className="z-10 mt-auto text-left">
            <span className="font-sans text-xs text-pink-600 font-bold block">
              💖 {activeMatch.contestantA.votes} Supporters
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {activeMatch.contestantA.name}
            </h3>
            <p className="font-sans text-xs text-gray-500 mt-0.5">
              {activeMatch.contestantA.subName}
            </p>
          </div>
        </motion.div>

        {/* CONTESTANT B (Right Contender) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => handleVote(activeMatch.id, 'B', e)}
          onMouseEnter={() => {
            sounds.playTick();
            setHoveredCard('B');
          }}
          onMouseLeave={() => setHoveredCard(null)}
          className={`relative cursor-pointer overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[300px] md:min-h-[360px] border-2 rounded-3xl transition-all duration-300 ${
            activeMatch.hasVoted === 'B'
              ? 'border-purple-500 bg-purple-50/70 shadow-md ring-2 ring-purple-400'
              : hoveredCard === 'B'
              ? 'border-purple-400 bg-purple-50/40 shadow-lg'
              : 'border-purple-100 bg-gradient-to-b from-white to-purple-50/30'
          }`}
        >
          {/* Flash Effect on Vote */}
          <AnimatePresence>
            {impactEffect === 'B' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-purple-400/20 z-30 pointer-events-none rounded-3xl flex items-center justify-center text-4xl"
              >
                💜
              </motion.div>
            )}
          </AnimatePresence>

          {/* Round Header / Status */}
          <div className="flex justify-between items-center z-10">
            <span className="font-sans text-xs font-bold text-purple-700 bg-purple-100/90 px-3 py-1 rounded-full border border-purple-200">
              ⭐ {activeMatch.round}
            </span>
            {activeMatch.hasVoted === 'B' && (
              <span className="font-black text-white bg-purple-600 text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Heart className="w-3 h-3 fill-white" /> VOTED!
              </span>
            )}
          </div>

          {/* Contender Avatar Portrait */}
          <div className="my-6 flex justify-center items-center z-10">
            <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-300 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
              <div className="w-24 h-24 md:w-30 md:h-30 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black flex items-center justify-center text-4xl shadow-md">
                <span className="select-none font-black text-5xl">
                  {activeMatch.contestantB.avatarCode}
                </span>
              </div>
            </div>
          </div>

          {/* Title & Info */}
          <div className="z-10 mt-auto text-left">
            <span className="font-sans text-xs text-purple-600 font-bold block">
              ⭐ {activeMatch.contestantB.votes} Supporters
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {activeMatch.contestantB.name}
            </h3>
            <p className="font-sans text-xs text-gray-500 mt-0.5">
              {activeMatch.contestantB.subName}
            </p>
          </div>
        </motion.div>

        {/* CUTE VS HEART OVERLAY */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-400 flex items-center justify-center shadow-lg border-3 border-white text-white font-black text-xl select-none"
          >
            VS
          </motion.div>
        </div>
      </div>

      {/* ADORABLE STATS & PROGRESS GAUGES */}
      <div className="mt-5 p-5 bg-white/95 border-2 border-pink-100 rounded-3xl flex flex-col gap-3 z-10 relative shadow-sm">
        <div className="flex justify-between items-center text-xs font-sans font-bold">
          <div className="text-pink-600 flex items-center gap-1.5">
            <span>🌸</span> {activeMatch.contestantA.name}: {activeMatch.contestantA.votes} votes ({percentA}%)
          </div>
          <div className="text-purple-600 flex items-center gap-1.5">
            ({percentB}%) {activeMatch.contestantB.votes} votes <span>⭐</span>
          </div>
        </div>

        {/* Cute Rounded Progress Bar */}
        <div className="relative h-7 bg-pink-50 rounded-full overflow-hidden p-1 border border-pink-200 flex">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${percentA}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full flex items-center justify-end pr-2.5 text-[11px] font-black text-white"
          >
            {Number(percentA) > 15 && `${percentA}%`}
          </motion.div>
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${percentB}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center pl-2.5 text-[11px] font-black text-white"
          >
            {Number(percentB) > 15 && `${percentB}%`}
          </motion.div>
        </div>

        <div className="flex justify-between items-center text-[11px] font-sans text-gray-500 pt-1">
          <span className="flex items-center gap-1 text-pink-600 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Tap any card to vote instantly!
          </span>
          <span>Total community cheers: {total.toLocaleString()} ✨</span>
        </div>
      </div>
    </div>
  );
}
