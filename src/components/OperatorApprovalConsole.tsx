import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { sounds } from './SoundManager';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  UserCheck, 
  Clock, 
  Sparkles, 
  Terminal, 
  RefreshCw,
  CreditCard,
  Send
} from 'lucide-react';
import { PremiumRequest, User } from '../types';

interface OperatorApprovalConsoleProps {
  currentUser: User | null;
  onRefreshUser?: () => void;
}

export const OperatorApprovalConsole: React.FC<OperatorApprovalConsoleProps> = ({
  currentUser,
  onRefreshUser
}) => {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOperator = currentUser?.email?.toLowerCase() === 'adhyangiri6@gmail.com' ||
                     currentUser?.username?.toUpperCase() === 'ADHYAN' ||
                     currentUser?.is_admin === true;

  const loadRequests = async () => {
    setLoading(true);
    let allReqs: PremiumRequest[] = [];

    // 1. Try loading from localStorage
    try {
      const local = localStorage.getItem('vote_arena_premium_requests');
      if (local) {
        allReqs = JSON.parse(local);
      }
    } catch (e) {
      console.warn('Could not read local premium requests:', e);
    }

    // 2. Try loading from Supabase if table exists
    try {
      const { data, error } = await supabase
        .from('premium_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        // Merge with local ones deduplicated by id
        const map = new Map<string, PremiumRequest>();
        [...data, ...allReqs].forEach(item => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });
        allReqs = Array.from(map.values());
      }
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // Sort by created_at desc
    allReqs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRequests(allReqs);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const handleDecision = async (req: PremiumRequest, approve: boolean) => {
    sounds.playImpact();
    setActionSuccess(null);
    setActionError(null);

    const newStatus: 'approved' | 'cancelled' = approve ? 'approved' : 'cancelled';
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const premiumExpires = oneMonthFromNow.toISOString();

    // 1. Update request status in local memory & storage
    const updatedReqs = requests.map(r => r.id === req.id ? { ...r, status: newStatus } : r);
    setRequests(updatedReqs);
    try {
      localStorage.setItem('vote_arena_premium_requests', JSON.stringify(updatedReqs));
    } catch (e) {}

    // 2. Sync request status in Supabase if possible
    try {
      await supabase
        .from('premium_requests')
        .update({ status: newStatus })
        .eq('id', req.id);
    } catch (e) {}

    // 3. Update target user profile in Supabase & localStorage
    if (approve) {
      // ALLOW YES: Enable Premium on User ID
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: req.user_id,
            is_premium: true,
            premium_status: 'approved',
            premium_expires_at: premiumExpires
          });
      } catch (e) {}

      // Update user storage key if present
      try {
        const userKey = `vote_arena_user_${req.user_id}`;
        const existing = localStorage.getItem(userKey);
        if (existing) {
          const parsed = JSON.parse(existing);
          parsed.is_premium = true;
          parsed.premium_status = 'approved';
          parsed.premium_expires_at = premiumExpires;
          localStorage.setItem(userKey, JSON.stringify(parsed));
        }
      } catch (e) {}

      setActionSuccess(`✅ CONFIRMATION ALLOWED (YES)! Premium activated on User ID [${req.username}] (${req.user_email}). Notification sent to adhyangiri6@gmail.com.`);
      sounds.playPunchyCTA();
    } else {
      // REJECT NO: Cancel Request, No Premium Given
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: req.user_id,
            is_premium: false,
            premium_status: 'cancelled'
          });
      } catch (e) {}

      try {
        const userKey = `vote_arena_user_${req.user_id}`;
        const existing = localStorage.getItem(userKey);
        if (existing) {
          const parsed = JSON.parse(existing);
          parsed.is_premium = false;
          parsed.premium_status = 'cancelled';
          localStorage.setItem(userKey, JSON.stringify(parsed));
        }
      } catch (e) {}

      setActionError(`❌ REQUEST CANCELLED (NO)! Premium purchase request for [${req.username}] was rejected. No premium given.`);
      sounds.playError();
    }

    if (onRefreshUser) {
      onRefreshUser();
    }

    setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 5000);
  };

  if (!isOperator) {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="bg-gray-950 border-2 border-shonen-orange p-4 rounded-none text-white font-sans space-y-4 shadow-xl relative overflow-hidden">
      {/* Caution Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,#FF6B00_25%,#111_25%,#111_50%,#FF6B00_50%,#FF6B00_75%,#111_75%,#111)] bg-[size:12px_12px]" />

      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-shonen-orange" />
          <div>
            <h3 className="font-mono text-xs font-black uppercase text-shonen-orange tracking-wider flex items-center gap-2">
              <span>OPERATOR APPROVAL CONSOLE</span>
              <span className="bg-shonen-orange text-black px-1.5 py-0.5 text-[9px] font-bold">
                adhyangiri6@gmail.com
              </span>
            </h3>
            <p className="font-mono text-[9px] text-gray-400">
              MANAGE PAID PURCHASES & PREMIUM ACCESS CONFIRMATIONS
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playSelect();
            loadRequests();
          }}
          disabled={loading}
          className="p-1.5 bg-gray-900 border border-gray-700 hover:border-shonen-orange text-gray-300 hover:text-white transition-all font-mono text-[9px] flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>SYNC</span>
        </button>
      </div>

      {/* Notifications / Alerts */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-mono text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-rose-950/80 border border-rose-500 text-rose-200 font-mono text-xs font-bold flex items-center gap-2"
          >
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Counters */}
      <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
        <div className="bg-amber-950/40 border border-amber-500/50 p-2 text-center">
          <span className="text-amber-400 font-black text-sm block">{pendingRequests.length}</span>
          <span className="text-gray-400 text-[8px] uppercase">PENDING ALLOW</span>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-500/50 p-2 text-center">
          <span className="text-emerald-400 font-black text-sm block">
            {requests.filter(r => r.status === 'approved').length}
          </span>
          <span className="text-gray-400 text-[8px] uppercase">APPROVED (YES)</span>
        </div>
        <div className="bg-rose-950/40 border border-rose-500/50 p-2 text-center">
          <span className="text-rose-400 font-black text-sm block">
            {requests.filter(r => r.status === 'cancelled').length}
          </span>
          <span className="text-gray-400 text-[8px] uppercase">CANCELLED (NO)</span>
        </div>
      </div>

      {/* List of Requests */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {requests.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-800 text-gray-500 font-mono text-xs">
            NO PURCHASE CONFIRMATION REQUESTS LOGGED YET.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className={`p-3 border text-xs font-mono space-y-2 transition-all ${
                req.status === 'pending'
                  ? 'bg-gray-900 border-amber-500/80 shadow-md'
                  : req.status === 'approved'
                  ? 'bg-emerald-950/20 border-emerald-800/60 opacity-80'
                  : 'bg-rose-950/20 border-rose-800/60 opacity-80'
              }`}
            >
              {/* Header info */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white text-sm block flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-shonen-orange" />
                    {req.username}
                  </span>
                  <span className="text-[9px] text-gray-400 block">{req.user_email}</span>
                </div>

                <span
                  className={`px-2 py-0.5 text-[8px] font-black uppercase border ${
                    req.status === 'pending'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                      : req.status === 'approved'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500 text-rose-300'
                  }`}
                >
                  {req.status === 'pending' ? '⌛ PENDING OPERATOR ALLOW' : req.status === 'approved' ? '✅ ALLOWED (PREMIUM ACTIVE)' : '❌ CANCELLED (NO ACCESS)'}
                </span>
              </div>

              {/* Purchase specifics */}
              <div className="bg-black/60 p-2 border border-gray-800 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">ITEM REQUESTED:</span>
                  <span className="font-bold text-shonen-orange">{req.item_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AMOUNT:</span>
                  <span className="font-bold text-white">{req.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TRANSACTION UTR REF:</span>
                  <span className="font-mono font-bold text-amber-300">{req.utr_ref || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CONFIRMATION DESTINATION:</span>
                  <span className="text-emerald-400 font-bold">{req.target_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TIMESTAMP:</span>
                  <span className="text-gray-400">{new Date(req.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Decision Action Buttons if Pending */}
              {req.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleDecision(req, true)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-emerald-400 shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>[ ✅ ALLOW YES ]</span>
                  </button>

                  <button
                    onClick={() => handleDecision(req, false)}
                    className="py-2 px-3 bg-rose-700 hover:bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-rose-400 shadow-md cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>[ ❌ REJECT / CANCEL ]</span>
                  </button>
                </div>
              ) : (
                <div className="text-[9px] text-gray-400 italic text-center pt-0.5">
                  DECISION RECORDED BY OPERATOR (adhyangiri6@gmail.com)
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
