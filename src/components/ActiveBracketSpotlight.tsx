import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Matchup, User } from '../types';
import { sounds } from './SoundManager';
import { Trophy, Swords, Sparkles, ChevronRight, Volume2, VolumeX } from 'lucide-react';
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

    // Verify active Supabase session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      sounds.playError();
      setNotification('SECURE OPERATOR AUTHORIZATION REQUIRED. INITIATING GATEKEEPER CHASSIS...');
      setTimeout(() => setNotification(null), 4000);
      onOpenAuth();
      return;
    }

    const contestantName = choice === 'A' ? activeMatch.contestantA.name : activeMatch.contestantB.name;
    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.user_metadata?.full_name || userEmail?.split('@')[0] || 'Unknown Operator';

    // Securely fire asynchronous Supabase insert in the background
    (async () => {
      try {
        const { error } = await supabase
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
        if (error) {
          console.warn('Supabase insert failed or table votes not created yet. Error details:', error.message);
        } else {
          console.log('Securely registered vote in cloud database:', contestantName);
        }
      } catch (err) {
        console.error('Supabase async transaction error:', err);
      }
    })();
    
    sounds.playWhooshImpact();
    triggerScreenShake();
    
    // Set active impact visual state for flash
    setImpactEffect(choice);
    setTimeout(() => setImpactEffect(null), 500);

    onVote(activeMatch.id, choice);
  };

  const handleVote = async (tournamentId: string, optionId: 'A' | 'B', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    await handleVoteClick(optionId);
  };

  if (!activeMatch) return null;

  const total = activeMatch.contestantA.votes + activeMatch.contestantB.votes;
  const percentA = total > 0 ? ((activeMatch.contestantA.votes / total) * 100).toFixed(1) : '50.0';
  const percentB = total > 0 ? ((activeMatch.contestantB.votes / total) * 100).toFixed(1) : '50.0';

  // Procedural background generators for fighter slots
  const renderFighterBackground = (name: string, isA: boolean) => {
    const letters = name.slice(0, 4).toUpperCase();
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Giant diagonal letters in background */}
        <div className={`absolute font-black text-8xl md:text-9xl tracking-tighter opacity-[0.06] select-none transform rotate-12 ${
          isA ? '-left-6 top-6 text-shonen-orange' : '-right-6 bottom-6 text-gray-400'
        }`}>
          {letters}
        </div>
        
        {/* Diagonal caution / speed lines */}
        <div className={`absolute inset-0 opacity-[0.15] ${
          isA 
            ? 'bg-[linear-gradient(45deg,rgba(255,107,0,0.06)_25%,transparent_25%,transparent_50%,rgba(255,107,0,0.06)_50%,rgba(255,107,0,0.06)_75%,transparent_75%,transparent)]'
            : 'bg-[linear-gradient(-45deg,rgba(0,0,0,0.03)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.03)_50%,rgba(0,0,0,0.03)_75%,transparent_75%,transparent)]'
        } bg-[size:30px_30px]`} />
        
        {/* Half-tone dots */}
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#000000_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>
    );
  };

  return (
    <div id="bracket-spotlight" className="relative w-full max-w-6xl mx-auto px-4 py-8 z-10">
      {/* Spotlight Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-shonen-orange text-white text-xs font-black px-3 py-1 uppercase tracking-widest clip-diagonal-reverse mb-2">
            <Swords className="w-3.5 h-3.5" />
            LIVE BATTLEGROUND
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-950 tracking-tighter uppercase">
            ACTIVE MATCHUP <span className="text-shonen-orange">SPOTLIGHT</span>
          </h2>
          <p className="text-gray-500 font-mono text-xs md:text-sm mt-1">
            ARCADE REACTION TOURNAMENT // MASSIVE VOTE POWER INJECTORS ONLINE.
          </p>
        </div>

        {/* Quick Battle Select Slider */}
        <div className="flex flex-wrap gap-2 max-w-full">
          {matchups.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                sounds.playTick();
                setActiveId(m.id);
              }}
              className={`font-mono text-[10px] md:text-xs font-bold px-3 py-1.5 transition-all clip-cyber-card-sm border-2 duration-200 ${
                activeId === m.id
                  ? 'bg-shonen-orange border-shonen-orange text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-shonen-orange hover:text-shonen-orange'
              }`}
            >
              {m.contestantA.name.split(' ')[0]} VS {m.contestantB.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="mb-4 bg-shonen-orange/10 border-2 border-shonen-orange text-shonen-orange font-mono text-xs md:text-sm p-4 text-center tracking-widest font-black uppercase shadow-sm animate-pulse"
        >
          ⚠️ {notification} ⚠️
        </motion.div>
      )}

      {/* Main VS Container */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 md:p-6 border-2 border-gray-200 clip-cyber-card shadow-sm">
        {/* Absolute Background Elements */}
        <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400 select-none hidden md:block">
          NET_STATUS: OK // FREQ: 322HZ // ROOM_SYS: ONLINE
        </div>

        {/* CONTESTANT A (Left Fighter) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={(e) => handleVote(activeMatch.id, 'A', e)}
          onMouseEnter={() => {
            sounds.playTick();
            setHoveredCard('A');
          }}
          onMouseLeave={() => setHoveredCard(null)}
          className={`relative cursor-pointer overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[300px] md:min-h-[360px] border-4 transition-all duration-300 clip-cyber-card ${
            activeMatch.hasVoted === 'A'
              ? 'border-shonen-orange bg-white'
              : hoveredCard === 'A'
              ? 'border-shonen-orange bg-shonen-orange/5 shadow-md'
              : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          {renderFighterBackground(activeMatch.contestantA.name, true)}

          {/* Flash Effect on Vote */}
          <AnimatePresence>
            {impactEffect === 'A' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-shonen-orange/20 z-30 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Round Header / Status */}
          <div className="flex justify-between items-start z-10">
            <span className="font-mono text-xs font-extrabold text-shonen-orange bg-shonen-orange/10 px-2.5 py-0.5 border border-shonen-orange/20 uppercase tracking-widest">
              {activeMatch.round}
            </span>
            {activeMatch.hasVoted === 'A' && (
              <span className="font-black text-white bg-shonen-orange text-[10px] tracking-widest px-2 py-0.5 clip-diagonal uppercase">
                MY VOTE RECORDED
              </span>
            )}
          </div>

          {/* Procedural Fighter Avatar Portrait */}
          <div className="my-6 flex justify-center items-center z-10">
            <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center transform -skew-x-12">
              {/* Outer decorative square */}
              <div className="absolute inset-0 border-4 border-dashed border-shonen-orange/30 animate-spin" style={{ animationDuration: '40s' }} />
              {/* Inner geometric shapes */}
              <div className="absolute w-24 h-24 md:w-30 md:h-30 bg-shonen-orange text-white font-black flex items-center justify-center text-4xl clip-cyber-card">
                <span className="transform skew-x-12 text-6xl select-none font-black">
                  {activeMatch.contestantA.avatarCode}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-mono text-shonen-orange">
                ID_00{activeMatch.id === 'goku-saitama' ? '1' : '3'}
              </div>
            </div>
          </div>

          {/* Title & Info */}
          <div className="z-10 mt-auto">
            <p className="font-mono text-[10px] text-shonen-orange uppercase font-bold tracking-widest">
              COMBATANT_01 / LEVEL {activeMatch.contestantA.votes}
            </p>
            <h3 className="text-3xl md:text-4xl font-black text-gray-950 uppercase tracking-tighter line-clamp-1">
              {activeMatch.contestantA.name}
            </h3>
            <p className="font-mono text-xs text-gray-500 mt-0.5">
              {activeMatch.contestantA.subName}
            </p>
          </div>
        </motion.div>

        {/* CONTESTANT B (Right Fighter) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={(e) => handleVote(activeMatch.id, 'B', e)}
          onMouseEnter={() => {
            sounds.playTick();
            setHoveredCard('B');
          }}
          onMouseLeave={() => setHoveredCard(null)}
          className={`relative cursor-pointer overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[300px] md:min-h-[360px] border-4 transition-all duration-300 clip-cyber-card ${
            activeMatch.hasVoted === 'B'
              ? 'border-gray-950 bg-white'
              : hoveredCard === 'B'
              ? 'border-gray-950 bg-gray-500/5 shadow-md'
              : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          {renderFighterBackground(activeMatch.contestantB.name, false)}

          {/* Flash Effect on Vote */}
          <AnimatePresence>
            {impactEffect === 'B' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-950/20 z-30 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Round Header / Status */}
          <div className="flex justify-between items-start z-10">
            <span className="font-mono text-xs font-extrabold text-gray-900 bg-gray-100 px-2.5 py-0.5 border border-gray-200 uppercase tracking-widest">
              {activeMatch.round}
            </span>
            {activeMatch.hasVoted === 'B' && (
              <span className="font-black text-white bg-gray-950 text-[10px] tracking-widest px-2 py-0.5 clip-diagonal uppercase">
                MY VOTE RECORDED
              </span>
            )}
          </div>

          {/* Procedural Fighter Avatar Portrait */}
          <div className="my-6 flex justify-center items-center z-10">
            <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center transform skew-x-12">
              {/* Outer decorative square */}
              <div className="absolute inset-0 border-4 border-dashed border-gray-300 animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
              {/* Inner geometric shapes */}
              <div className="absolute w-24 h-24 md:w-30 md:h-30 bg-gray-950 text-white font-black flex items-center justify-center text-4xl clip-cyber-card">
                <span className="transform -skew-x-12 text-6xl select-none font-black">
                  {activeMatch.contestantB.avatarCode}
                </span>
              </div>
              <div className="absolute -bottom-2 -left-2 bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-mono text-gray-900">
                ID_00{activeMatch.id === 'goku-saitama' ? '2' : '4'}
              </div>
            </div>
          </div>

          {/* Title & Info */}
          <div className="z-10 mt-auto">
            <p className="font-mono text-[10px] text-gray-900 uppercase font-bold tracking-widest">
              COMBATANT_02 / LEVEL {activeMatch.contestantB.votes}
            </p>
            <h3 className="text-3xl md:text-4xl font-black text-gray-950 uppercase tracking-tighter line-clamp-1">
              {activeMatch.contestantB.name}
            </h3>
            <p className="font-mono text-xs text-gray-500 mt-0.5">
              {activeMatch.contestantB.subName}
            </p>
          </div>
        </motion.div>

        {/* VS SLASH OVERLAY IN THE CENTER */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center">
          <motion.div
            animate={
              hoveredCard === 'A'
                ? { scale: 1.12, rotate: 30 }
                : hoveredCard === 'B'
                ? { scale: 1.12, rotate: 60 }
                : { scale: 1, rotate: 45 }
            }
            transition={{ type: 'spring', stiffness: 350, damping: 14 }}
            className="bg-shonen-orange border-4 border-black w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-md select-none"
          >
            <span className="transform -rotate-45 text-3xl md:text-4xl font-black italic text-white">
              VS
            </span>
          </motion.div>
          <div className="w-1 bg-gradient-to-b from-transparent via-shonen-orange to-transparent h-20 hidden md:block opacity-40 mt-3" />
        </div>
      </div>

      {/* VOTING STATS / DYNAMIC GAUGES */}
      <div className="mt-4 p-4 bg-white border-2 border-gray-200 clip-cyber-card flex flex-col gap-4 z-10 relative shadow-sm text-gray-950">
        <div className="flex justify-between items-center text-xs font-mono font-bold">
          <div className="text-shonen-orange flex items-center gap-2">
            <span className="animate-pulse">●</span> {activeMatch.contestantA.name.toUpperCase()}: {activeMatch.contestantA.votes.toLocaleString()} VOTES
          </div>
          <div className="text-gray-400 text-[10px] hidden sm:block">
            TOTAL POLLING TRANSMISSIONS: {total.toLocaleString()}
          </div>
          <div className="text-gray-900 flex items-center gap-2">
            {activeMatch.contestantB.votes.toLocaleString()} VOTES <span className="animate-pulse">●</span> {activeMatch.contestantB.name.toUpperCase()}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-8 bg-gray-100 overflow-hidden border border-gray-300 flex rounded-sm">
          {/* Contestant A bar (Orange) */}
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${percentA}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="h-full bg-shonen-orange relative flex items-center pl-4 overflow-hidden"
          >
            {/* Caution Hatching inside the bar */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[size:15px_15px]" />
            <span className="font-black text-white font-mono text-sm z-10">
              {percentA}%
            </span>
          </motion.div>

          {/* Clash Point */}
          <div className="absolute top-0 bottom-0 w-1 bg-black z-20" style={{ left: `${percentA}%` }} />

          {/* Contestant B bar (Dark Charcoal) */}
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${percentB}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="h-full bg-gray-950 relative flex items-center justify-end pr-4 overflow-hidden"
          >
            {/* Caution Hatching inside the bar */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(-45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[size:15px_15px]" />
            <span className="font-black text-white font-mono text-sm z-10">
              {percentB}%
            </span>
          </motion.div>
        </div>

        {/* Interactive Callout Instructions */}
        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
          <div>
            [PRESS ENTER KEY OR CLICK PORTRAITS TO INJECT POWER TRANSMISSION]
          </div>
          <div className="text-shonen-orange flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" /> LIVE STREAM CALIBRATION ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
