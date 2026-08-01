import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMatch, MatchStatus } from '../types';
import { X, PlayCircle, Shield, ChevronRight, Thermometer, Cloud, Sun, CloudRain } from 'lucide-react';
import { getStadiumByCityOrVenue } from '../data/stadiums';
import { getCountryCode } from '../lib/fifa-utils';
import { cn } from '../lib/utils';
import { format as formatTZ, toZonedTime } from 'date-fns-tz';
import { differenceInMinutes } from 'date-fns';
import { useSettings } from '../SettingsContext';

interface MatchPopupProps {
  match: AppMatch | null;
  onClose: () => void;
  timezone: string;
  onWatchLive?: () => void;
}

const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-6 h-6 text-yellow-400" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-6 h-6 text-gray-300" />;
    if (code >= 45 && code <= 48) return <Cloud className="w-6 h-6 text-gray-400" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudRain className="w-6 h-6 text-white" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (code >= 95) return <CloudRain className="w-6 h-6 text-purple-400" />;
    return <Cloud className="w-6 h-6 text-gray-300" />;
};

export default function MatchPopup({ match, onClose, timezone, onWatchLive }: MatchPopupProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!match) {
      setWeatherData(null);
      return;
    }
    
    // Prevent scrolling behind modal
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [match]);

  // Fetch weather for stadium
  useEffect(() => {
    if (!match) return;
    const stadium = getStadiumByCityOrVenue(match.venue || match.city || '');
    if (stadium) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${stadium.lat}&longitude=${stadium.lng}&current_weather=true`)
        .then(res => res.json())
        .then(data => setWeatherData(data.current_weather))
        .catch(console.error);
    }
  }, [match]);

  if (!match) return null;

  const stadium = getStadiumByCityOrVenue(match.venue || match.city || '');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
        style={{ perspective: 1000 }}
      >
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
           className="relative w-full max-w-2xl bg-[#111317] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-6 relative">
             {/* Match Versus Section */}
            <div className="relative pt-12 pb-8 px-6 border-b border-gray-800 bg-gradient-to-b from-gray-900/50 to-[#111317]">
               {stadium && (
                 <div className="absolute top-0 right-0 left-0 h-40 opacity-20 mask-image-gradient-t pointer-events-none">
                    <img src={stadium.image} className="w-full h-full object-cover blur-sm" alt="" />
                 </div>
               )}
               <div className="relative z-10 flex flex-col items-center">
                 <div className="text-center mb-6">
                    <p className="text-xs font-bold text-[#E8001D] tracking-widest uppercase mb-1">{match.stage}</p>
                    <p className="text-sm text-gray-400">
                      {formatTZ(toZonedTime(new Date(match.utc), timezone), 'EEEE, dd MMM yyyy • HH:mm', { timeZone: timezone })}
                    </p>
                 </div>
                 
                 <div className="flex items-center justify-center w-full gap-8">
                   <div className="flex flex-col items-center flex-1">
                      {match.home ? (
                        <div className="w-24 h-24 rounded-full bg-black/50 p-3 shadow-lg shadow-black/50 flex items-center justify-center mb-3">
                            <img src={`https://flagcdn.com/w80/${getCountryCode(match.home)}.png`} className="w-full h-full object-contain" alt={match.home} />
                        </div>
                      ) : (
                        <Shield className="w-20 h-20 text-gray-600 mb-3" />
                      )}
                      <span className="font-display font-bold text-2xl text-center">{match.home || 'TBD'}</span>
                   </div>

                   <div className="flex flex-col items-center justify-center shrink-0">
                      {(match.status === MatchStatus.LIVE || match.status === MatchStatus.FINISHED) && typeof match.homeScore === 'number' ? (
                         <div className="flex items-center justify-center gap-3">
                            <span className={cn("text-5xl font-mono font-bold w-12 text-center", match.homeScore > match.awayScore! ? "text-white" : "text-gray-400")}>
                               {match.homeScore}
                            </span>
                            <span className="text-gray-600 font-bold">:</span>
                            <span className={cn("text-5xl font-mono font-bold w-12 text-center", match.awayScore! > match.homeScore ? "text-white" : "text-gray-400")}>
                               {match.awayScore}
                            </span>
                         </div>
                      ) : (
                         <span className="text-3xl font-display font-bold text-gray-600 mx-4">VS</span>
                      )}
                      {match.status === MatchStatus.LIVE && (
                         <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                           Live
                         </motion.div>
                      )}
                   </div>

                   <div className="flex flex-col items-center flex-1">
                      {match.away ? (
                        <div className="w-24 h-24 rounded-full bg-black/50 p-3 shadow-lg shadow-black/50 flex items-center justify-center mb-3">
                            <img src={`https://flagcdn.com/w80/${getCountryCode(match.away)}.png`} className="w-full h-full object-contain" alt={match.away} />
                        </div>
                      ) : (
                        <Shield className="w-20 h-20 text-gray-600 mb-3" />
                      )}
                      <span className="font-display font-bold text-2xl text-center">{match.away || 'TBD'}</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Watch Live Action */}
              {settings.watchLiveEnabled && (
                 <div>
                       <button
                         onClick={() => {
                           window.open(settings.watchLiveUrl, '_blank');
                         }}
                         className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-200 via-white to-gray-300 hover:scale-[1.02] transition-all p-[1px] shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse border border-gray-100"
                       >
                          <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/BC_Place_aerial.jpg')] bg-cover opacity-10 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"></div>
                          <div className="relative px-6 py-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <PlayCircle className="w-8 h-8 text-black fill-black" />
                              <span className="font-extrabold text-xl text-black">WATCH LIVE</span>
                            </div>
                            <ChevronRight className="w-6 h-6 text-black/50 group-hover:text-black transition-colors group-hover:translate-x-1 duration-300" />
                          </div>
                       </button>
                 </div>
              )}

              {/* Stadium Details */}
              {stadium && (
                <div className="bg-[#1A1F26] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="h-32 w-full relative">
                     <img src={stadium.image} className="w-full h-full object-cover" alt={stadium.name} referrerPolicy="no-referrer" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F26] to-transparent" />
                  </div>
                  <div className="p-5 relative z-10 -mt-6">
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <h4 className="font-display font-bold text-xl text-white">{stadium.name}</h4>
                         <p className="text-sm text-gray-400">{stadium.city}</p>
                       </div>
                       {weatherData && (
                          <div className="flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-800">
                             {getWeatherIcon(weatherData.weathercode)}
                             <span className="font-mono text-white font-semibold">{weatherData.temperature}°C</span>
                          </div>
                       )}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-lg p-3">
                           <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Capacity</p>
                           <p className="font-mono text-white">{stadium.capacity.toLocaleString()}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                           <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Timezone</p>
                           <p className="font-mono text-white text-sm">{stadium.timezone.split('/')[1]?.replace('_', ' ')}</p>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* H2H Statistics Section (Simulated) */}
              <div className="bg-[#1A1F26] border border-gray-800 rounded-2xl p-5 shadow-lg">
                 <h4 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                    Head to Head Stats
                 </h4>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="w-12 text-center text-[#E8001D] font-bold text-xl font-mono">2</span>
                       <span className="flex-1 text-center text-sm font-semibold text-gray-400 tracking-widest uppercase">Wins</span>
                       <span className="w-12 text-center text-blue-500 font-bold text-xl font-mono">1</span>
                    </div>
                    {/* Win probability bar */}
                    <div className="h-2 flex rounded-full overflow-hidden bg-gray-800">
                      <motion.div initial={{ width: 0 }} animate={{ width: "45%" }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-[#E8001D]" />
                      <motion.div initial={{ width: 0 }} animate={{ width: "20%" }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gray-600" />
                      <motion.div initial={{ width: 0 }} animate={{ width: "35%" }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-blue-500" />
                    </div>
                    <div className="flex items-center justify-between mt-6">
                       <span className="w-12 text-center text-white font-bold text-lg font-mono">1.2</span>
                       <span className="flex-1 text-center text-sm text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-800">Avg Goals</span>
                       <span className="w-12 text-center text-white font-bold text-lg font-mono">1.8</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                       <span className="w-12 text-center text-white font-bold text-lg font-mono">12</span>
                       <span className="flex-1 text-center text-sm text-gray-400 uppercase tracking-widest">Total Meets</span>
                       <span className="w-12 text-center text-white font-bold text-lg font-mono">12</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
