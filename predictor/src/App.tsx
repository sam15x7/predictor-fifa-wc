import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Download, Clock, CalendarIcon as Calendar, Search, X, Activity, Newspaper, Heart, MapPin, Play } from 'lucide-react';
import { format as formatDFNS, addDays, eachDayOfInterval, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from './lib/utils';
import { getCountryCode } from './lib/fifa-utils';
import { useNotifications } from './hooks/useNotifications';
import { matchData, timezones, groupTeams, stages, stageMap } from './data';
import LiveScore from './components/LiveScore';
import MatchCard from './components/MatchCard';
import MatchDashboard from './components/MatchDashboard';
import NewsFeed from './components/NewsFeed';
import NextMatchBanner from './components/NextMatchBanner';
import ParticleBackground from './components/ParticleBackground';
import SupportPage from './components/SupportPage';
import TeamCompareModal from './components/TeamCompareModal';
import { AppMatch } from './types';
import { mapWC26MatchToAppMatch } from './services/wc26';

import Stadiums from './components/Stadiums';
import MatchPopup from './components/MatchPopup';

import KnockoutBracket from './components/KnockoutBracket';
import { useSettings } from './SettingsContext';
import LiveStreamsPage from './components/LiveStreamsPage';
import EventNotifications from './components/EventNotifications';

function App() {
  const { settings, loading } = useSettings();
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fifa_tz');
        if (stored) return stored;
      } catch(e) {}
    }
    return 'Asia/Kolkata';
  });

  const [activeTab, setActiveTab] = useState<'matches'|'stats'|'news'|'stadiums'|'bracket'>('matches');
  const [stage, setStage] = useState<string>('QF');
  const [group, setGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [timeFormat, setTimeFormat] = useState('12h'); 
  const [showSupportPage, setShowSupportPage] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<AppMatch | null>(null);
  const [teamToCompare, setTeamToCompare] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWatchPopup, setShowWatchPopup] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showLiveStreams, setShowLiveStreams] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    // Only show warning on mobile, once per session
    if (window.innerWidth < 768 && !sessionStorage.getItem('mobileWarningShown')) {
      setShowMobileWarning(true);
      sessionStorage.setItem('mobileWarningShown', 'true');
    }
  }, []);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fifa_tz', timezone);
    } catch(e) {}
  }, [timezone]);

  useEffect(() => {
    if (!loading && settings.welcomePopupEnabled) {
      let isLive = true;
      const now = new Date().getTime();
      if (settings.welcomePopupStartTime) {
        const start = new Date(settings.welcomePopupStartTime).getTime();
        if (now < start) isLive = false;
      }
      if (settings.welcomePopupEndTime) {
        const end = new Date(settings.welcomePopupEndTime).getTime();
        if (now > end) isLive = false;
      }

      if (isLive) {
        const hasSeen = sessionStorage.getItem('hasSeenWelcomePopup');
        if (!hasSeen) {
          setShowWelcomePopup(true);
          sessionStorage.setItem('hasSeenWelcomePopup', 'true');
        }
      }
    }
  }, [loading, settings.welcomePopupEnabled, settings.welcomePopupStartTime, settings.welcomePopupEndTime]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { notifiedMatches, toggleNotification } = useNotifications();

  // Notification checker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (notifiedMatches.length > 0 && Notification.permission === 'granted') {
        const upcoming = matchData.filter(m => notifiedMatches.includes(m.id));
        upcoming.forEach(match => {
          const matchTime = new Date(match.utc).getTime();
          const timeDiff = matchTime - now.getTime();
          
          // If match is exactly 15 minutes away (within a 1 minute window to avoid multiple alerts if app stays open)
          // Since interval runs every second, we check a narrow band and track alerted matches in memory.
          if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000 && !sessionStorage.getItem(`alerted_${match.id}`)) {
            new Notification('Match Starting Soon!', {
              body: `${match.home} vs ${match.away} starts in 15 minutes.`,
              icon: `https://flagcdn.com/w80/${getCountryCode(match.home)}.png`
            });
            sessionStorage.setItem(`alerted_${match.id}`, 'true');
          }
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [notifiedMatches]);

  const [wc26Games, setWc26Games] = useState<any[]>([]);
  const [wc26Teams, setWc26Teams] = useState<any[]>([]);
  const [wc26Standings, setWc26Standings] = useState<any[]>([]);

  useEffect(() => {
    let unmounted = false;
    async function loadGames() {
      try {
        const wc26 = await import('./services/wc26');
        const [games, teams, standings] = await Promise.all([
          wc26.getGames(),
          wc26.getTeams(),
          wc26.getStandings()
        ]);
        if (!unmounted) {
          setWc26Games(games);
          setWc26Teams(teams);
          setWc26Standings(standings);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadGames();
    const timer = setInterval(loadGames, 60000);
    return () => {
      unmounted = true;
      clearInterval(timer);
    };
  }, []);

  const mergedMatches = useMemo(() => {
    if (!wc26Games.length || !wc26Teams.length) {
       return matchData.map(m => ({...m, dataSource: "static" as const, status: 0}));
    }
    
    // dynamically import mapWC26MatchToAppMatch doesn't work well if we don't do it before hook or outside. So we'll just require it at the top level
    const mappedApiGames = wc26Games.map(g => mapWC26MatchToAppMatch(g, wc26Teams)).filter(Boolean);

    const getTeamFromStandings = (placeholder: string) => {
      if (!wc26Standings || !wc26Standings.length) return null;
      if (placeholder.startsWith("Winner ")) {
        const groupLetter = placeholder.replace("Winner ", "");
        const groupName = `Group ${groupLetter}`;
        const group = wc26Standings.find((g: any) => g[0]?.group === groupName);
        if (group && group[0]) return group[0].team.name;
      } else if (placeholder.startsWith("Runner-up ")) {
        const groupLetter = placeholder.replace("Runner-up ", "");
        const groupName = `Group ${groupLetter}`;
        const group = wc26Standings.find((g: any) => g[0]?.group === groupName);
        if (group && group[1]) return group[1].team.name;
      }
      return null;
    };

    const firstPass = matchData.map(m => {
       let liveGame = mappedApiGames.find(apiM => apiM?.id === m.id);

       if (!liveGame) {
         liveGame = mappedApiGames.find(apiM => 
           apiM?.group === m.group &&
           apiM?.home?.toLowerCase() === m.home.toLowerCase() && 
           apiM?.away?.toLowerCase() === m.away.toLowerCase()
         );
       }

       if (!liveGame) {
          liveGame = mappedApiGames.find(apiM => 
            apiM?.home?.toLowerCase() === m.home.toLowerCase() && 
            apiM?.away?.toLowerCase() === m.away.toLowerCase()
          );
       }
       
       if (!liveGame && ['R32', 'R16', 'QF', 'SF', '3rd', 'Final'].includes(m.stage || '')) {
          liveGame = mappedApiGames.find(apiM => 
            apiM?.utc === m.utc
          );
       }

       let finalHome = liveGame?.home || m.home;
       let finalAway = liveGame?.away || m.away;
       let isTentative = liveGame ? (liveGame.isTentative || false) : false;

       // Attempt to get tentative team from standings if API hasn't resolved it
       if ((!liveGame || liveGame.isTentative) && ['R32', 'R16'].includes(m.stage || '')) {
         const tentativeHome = getTeamFromStandings(finalHome);
         if (tentativeHome) {
            finalHome = tentativeHome;
            isTentative = true;
         }
         const tentativeAway = getTeamFromStandings(finalAway);
         if (tentativeAway) {
            finalAway = tentativeAway;
            isTentative = true;
         }
       }

       if (liveGame) {
          return {
             ...m,
             home: finalHome,
             away: finalAway,
             status: liveGame.status || 0,
             score: liveGame.score,
             dataSource: "live" as const,
             elapsed: liveGame.elapsed,
             homeScore: liveGame.homeScore,
             awayScore: liveGame.awayScore,
             isTentative,
             utc: liveGame.utc && liveGame.utc !== m.utc ? liveGame.utc : m.utc
          } as AppMatch;
       }
       
       return { ...m, home: finalHome, away: finalAway, isTentative, dataSource: "static" as const, status: 0 } as AppMatch;
    });
    
    // Second pass to resolve 'W Match X' or 'W R16-X' if the previous match has finished
    return firstPass.map(m => {
       if (m.dataSource === 'static') {
          let newHome = m.home;
          let newAway = m.away;
          let changed = false;
          let tentative = m.isTentative;

          const resolvePlaceholder = (placeholder: string) => {
             const match = placeholder.match(/^W Match (\d+)$/);
             if (match) {
                const prevId = parseInt(match[1]);
                const prevM = firstPass.find(pm => pm.id === prevId);
                if (prevM && prevM.status === 2 && prevM.homeScore !== undefined && prevM.awayScore !== undefined) {
                   return prevM.homeScore > prevM.awayScore ? prevM.home : prevM.away;
                }
                if (prevM && (prevM.isTentative || (!prevM.home.startsWith('W Match') && !prevM.home.startsWith('Runner-up') && !prevM.home.startsWith('Winner')))) {
                   return `Winner of ${prevM.home} vs ${prevM.away}`;
                }
             }
             
             const stageMatch = placeholder.match(/^(W|L) (R16|QF|SF)-(\d+)$/);
             if (stageMatch) {
                const type = stageMatch[1]; // W or L
                const stagePrefix = stageMatch[2]; // R16, QF, SF
                const num = parseInt(stageMatch[3]);
                
                let prevId = 0;
                if (stagePrefix === 'R16') prevId = 88 + num; // R16-1 is 89
                if (stagePrefix === 'QF') prevId = 96 + num; // QF-1 is 97
                if (stagePrefix === 'SF') prevId = 100 + num; // SF-1 is 101

                if (prevId) {
                   const prevM = firstPass.find(pm => pm.id === prevId);
                   if (prevM && prevM.status === 2 && prevM.homeScore !== undefined && prevM.awayScore !== undefined) {
                      if (type === 'W') {
                         return prevM.homeScore > prevM.awayScore ? prevM.home : prevM.away;
                      } else {
                         return prevM.homeScore < prevM.awayScore ? prevM.home : prevM.away;
                      }
                   }
                   if (prevM && prevM.home && prevM.away && !prevM.home.startsWith('W ') && !prevM.home.startsWith('L ')) {
                      return `${type === 'W' ? 'Winner' : 'Loser'} of ${prevM.home} vs ${prevM.away}`;
                   }
                }
             }
             return null;
          };

          const resolvedHome = resolvePlaceholder(m.home);
          if (resolvedHome) { newHome = resolvedHome; changed = true; tentative = true; }
          const resolvedAway = resolvePlaceholder(m.away);
          if (resolvedAway) { newAway = resolvedAway; changed = true; tentative = true; }

          if (changed) {
             return { ...m, home: newHome, away: newAway, isTentative: tentative };
          }
       }
       return m;
    });
  }, [wc26Games, wc26Teams, wc26Standings]);

  const tournamentDates = useMemo(() => {
    return eachDayOfInterval({
      start: parseISO('2026-06-12'),
      end: parseISO('2026-07-19')
    });
  }, []);

  const filteredMatches = useMemo(() => {
    let result = mergedMatches;
    
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.home.toLowerCase().includes(s) ||
          m.away.toLowerCase().includes(s) ||
          m.city.toLowerCase().includes(s) ||
          m.venue.toLowerCase().includes(s) ||
          formatDFNS(toZonedTime(m.utc, timezone), 'EEEE, dd MMMM yyyy').toLowerCase().includes(s) ||
          formatDFNS(toZonedTime(m.utc, timezone), 'yyyy-MM-dd').includes(s)
      );
    }
    
    if (filterDate) {
      result = result.filter(m => {
        const matchDateStr = formatDFNS(toZonedTime(m.utc, timezone), 'yyyy-MM-dd');
        return matchDateStr === filterDate;
      });
    }

    return result.filter((m) => m.stage === stage && (stage !== 'Group' || !group || m.group === group));
  }, [mergedMatches, search, filterDate, stage, group, timezone]);

  const groupedByDate = useMemo(() => {
    const res: Record<string, AppMatch[]> = {};
    filteredMatches.forEach((m) => {
      const zonedDate = toZonedTime(new Date(m.utc), timezone);
      const dateKey = formatDFNS(zonedDate, 'EEEE, dd MMMM yyyy');
      
      if (!res[dateKey]) res[dateKey] = [];
      res[dateKey].push(m);
    });
    return res;
  }, [filteredMatches, timezone]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfError(false);
    try {
      const { generateTimetablePDF } = await import('./utils/pdfExport');
      const tzLabel = timezones.find((t) => t.value === timezone)?.label?.split(' – ')[0] || 'IST';
      await generateTimetablePDF(filteredMatches, {
        teamName: search ? search.trim() : null,
        timezone,
        tzLabel,
        downloadImmediately: true
      });
    } catch(e) {
      console.error("Failed to generate PDF", e);
      setPdfError(true);
      setTimeout(() => setPdfError(false), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const tzLabel = timezones.find((t) => t.value === timezone)?.label?.split(' – ')[0] || 'IST';

  // Check URL params for widget mode
  const isWidget = typeof window !== 'undefined' && window.location.search.includes('widget=true');

  if (isWidget) {
    return (
      <div className="min-h-screen p-4 transition-colors duration-300">
        <LiveScore matches={mergedMatches as any[]} timezone={timezone} timeFormat={timeFormat} />
      </div>
    );
  }

  if (showLiveStreams) {
    return <LiveStreamsPage onBack={() => setShowLiveStreams(false)} />;
  }

  if (showSupportPage) {
    return <SupportPage onBack={() => setShowSupportPage(false)} />;
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] transition-colors duration-300 flex flex-col overflow-x-hidden">
      <EventNotifications />
      
      {/* Rolling Disclaimer Ticker */}
      {settings.newsMarqueeMessage && (
      <div className="bg-[#d4af37] text-black overflow-hidden py-1 relative z-50">
        <div className="animate-ticker inline-flex whitespace-nowrap font-bold uppercase tracking-widest text-[10px] sm:text-xs items-center gap-2">
           <div className="rich-text-marquee" dangerouslySetInnerHTML={{ __html: settings.newsMarqueeMessage }} />
           <span>•</span>
           <div className="rich-text-marquee" dangerouslySetInnerHTML={{ __html: settings.newsMarqueeMessage }} />
           <span>•</span>
           <div className="rich-text-marquee" dangerouslySetInnerHTML={{ __html: settings.newsMarqueeMessage }} />
           <span>•</span>
           <div className="rich-text-marquee" dangerouslySetInnerHTML={{ __html: settings.newsMarqueeMessage }} />
        </div>
      </div>
      )}

      {/* Top Utility Bar */}
      <div className="bg-black text-white text-[10px] sm:text-xs py-2 px-4 flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 border-b border-white/10 z-50 relative w-full overflow-hidden">
        <div className="flex items-center gap-2 font-mono text-gray-400 flex-wrap justify-center">
          Created by <span className="text-[#d4af37] font-bold">Samihan Chatterjee</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button 
            onClick={() => setShowSupportPage(true)}
            className="flex items-center gap-1.5 text-[#d4af37] hover:text-white transition-colors font-mono font-bold"
          >
            <Heart size={14} className="animate-pulse" /> Support / Donate
          </button>
          <span className="text-gray-600">|</span>
          <a 
            href={settings.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-green-500 hover:text-green-400 transition-colors font-mono font-bold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893v-.002a11.815 11.815 0 00-3.48-8.413" />
            </svg>
            Join WhatsApp
          </a>
        </div>
      </div>

      <header className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/90 backdrop-blur-2xl relative overflow-hidden">
        <ParticleBackground />
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 shrink-0 group">
            <div className="flex items-center justify-center relative w-[50px] h-[50px]">
               {settings.siteLogo ? (
                 <img src={settings.siteLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                     {/* 1 */}
                     <path d="M 20 40 L 35 40 L 35 75 L 50 75 L 50 85 L 20 85 Z" fill="none" stroke="#ffffff" strokeWidth="4" />
                     {/* P */}
                     <path d="M 40 25 L 70 25 C 85 25 85 55 70 55 L 60 55 L 60 70 L 50 70 L 50 35 L 70 35 C 75 35 75 45 70 45 L 60 45" fill="none" stroke="#d4af37" strokeWidth="4" />
                     <circle cx="50" cy="50" r="12" fill="#d4af37" />
                   </svg>
                 </div>
               )}
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest">FIFA</div>
              <div className="font-extrabold text-lg tracking-wider uppercase">
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f8d568] to-[#8a6d1c]">World Cup </span>
                <span>2026</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:ml-auto w-full md:w-auto">
            {settings.watchLiveEnabled && (
              <button 
                onClick={() => setShowLiveStreams(true)}
                className="bg-gradient-to-r from-gray-200 via-white to-gray-300 text-black font-extrabold px-6 py-3 rounded-xl text-base flex items-center gap-2 hover:scale-105 hover:from-white hover:to-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.7)] whitespace-nowrap animate-pulse border border-gray-100"
              >
                <Play size={20} className="fill-black" /> WATCH LIVE
              </button>
            )}
            
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs font-mono bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-color)] outline-none focus:border-[#d4af37] flex-none shadow-sm"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[#d4af37] transition-colors shadow-sm"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Global App Nav */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-color)]/50">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap gap-4 text-sm font-bold uppercase tracking-wider font-mono">
            {['matches', 'bracket', 'stats', 'stadiums', 'news'].map(tab => {
              const labels: any = {
                'matches': <><Calendar className="w-4 h-4 inline-block mr-2" /> Matches</>,
                'bracket': <><span className="mr-2">🏆</span> Bracket</>,
                'stats': <><Activity className="w-4 h-4 mr-2" /> Standings & Stats</>,
                'stadiums': <><MapPin className="w-4 h-4 inline-block mr-2" /> Stadiums</>,
                'news': <><Newspaper className="w-4 h-4 inline-block mr-2" /> Live News</>
              };
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)} 
                  className={`relative px-2 py-3 transition-colors flex items-center ${activeTab === tab ? 'text-[#d4af37]' : 'text-slate-500 hover:text-[var(--text-color)]'}`}
                >
                  {labels[tab]}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <NextMatchBanner 
        matches={mergedMatches as any[]} 
        timezone={timezone} 
        notifiedMatches={notifiedMatches} 
        onToggleNotification={toggleNotification} 
      />

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-5xl mx-auto px-4 mt-4 fade-in relative z-20">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl flex flex-wrap gap-6 items-center shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Theme</span>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] hover:border-[#d4af37]"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span className="text-xs font-mono">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Time Format</span>
              <div className="flex bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg p-1">
                {['12h', '24h', 'ISO'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setTimeFormat(fmt)}
                    className={`px-3 py-1 text-xs font-mono rounded-md ${timeFormat === fmt ? 'bg-[#d4af37] text-black font-bold' : 'text-[var(--muted-text)] hover:text-[var(--text-color)]'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto text-xs text-green-500 font-mono">
              ✓ Preferences saved to local storage
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 relative z-20">

        <AnimatePresence mode="wait">
          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NewsFeed />
            </motion.div>
          )}
          
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MatchDashboard />
            </motion.div>
          )}

          {activeTab === 'stadiums' && (
            <motion.div
              key="stadiums"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Stadiums />
            </motion.div>
          )}

          {activeTab === 'bracket' && (
            <motion.div
              key="bracket"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full mb-10"
            >
              <KnockoutBracket matches={mergedMatches as any[]} settings={settings} onTeamClick={setTeamToCompare} />
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 fade-in">
                <LiveScore matches={mergedMatches as any[]} timezone={timezone} timeFormat={timeFormat} onWatchLive={settings.watchLiveEnabled ? () => setShowWatchPopup(true) : undefined} onTeamClick={setTeamToCompare} />
              </div>

            {/* Search and Date Filter */}
            <div className="relative mb-5 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search team, city, venue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-10 py-3 text-sm text-[var(--text-color)] placeholder:text-slate-500 outline-none focus:border-[#d4af37] transition-colors font-mono shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#d4af37]">
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={cn(
                    "bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm outline-none transition-colors font-mono shadow-sm flex items-center justify-between gap-3",
                    filterDate ? "text-[#d4af37] border-[#d4af37]/50" : "text-[var(--text-color)] hover:border-[#d4af37]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className={filterDate ? "text-[#d4af37]" : "text-slate-500"} />
                    <span>{filterDate ? formatDFNS(parseISO(filterDate), 'dd MMM yyyy') : 'Filter by Date'}</span>
                  </div>
                  {filterDate && (
                    <X 
                      size={16} 
                      className="opacity-70 hover:opacity-100" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterDate('');
                      }} 
                    />
                  )}
                </button>
                
                <AnimatePresence>
                  {showDatePicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-[320px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 p-4 max-h-[400px] overflow-y-auto custom-scrollbar"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm">Select Match Date</h3>
                          <button onClick={() => setShowDatePicker(false)} className="text-slate-500 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {tournamentDates.map((date) => {
                            const dateStr = formatDFNS(date, 'yyyy-MM-dd');
                            const isSelected = filterDate === dateStr;
                            
                            return (
                              <button
                                key={dateStr}
                                onClick={() => {
                                  setFilterDate(dateStr);
                                  setShowDatePicker(false);
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-lg border transition-colors",
                                  isSelected 
                                    ? "bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]" 
                                    : "border-transparent hover:bg-white/5 hover:border-white/10"
                                )}
                              >
                                <span className="text-[10px] uppercase text-slate-500 font-bold">{formatDFNS(date, 'MMM')}</span>
                                <span className="text-lg font-bold font-mono">{formatDFNS(date, 'dd')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={handleDownloadPDF} 
                disabled={isGeneratingPDF}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border font-bold font-mono transition-colors shadow-sm text-sm ${
                  pdfError ? 'bg-red-500/10 text-red-500 border-red-500/50' : 
                  isGeneratingPDF ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30 cursor-wait' :
                  'bg-[var(--card-bg)] text-[var(--text-color)] hover:text-[#d4af37] border-[var(--border-color)] hover:border-[#d4af37]'
                }`}
              >
                <Download size={16} /> 
                <span>
                  {pdfError ? 'FAILED' : isGeneratingPDF ? 'GENERATING...' : 'SAVE TIMETABLE AS PDF'}
                </span>
              </button>
            </div>

            {/* Filters */}
            {!search && (
              <>
                <div className="flex flex-wrap gap-2 pb-2 mb-4">
                  {stages.map((stg) => (
                    <button
                      key={stg}
                      onClick={() => { setStage(stg); setGroup(null); }}
                      className={`relative px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors duration-200 font-mono uppercase tracking-wide
                        ${stage === stg ? 'text-black border-[#d4af37]' : 'bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[#d4af37]/50'}`}
                    >
                      {stage === stg && (
                        <motion.div 
                          layoutId="activeStageIndicator"
                          className="absolute inset-0 bg-gradient-to-br from-[#f8d568] to-[#d4af37] rounded-lg -z-10 shadow-md"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={stage === stg ? "relative z-10" : ""}>{stageMap[stg]}</span>
                    </button>
                  ))}
                </div>

                {stage === 'Group' && (
                  <div className="mb-5 fade-in">
                    <div className="flex gap-2 flex-wrap mb-3">
                      <button
                        onClick={() => setGroup(null)}
                        className={`relative px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-colors ${
                          !group ? 'border-[#d4af37] text-[#d4af37]' : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--muted-text)] hover:border-[#d4af37]/50'
                        }`}
                      >
                        {!group && (
                          <motion.div 
                            layoutId="activeGroupIndicator"
                            className="absolute inset-0 bg-[#d4af37]/20 rounded-lg -z-10"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className={!group ? "relative z-10" : ""}>ALL GROUPS</span>
                      </button>
                      {'ABCDEFGHIJKL'.split('').map((g) => (
                        <button
                          key={g}
                          onClick={() => setGroup(g)}
                          className={`relative px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-colors ${
                            group === g ? 'border-[#d4af37] text-[#d4af37]' : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--muted-text)] hover:border-[#d4af37]/50'
                          }`}
                        >
                          {group === g && (
                            <motion.div 
                              layoutId="activeGroupIndicator"
                              className="absolute inset-0 bg-[#d4af37]/20 rounded-lg -z-10"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <span className={group === g ? "relative z-10" : ""}>GRP {g}</span>
                        </button>
                      ))}
                    </div>

                    {group && groupTeams[group] && (
                      <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] mb-4 shadow-sm fade-in">
                        <div className="text-xs font-mono text-[var(--muted-text)] uppercase tracking-widest mb-2">
                          Group {group} Teams
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupTeams[group].map((team) => (
                            <span key={team} className="text-sm px-3 py-1 rounded-md bg-[var(--accent-bg)] border border-[var(--border-color)] font-medium flex items-center gap-2">
                              <img src={`https://flagcdn.com/w40/${getCountryCode(team)}.png`} alt="" className="w-5 object-contain" /> {team}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="text-xs text-[var(--muted-text)] font-mono mb-4 flex justify-between items-center">
              <div>
                {search 
                  ? `Search results for "${search}": ${filteredMatches.length} match${filteredMatches.length !== 1 ? 'es' : ''}` 
                  : `${stageMap[stage]}${group ? ` · Group ${group}` : ''} · ${filteredMatches.length} matches · Times in ${tzLabel}`}
              </div>
              <button onClick={handleDownloadPDF} className="sm:hidden text-[#d4af37] p-1 border border-[#d4af37]/30 rounded">
                <Download size={14}/>
              </button>
            </div>

            <motion.div layout ref={printRef} className="space-y-6 fade-in bg-[var(--bg-color)]">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted-text)] font-mono text-sm">
                  No matches found :(
                </div>
              ) : (
                <AnimatePresence>
                {(Object.entries(groupedByDate) as [string, AppMatch[]][]).sort((a,b) => {
                  const todayStr = formatDFNS(toZonedTime(new Date(), timezone), 'EEEE, dd MMMM yyyy');
                  const tomorrowStr = formatDFNS(toZonedTime(addDays(new Date(), 1), timezone), 'EEEE, dd MMMM yyyy');
                  const aIsToday = a[0] === todayStr;
                  const bIsToday = b[0] === todayStr;
                  if (aIsToday && !bIsToday) return -1;
                  if (!aIsToday && bIsToday) return 1;
                  
                  const aIsTomorrow = a[0] === tomorrowStr;
                  const bIsTomorrow = b[0] === tomorrowStr;
                  if (aIsTomorrow && !bIsTomorrow) return -1;
                  if (!aIsTomorrow && bIsTomorrow) return 1;
                  
                  return new Date(a[1][0].utc).getTime() - new Date(b[1][0].utc).getTime();
                }).map(([dateLabel, dateMatches]) => {
                  
                  // Check if today or tomorrow
                  const todayStr = formatDFNS(toZonedTime(new Date(), timezone), 'EEEE, dd MMMM yyyy');
                  const tomorrowStr = formatDFNS(toZonedTime(addDays(new Date(), 1), timezone), 'EEEE, dd MMMM yyyy');
                  
                  const isTodayLabel = todayStr === dateLabel;
                  const isTomorrowLabel = tomorrowStr === dateLabel;
                  
                  let displayLabel = dateLabel;
                  if (isTodayLabel) displayLabel = 'Today';
                  else if (isTomorrowLabel) displayLabel = 'Tomorrow';

                  return (
                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: "circOut" }} key={dateLabel} className="bg-[var(--bg-color)] pt-2 relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`text-sm font-semibold uppercase tracking-widest whitespace-nowrap px-2 py-0.5 rounded ${isTodayLabel ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50' : isTomorrowLabel ? 'bg-blue-500/10 text-blue-500 border border-blue-500/50' : 'text-[#d4af37]'}`}>
                        {displayLabel}
                      </div>
                      <div className={cn("flex-1 h-px", isTodayLabel ? "bg-amber-500/30" : isTomorrowLabel ? "bg-blue-500/30" : "bg-[var(--border-color)]")}></div>
                      <div className="text-[10px] font-mono text-[var(--muted-text)]">
                        {dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''}
                      </div>
                    </div>

                    <motion.div layout className="flex flex-wrap gap-4">
                      <AnimatePresence>
                      {dateMatches.map((m) => {
                        const isKnockout = m.stage !== 'Group';
                        const isFinal = m.stage === 'Final';
                        
                        return (
                          <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} key={m.id} className="w-full md:w-[calc(50%-0.5rem)]">
                            <MatchCard 
                              match={m} 
                              timezone={timezone} 
                              timeFormat={timeFormat} 
                              isFinal={isFinal} 
                              isKnockout={isKnockout} 
                              onClick={setSelectedMatch}
                              onTeamClick={setTeamToCompare}
                              notifiedMatches={notifiedMatches}
                              onToggleNotification={toggleNotification}
                            />
                          </motion.div>
                        );
                      })}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )})
                }
                </AnimatePresence>
              )}
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-[#111] border-t border-[#d4af37]/20 py-8 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-3">
              <img src={settings.siteLogo} alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-[#d4af37] font-mono text-lg tracking-wider uppercase">The Predictor</span>
            </div>
          </div>
        </div>
      </footer>
      
      {showWelcomePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="bg-[#111] border border-[#d4af37]/30 rounded-2xl p-8 w-full max-w-md shadow-2xl relative text-center">
             <button onClick={() => setShowWelcomePopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
             <div className="w-16 h-16 mx-auto mb-6">
               <img src={settings.siteLogo} alt="Logo" className="w-full h-full object-contain" />
             </div>
             <p className="text-white text-lg font-mono mb-8 whitespace-pre-wrap">{settings.welcomePopupMessage}</p>
             <button 
               onClick={() => setShowWelcomePopup(false)} 
               className="w-full text-center bg-[#d4af37] text-black font-bold py-3 rounded-lg hover:bg-[#b0902c] transition-colors"
             >
                ENTER SITE
             </button>
          </div>
        </div>
      )}

      {showMobileWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-8 w-full max-w-md shadow-2xl relative text-center">
             <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#d4af37]/20 text-[#d4af37]">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
             </div>
             <h2 className="text-2xl font-bold font-display mb-4">Mobile Device Detected</h2>
             <p className="text-[var(--text-color)] opacity-80 mb-6 font-mono text-sm leading-relaxed">
               For the best experience, including full bracket view and detailed stats, we recommend using a desktop computer or viewing in landscape mode.
             </p>
             <button 
               onClick={() => setShowMobileWarning(false)} 
               className="block w-full bg-[#d4af37] text-black font-bold py-3 px-4 rounded-xl hover:bg-[#b0902c] transition-colors"
             >
                Continue Anyway
             </button>
          </div>
        </div>
      )}

      {selectedMatch && (
        <MatchPopup 
          match={selectedMatch} 
          timezone={timezone} 
          onClose={() => setSelectedMatch(null)}
          onWatchLive={settings.watchLiveEnabled ? () => {
             setSelectedMatch(null);
             setShowLiveStreams(true);
          } : undefined}
        />
      )}

      {teamToCompare && (
        <TeamCompareModal
          initialTeam={teamToCompare}
          onClose={() => setTeamToCompare(null)}
          allGames={wc26Games}
          allTeams={wc26Teams}
        />
      )}
    </div>
  );
}

export default App;
