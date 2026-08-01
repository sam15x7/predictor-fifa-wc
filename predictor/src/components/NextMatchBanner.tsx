import React, { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { AppMatch, MatchStatus } from '../types';
import { getCountryCode } from '../lib/fifa-utils';
import { cn } from '../lib/utils';
import { Bell } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

export default function NextMatchBanner({ matches, timezone, notifiedMatches = [], onToggleNotification }: { matches: AppMatch[], timezone: string, notifiedMatches?: (string | number)[], onToggleNotification?: (id: string | number) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const safeTimezone = timezone || 'Asia/Kolkata';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingMatches = matches
    .filter((m) => new Date(m.utc) > currentTime && m.status !== MatchStatus.FINISHED && m.status !== MatchStatus.LIVE)
    .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime());
  const nextMatch = upcomingMatches[0];

  if (!nextMatch) return null;

  let diffSecs = differenceInSeconds(new Date(nextMatch.utc), currentTime);
  if (isNaN(diffSecs)) diffSecs = 0;
  
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;

  const isUrgent = diffSecs < 1800; // less than 30 mins
  const isSuperUrgent = diffSecs < 300; // less than 5 mins

  return (
    <div className={cn(
      "sticky top-16 z-40 border-b overflow-hidden transition-colors duration-500",
      isSuperUrgent ? "bg-green-950/40 border-green-500/50" :
      isUrgent ? "bg-amber-950/40 border-amber-500/50" : 
      "bg-[#d4af37]/10 border-[#d4af37]/30"
    )}>
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
         <div className={cn(
           "w-[800px] h-[50px] rounded-full blur-3xl transition-opacity animate-pulse",
           isSuperUrgent ? "bg-green-500 opacity-20" : isUrgent ? "bg-amber-500 opacity-20" : "bg-[#d4af37] opacity-10"
         )}></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 font-mono text-[10px] tracking-wider text-slate-300">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full shadow-lg",
              isSuperUrgent ? "bg-green-500 animate-pulse shadow-green-500/50" : 
              isUrgent ? "bg-amber-500 animate-pulse shadow-amber-500/50" : "bg-[#d4af37] animate-pulse shadow-[#d4af37]/50"
            )}></span>
            NEXT MATCH
          </div>
          <span className="font-mono text-sm tracking-widest font-bold text-white">
            {hours.toString().padStart(2, '0')} : {minutes.toString().padStart(2, '0')} : {seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex items-center gap-1.5">
            <img src={`https://flagcdn.com/w40/${getCountryCode(nextMatch.home)}.png`} alt="" className="w-5 object-contain" />
            <span className="text-white">{nextMatch.home}</span>
          </div>
          <span className="text-slate-500 font-mono text-xs">vs</span>
          <div className="flex items-center gap-1.5">
            <img src={`https://flagcdn.com/w40/${getCountryCode(nextMatch.away)}.png`} alt="" className="w-5 object-contain" />
            <span className="text-white">{nextMatch.away}</span>
          </div>
          <span className="hidden md:inline text-[#d4af37] font-mono text-[10px] ml-4 font-bold border border-[#d4af37]/30 px-2 py-0.5 rounded bg-black/20">
            {formatInTimeZone(new Date(nextMatch.utc), safeTimezone, 'HH:mm')} {safeTimezone === 'Asia/Kolkata' ? 'IST' : safeTimezone.split('/')[1]?.replace('_', ' ') || safeTimezone}
          </span>
          <span className="hidden md:inline text-slate-500 font-mono text-[10px] ml-2">· {nextMatch.venue}</span>
        </div>
        <button 
          title={notifiedMatches.includes(nextMatch.id) ? "Cancel notification" : "Notify me 15m before kickoff"}
          className={cn(
            "hidden sm:flex p-1.5 rounded-md transition-colors",
            notifiedMatches.includes(nextMatch.id) 
              ? "text-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20" 
              : "text-slate-400 hover:text-[#d4af37] hover:bg-white/5"
          )}
          onClick={() => {
            if (onToggleNotification) {
              onToggleNotification(nextMatch.id);
            }
          }}
        >
          <Bell size={14} className={notifiedMatches.includes(nextMatch.id) ? "fill-current" : ""} />
        </button>
      </div>
    </div>
  );
}
