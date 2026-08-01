import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Share2, Activity, CalendarPlus, Bell } from 'lucide-react';
import { getCountryCode, getTeamStrength, getTeamTier, calculateWinProbability, generateICS } from '../lib/fifa-utils';
import { format as formatDFNS, differenceInSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { toPng } from 'html-to-image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AppMatch, MatchStatus } from '../types';

interface MatchCardProps {
  key?: string | number;
  match: AppMatch;
  timezone: string;
  timeFormat: string;
  isFinal?: boolean;
  isKnockout?: boolean;
  onClick?: (match: AppMatch) => void;
  onTeamClick?: (teamName: string) => void;
  notifiedMatches?: (string | number)[];
  onToggleNotification?: (id: string | number) => void;
}

export default function MatchCard({ match, timezone, timeFormat, isFinal, isKnockout, onClick, onTeamClick, notifiedMatches = [], onToggleNotification }: MatchCardProps) {
  const [showH2H, setShowH2H] = useState(false);
  const [now, setNow] = useState(new Date());
  
  const [pulse, setPulse] = useState(false);
  const prevScoreHome = React.useRef(match.homeScore);
  const prevScoreAway = React.useRef(match.awayScore);

  useEffect(() => {
    if (match.status === MatchStatus.LIVE) {
      if (match.homeScore !== prevScoreHome.current || match.awayScore !== prevScoreAway.current) {
        setPulse(true);
        const t = setTimeout(() => setPulse(false), 3000);
        prevScoreHome.current = match.homeScore;
        prevScoreAway.current = match.awayScore;
        return () => clearTimeout(t);
      }
    }
  }, [match.homeScore, match.awayScore, match.status]);

  useEffect(() => {
    // 1-second interval to allow countdowns to work
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cardRef = React.useRef<HTMLDivElement>(null);

  // Tilt effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const homeCode = getCountryCode(match.home);
  const awayCode = getCountryCode(match.away);
  
  // derivation from MatchStatus enum
  let statusString = 'UPCOMING';
  const msToKickoff = new Date(match.utc).getTime() - now.getTime();
  
  if (match.status === MatchStatus.LIVE) {
    statusString = match.elapsed || 'LIVE';
  } else if (match.status === MatchStatus.FINISHED) {
    statusString = 'FT';
  } else if (msToKickoff > 0 && msToKickoff <= 60 * 60 * 1000) {
    statusString = 'SOON';
  } else if (msToKickoff > 60 * 60 * 1000 && msToKickoff <= 24 * 60 * 60 * 1000) {
    statusString = 'TODAY';
  }

  const formatMatchTime = (utc: string) => {
    const zoned = toZonedTime(new Date(utc), timezone);
    if (timeFormat === '24h') return formatDFNS(zoned, 'HH:mm');
    if (timeFormat === 'ISO') return zoned.toISOString().split('T')[1].substring(0, 5) + 'Z';
    return formatDFNS(zoned, 'hh:mm a');
  };

  const prob = calculateWinProbability(match.home, match.away);

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `match-${match.home}-${match.away}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  let diffSecs = differenceInSeconds(new Date(match.utc), now);
  if (isNaN(diffSecs)) diffSecs = 0;
  diffSecs = Math.max(0, diffSecs);
  
  const countdownMinutes = Math.floor(diffSecs / 60);
  const countdownSeconds = diffSecs % 60;

  // Visual logic
  let cardBorder = isFinal ? 'border-amber-500/50 shadow-md shadow-amber-900/10' : isKnockout ? 'border-[#d4af37]/30' : 'border-[var(--border-color)]';
  let cardBg = 'bg-[var(--card-bg)]';
  let isDimmed = false;
  
  if (match.status === MatchStatus.LIVE) {
    cardBorder = 'border-[3px] border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    cardBg = 'bg-gradient-to-br from-[#ef4444]/10 to-[var(--card-bg)]';
  } else if (statusString === 'SOON') {
    cardBorder = 'border border-[#d4af37]/60';
    cardBg = 'bg-[var(--card-bg)]';
  } else if (statusString === 'TODAY') {
    cardBorder = 'border border-[#d4af37]/35';
  } else if (match.status === MatchStatus.FINISHED) {
    cardBorder = 'border-[2px] border-[#4ade80]';
    isDimmed = true;
  }

  return (
    <div style={{ perspective: 1000 }} className={`h-full ${isDimmed ? 'opacity-65' : ''}`}>
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick && onClick(match)}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`match-card rounded-xl border relative transition-all duration-300 h-full cursor-pointer ${cardBorder} ${cardBg} ${pulse ? 'shadow-[0_0_30px_rgba(239,68,68,0.6)] md:scale-105 border-red-500' : ''}`}
    >
      {(match.status === MatchStatus.LIVE) && <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#4ade80] rounded-l-xl z-20"></div>}

      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: "translateZ(30px)" }}>
        {match.status !== MatchStatus.FINISHED && match.status !== MatchStatus.LIVE && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleNotification) onToggleNotification(match.id);
            }} 
            title={notifiedMatches.includes(match.id) ? "Cancel notification" : "Notify me 15m before kickoff"}
            className={`p-1.5 rounded-md transition-colors ${notifiedMatches.includes(match.id) ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-slate-500 hover:text-[#d4af37] hover:bg-[var(--bg-color)]'}`}
          >
            <Bell size={14} className={notifiedMatches.includes(match.id) ? "fill-current" : ""} />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); generateICS(match); }} title="Add to Calendar" className="p-1.5 text-slate-500 hover:text-[#d4af37] hover:bg-[var(--bg-color)] rounded-md">
          <CalendarPlus size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} title="Share as Image" className="p-1.5 text-slate-500 hover:text-[#d4af37] hover:bg-[var(--bg-color)] rounded-md">
          <Share2 size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4" style={{ transform: "translateZ(20px)" }}>
         <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 text-[11px] font-mono text-[var(--muted-text)] relative z-10">
            <div className="flex gap-2 items-center">
              {(match.status === MatchStatus.LIVE) && <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>}
              {statusString === 'SOON' && <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_6px_#d4af37]"></span>}
              
              <span className={isFinal ? 'text-amber-500 font-bold' : ''}>#{match.id}</span>
              {match.group && (
                <span className="font-bold text-[#d4af37] bg-[#d4af37]/10 px-1.5 py-0.5 rounded">
                  GRP {match.group}
                </span>
              )}
            </div>
            <div className="text-right truncate max-w-[150px]">{match.venue} · {match.city}</div>
         </div>
         
         {match.isTentative && (
           <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[9px] uppercase tracking-widest font-mono py-1 px-2 rounded-md text-center font-bold animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]">
             Tentative — Based on current standings
           </div>
         )}

         <div className="flex items-center justify-between group relative z-10">
            <div className="flex flex-col items-center gap-1.5 w-[35%] overflow-hidden">
               <img src={`https://flagcdn.com/w80/${homeCode}.png`} alt={match.home} className="w-10 h-10 object-contain drop-shadow-lg" />
               <div 
                  className={`font-semibold truncate w-full text-center text-sm sm:text-base ${isFinal ? 'text-amber-500' : 'text-[var(--text-color)]'} hover:text-[#d4af37] cursor-pointer transition-colors`}
                  onClick={(e) => {
                    if (onTeamClick) {
                      e.stopPropagation();
                      onTeamClick(match.home);
                    }
                  }}
                  title={`View ${match.home} details`}
               >
                 {match.home}
               </div>
            </div>
            
            <div className="flex flex-col items-center justify-center shrink-0 mx-2">
               {(match.status === MatchStatus.LIVE) ? (
                 <>
                   <div className="text-[9px] font-mono text-[#4ade80] bg-[#4ade80]/15 border border-[#4ade80]/40 px-1.5 py-0.5 rounded mb-1">
                     {statusString}
                   </div>
                   <div className={`font-bold font-mono text-base sm:text-lg px-2 py-1 rounded bg-[var(--bg-color)] text-white border border-[var(--border-color)] shadow-sm transition-all duration-300 ${pulse ? 'bg-red-500/20 text-red-500 scale-125 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}>
                     {match.score || '0 - 0'}
                   </div>
                 </>
               ) : statusString === 'SOON' ? (
                 <>
                   <div className="text-[10px] font-mono text-[#d4af37] mb-1">KICKOFF IN</div>
                   <div className="font-bold font-mono text-xs sm:text-sm px-2 py-1 rounded bg-[var(--bg-color)] text-[#d4af37] border border-[var(--border-color)] shadow-sm">
                     {countdownMinutes.toString().padStart(2, '0')}:{countdownSeconds.toString().padStart(2, '0')}
                   </div>
                 </>
               ) : isDimmed ? (
                 <>
                   <div className="text-[10px] font-mono text-[var(--muted-text)] mb-1">FT</div>
                   <div className="font-bold font-mono text-xs sm:text-sm px-2 py-1 rounded bg-[var(--bg-color)] text-[var(--muted-text)] border border-[var(--border-color)] shadow-sm">
                     {match.score || 'vs'}
                   </div>
                 </>
               ) : (
                 <>
                   <div className="text-[10px] font-mono text-[var(--muted-text)] mb-1 flex items-center gap-1">
                     {statusString === 'TODAY' && <span className="text-[8px] bg-[#d4af37]/10 text-[#d4af37] px-1 rounded border border-[#d4af37]/30">TODAY</span>}
                     VS
                   </div>
                   <div className={`font-bold font-mono text-xs sm:text-sm px-2 py-1 rounded bg-[var(--bg-color)] ${statusString === 'TODAY' ? 'text-[#d4af37]' : isFinal ? 'text-amber-500' : 'text-[#d4af37]'} border border-[var(--border-color)] shadow-sm`}>
                     {formatMatchTime(match.utc)}
                   </div>
                 </>
               )}
            </div>

            <div className="flex flex-col items-center gap-1.5 w-[35%] overflow-hidden">
               <img src={`https://flagcdn.com/w80/${awayCode}.png`} alt={match.away} className="w-10 h-10 object-contain drop-shadow-lg" />
               <div 
                  className={`font-semibold truncate w-full text-center text-sm sm:text-base ${isFinal ? 'text-amber-500' : 'text-[var(--text-color)]'} hover:text-[#d4af37] cursor-pointer transition-colors`}
                  onClick={(e) => {
                    if (onTeamClick) {
                      e.stopPropagation();
                      onTeamClick(match.away);
                    }
                  }}
                  title={`View ${match.away} details`}
               >
                 {match.away}
               </div>
            </div>
         </div>
      </div>

      <div className="border-t border-[var(--border-color)] px-4 py-2 bg-[var(--bg-color)]/30 rounded-b-xl relative z-10" style={{ transform: "translateZ(10px)" }}>
         <div className="flex flex-col">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1">
              <span title={`TSI: ${getTeamStrength(match.home)} - ${getTeamTier(getTeamStrength(match.home))}`}>TSI: {getTeamStrength(match.home)}</span>
              <button 
                onClick={() => setShowH2H(!showH2H)} 
                className="text-[#d4af37] hover:underline flex items-center gap-1"
              >
                <Activity size={10}/> Predictions & H2H
              </button>
              <span title={`TSI: ${getTeamStrength(match.away)} - ${getTeamTier(getTeamStrength(match.away))}`}>TSI: {getTeamStrength(match.away)}</span>
            </div>
            {showH2H && (
              <div className="mt-2 text-xs fade-in border-t border-[var(--border-color)] pt-2 pb-1">
                <div className="mb-2 text-center text-[10px] font-mono text-[var(--muted-text)]">Win Probability Model</div>
                <div className="flex h-2 rounded-full overflow-hidden mb-1">
                  <div style={{ width: `${prob.home}%` }} className="bg-blue-500" title={`Home: ${prob.home}%`}></div>
                  <div style={{ width: `${prob.draw}%` }} className="bg-slate-500" title={`Draw: ${prob.draw}%`}></div>
                  <div style={{ width: `${prob.away}%` }} className="bg-rose-500" title={`Away: ${prob.away}%`}></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-blue-500">{prob.home}%</span>
                  <span className="text-slate-500">{prob.draw}%</span>
                  <span className="text-rose-500">{prob.away}%</span>
                </div>
              </div>
            )}
            
         </div>
      </div>
    </motion.div>
    </div>
  );
}
