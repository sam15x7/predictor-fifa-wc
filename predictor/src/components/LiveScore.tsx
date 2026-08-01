import React, { useState, useEffect } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { matchData } from '../data';
import { getCountryCode } from '../lib/fifa-utils';
import { AppMatch, MatchStatus } from '../types';

export default function LiveScore({ matches, timezone, timeFormat, onWatchLive, onTeamClick }: { matches: AppMatch[], timezone: string, timeFormat: string, onWatchLive?: () => void, onTeamClick?: (teamName: string) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMatchTime = (utc: string) => {
    const d = new Date(utc);
    const zoned = toZonedTime(d, timezone);
    const dateStr = format(zoned, 'MMM dd');
    if (timeFormat === '24h') {
      return `${dateStr}, ${format(zoned, 'HH:mm')}`;
    } else if (timeFormat === 'ISO') {
      return zoned.toISOString().split('T')[0].substring(5) + ' ' + zoned.toISOString().split('T')[1].substring(0, 5) + 'Z';
    } else {
      return `${dateStr}, ${format(zoned, 'hh:mm a')}`;
    }
  };

  const liveMatches = matches.filter(m => m.status === MatchStatus.LIVE).reverse();
  const upcomingMatches = [...matches]
    .filter((m) => new Date(m.utc) > new Date() && m.status !== MatchStatus.LIVE && m.status !== MatchStatus.FINISHED)
    .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime());
  const nextMatch = upcomingMatches[0];

  if (liveMatches.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-[10px] font-mono text-rose-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Live Matches
        </div>
        <div className="flex flex-wrap gap-4 pb-2">
          {liveMatches.map((match, i) => (
            <button key={i} onClick={() => onWatchLive && onWatchLive()} className="w-full sm:w-auto sm:min-w-[200px] text-left shrink-0 bg-[var(--card-bg)] hover:bg-[var(--accent-bg)] border border-rose-500/30 rounded-xl p-3 shadow-md shadow-rose-900/10 cursor-pointer transition-colors relative overflow-hidden group">
               <div className="absolute inset-0 bg-rose-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <div className="text-[10px] font-mono text-rose-400 mb-2 relative z-10">{match.elapsed ? match.elapsed : 'LIVE'}</div>
               <div className="flex justify-between items-center mb-1 relative z-10">
                 <span 
                   className="font-semibold text-sm hover:text-[#d4af37] transition-colors"
                   onClick={(e) => {
                     if (onTeamClick) {
                       e.stopPropagation();
                       onTeamClick(match.home);
                     }
                   }}
                 >
                   {match.home}
                 </span>
                 <span className="font-bold text-lg">{match.homeScore ?? 0}</span>
               </div>
               <div className="flex justify-between items-center relative z-10">
                 <span 
                   className="font-semibold text-sm hover:text-[#d4af37] transition-colors"
                   onClick={(e) => {
                     if (onTeamClick) {
                       e.stopPropagation();
                       onTeamClick(match.away);
                     }
                   }}
                 >
                   {match.away}
                 </span>
                 <span className="font-bold text-lg">{match.awayScore ?? 0}</span>
               </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!nextMatch) {
    return null;
  }

  // Calculate countdown
  const nextMatchDate = new Date(nextMatch.utc);
  let diffSecs = differenceInSeconds(nextMatchDate, currentTime);
  if (isNaN(diffSecs)) diffSecs = 0;
  
  const days = Math.floor(diffSecs / (3600 * 24));
  const hours = Math.floor((diffSecs % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;

  const safeTimezone = timezone || 'Asia/Kolkata';
  const tzLabel = safeTimezone === 'Asia/Kolkata' ? 'IST' : safeTimezone.split('/')[1]?.replace('_', ' ') || safeTimezone;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm relative overflow-hidden">
       <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f8d568] to-[#d4af37]"></div>
       <div className="text-[10px] font-mono text-[var(--muted-text)] uppercase tracking-widest mb-3 flex items-center justify-between">
         <span>⏳ Upcoming Match Countdown</span>
         <span className="text-[#d4af37] font-bold">{formatMatchTime(nextMatch.utc)} {tzLabel}</span>
       </div>
       <div className="flex flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3">
           <div className="text-right">
             <div className="font-bold text-lg">{nextMatch.home} <img src={`https://flagcdn.com/w40/${getCountryCode(nextMatch.home)}.png`} alt="" className="inline w-5 ml-1 rounded-[1px] shadow" /></div>
           </div>
           <div className="text-sm font-mono text-slate-500 px-2">VS</div>
           <div className="text-left">
             <div className="font-bold text-lg"><img src={`https://flagcdn.com/w40/${getCountryCode(nextMatch.away)}.png`} alt="" className="inline w-5 mr-1 rounded-[1px] shadow" /> {nextMatch.away}</div>
           </div>
         </div>
         <div className="flex gap-3">
           {[
             { label: 'D', value: Math.max(0, days) },
             { label: 'H', value: Math.max(0, hours) },
             { label: 'M', value: Math.max(0, minutes) },
             { label: 'S', value: Math.max(0, seconds) }
           ].map((unit, i) => (
             <div key={i} className="flex flex-col items-center">
               <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg w-10 h-10 flex items-center justify-center font-bold font-mono text-[var(--text-color)]">
                 {unit.value.toString().padStart(2, '0')}
               </div>
               <div className="text-[9px] font-mono text-[var(--muted-text)] mt-1">{unit.label}</div>
             </div>
           ))}
         </div>
       </div>
    </div>
  );
}
