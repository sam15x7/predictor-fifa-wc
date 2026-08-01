import React, { useState, useEffect, useRef } from 'react';
import { AppMatch } from '../types';
import { flagMap } from '../data';
import { getCountryCode } from '../lib/fifa-utils';
import { cn } from '../lib/utils';
import { Download, Trophy } from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

interface KnockoutBracketProps {
  matches: AppMatch[];
  settings: any;
  onTeamClick?: (teamName: string) => void;
}

export default function KnockoutBracket({ matches, settings, onTeamClick }: KnockoutBracketProps) {
  const [isExporting, setIsExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bracketGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      scrollRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
    }
  }, []);

  const getMatch = (id: number) => matches.find((m) => m.id === id);

  const handleDownload = async () => {
    const node = bracketGridRef.current;
    if (!node) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(node, {
        backgroundColor: '#040404',
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: {
          transform: 'translate(0, 0)',
          transformOrigin: 'top left',
          overflow: 'visible',
        }
      });

      const link = document.createElement('a');
      link.download = 'bracket.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export bracket', err);
    } finally {
      setIsExporting(false);
    }
  };


  const resolveTeamName = (
    originalName: string,
    originalTentative?: boolean
  ): { resolvedName: string; isTentative: boolean; isPlaceholder: boolean } => {
    if (!originalName) return { resolvedName: 'TBD', isTentative: true, isPlaceholder: true };
    let name = originalName;
    let isTentative = !!originalTentative;

    const wMatchMatch = name.match(/(?:W Match|Winner Match) (\d+)/);
    if (wMatchMatch) {
      const sourceId = parseInt(wMatchMatch[1], 10);
      const sourceMatch = getMatch(sourceId);
      if (sourceMatch && (sourceMatch.status === 1 || sourceMatch.status === 2)) {
        if ((sourceMatch.homeScore || 0) > (sourceMatch.awayScore || 0)) {
          return resolveTeamName(sourceMatch.home, sourceMatch.isTentative);
        } else if ((sourceMatch.awayScore || 0) > (sourceMatch.homeScore || 0)) {
          return resolveTeamName(sourceMatch.away, sourceMatch.isTentative);
        }
      }
      return { resolvedName: 'TBD', isTentative: true, isPlaceholder: true };
    }

    const loserMatchMatch = name.match(/Loser M(?:atch )?(\d+)/);
    if (loserMatchMatch) {
      const sourceId = parseInt(loserMatchMatch[1], 10);
      const sourceMatch = getMatch(sourceId);
      if (sourceMatch && (sourceMatch.status === 1 || sourceMatch.status === 2)) {
        if ((sourceMatch.homeScore || 0) > (sourceMatch.awayScore || 0)) {
          return resolveTeamName(sourceMatch.away, sourceMatch.isTentative);
        } else if ((sourceMatch.awayScore || 0) > (sourceMatch.homeScore || 0)) {
          return resolveTeamName(sourceMatch.home, sourceMatch.isTentative);
        }
      }
      return { resolvedName: 'TBD', isTentative: true, isPlaceholder: true };
    }

    const isPlaceholder = name.includes('Winner') || name.includes('Runner-up') || name.includes('3rd') || name === 'TBD';
    return { resolvedName: isPlaceholder ? 'TBD' : name, isTentative, isPlaceholder };
  };

  const MatchCard = ({ matchId }: { matchId: number }) => {
    const match = getMatch(matchId);
    if (!match) return <div className="h-[76px] opacity-0" />;

    const home = resolveTeamName(match.home, match.isTentative);
    const away = resolveTeamName(match.away, match.isTentative);

    const isLive = match.status === 1;
    const isFinished = match.status === 2;

    const homeWon = isFinished && (match.homeScore || 0) > (match.awayScore || 0);
    const awayWon = isFinished && (match.awayScore || 0) > (match.homeScore || 0);

    return (
      <div className="bg-[#121212]/95 border border-[#d4af37]/30 rounded-xl p-2 shadow-[0_0_20px_rgba(212,175,55,0.05),inset_0_0_10px_rgba(212,175,55,0.05)] text-sm flex flex-col gap-1 w-full relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#d4af37]/50 bg-[#121212] px-1 rounded-sm tracking-wider">
          M{matchId}
        </div>
        
        <div className={cn("flex items-center justify-between bg-[#111] rounded-lg p-1.5 transition-colors", homeWon && "bg-[#1a1a1a]")}>
          <div className="flex items-center gap-2">
            {getCountryCode(home.resolvedName) !== 'un' ? (
              <img src={`https://flagcdn.com/w40/${getCountryCode(home.resolvedName)}.png`} alt="" className="w-5 object-contain rounded-[2px]" />
            ) : (
              <span className="w-5 text-center leading-none inline-block drop-shadow-sm text-sm">{flagMap[home.resolvedName] || ''}</span>
            )}
            <span 
              className={cn("font-semibold text-white/90 truncate max-w-[100px]", !home.isPlaceholder && "cursor-pointer hover:text-[#d4af37]", home.isPlaceholder && "text-white/40 font-normal", homeWon && "text-[#d4af37]")}
              onClick={() => {
                if (!home.isPlaceholder && onTeamClick) onTeamClick(home.resolvedName);
              }}
            >
              {home.resolvedName}
            </span>
          </div>
          <span className={cn("font-bold font-mono", homeWon ? "text-[#d4af37]" : "text-white/60", isLive && "text-red-400 animate-pulse")}>
            {match.homeScore ?? '-'}
          </span>
        </div>

        <div className={cn("flex items-center justify-between bg-[#111] rounded-lg p-1.5 transition-colors", awayWon && "bg-[#1a1a1a]")}>
          <div className="flex items-center gap-2">
            {getCountryCode(away.resolvedName) !== 'un' ? (
              <img src={`https://flagcdn.com/w40/${getCountryCode(away.resolvedName)}.png`} alt="" className="w-5 object-contain rounded-[2px]" />
            ) : (
              <span className="w-5 text-center leading-none inline-block drop-shadow-sm text-sm">{flagMap[away.resolvedName] || ''}</span>
            )}
            <span 
              className={cn("font-semibold text-white/90 truncate max-w-[100px]", !away.isPlaceholder && "cursor-pointer hover:text-[#d4af37]", away.isPlaceholder && "text-white/40 font-normal", awayWon && "text-[#d4af37]")}
              onClick={() => {
                if (!away.isPlaceholder && onTeamClick) onTeamClick(away.resolvedName);
              }}
            >
              {away.resolvedName}
            </span>
          </div>
          <span className={cn("font-bold font-mono", awayWon ? "text-[#d4af37]" : "text-white/60", isLive && "text-red-400 animate-pulse")}>
            {match.awayScore ?? '-'}
          </span>
        </div>
      </div>
    );
  };

  const leftR32 = [74, 77, 73, 75, 83, 84, 81, 82];
  const leftR16 = [89, 90, 93, 94];
  const leftQF = [97, 98];
  const leftSF = [101];

  const rightR32 = [76, 78, 79, 80, 86, 88, 85, 87];
  const rightR16 = [91, 92, 95, 96];
  const rightQF = [99, 100];
  const rightSF = [102];

  return (
    <div className="w-full flex flex-col overflow-hidden relative rounded-2xl border border-[var(--border-color)] bg-[#040404] shadow-lg h-[80vh] sm:h-[85vh]">
      {/* Background World Map glow effect */}
      <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-center bg-no-repeat bg-contain opacity-5 filter hue-rotate-15 pointer-events-none"></div>
      
      {/* HEADER: lives OUTSIDE the scroll zone */}
      <div className="w-full flex-shrink-0 flex items-center justify-between px-4 py-3 relative z-20 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="text-xs sm:text-sm font-bold font-mono uppercase tracking-widest text-[#d4af37]">
          Knockout Stage Bracket
        </div>
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex justify-center items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#d4af37] text-black font-bold text-xs sm:text-sm hover:bg-[#b0902c] transition-colors disabled:opacity-50 shrink-0"
        >
          <Download size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Download Bracket</span>
          <span className="sm:hidden">Download</span>
        </button>
      </div>

      {/* BRACKET GRID: the ONLY thing that scrolls horizontally */}
      <div ref={scrollRef} className="flex-1 w-full overflow-x-auto p-6 scrollbar-none custom-scrollbar">
        <div className="w-max min-w-full flex justify-center">
          <div 
            ref={bracketGridRef}
            id="worldCupBracket" 
            className="grid gap-6 py-8 px-4"
            style={{ gridTemplateColumns: "220px 200px 180px 180px 380px 180px 180px 200px 220px" }}
          >
            {/* Round of 32 (Left) */}
          <div className="flex flex-col justify-around gap-2 py-4">
            {leftR32.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Round of 16 (Left) */}
          <div className="flex flex-col justify-around gap-6 py-10">
            {leftR16.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Quarter Finals (Left) */}
          <div className="flex flex-col justify-around gap-12 py-24">
            {leftQF.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Semi Finals (Left) */}
          <div className="flex flex-col justify-around py-48">
            {leftSF.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Finals / Center */}
          <div className="flex flex-col items-center justify-center gap-8 relative z-20">
            <div className="text-center">
               <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f8d568] to-[#8a6d1c] tracking-[0.2em] mb-2 drop-shadow-lg">FIFA WORLD CUP 2026</h1>
               <p className="text-[#d4af37]/60 font-mono text-sm tracking-widest uppercase">Knockout Stage</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4af37]/20 blur-[60px] rounded-full"></div>
              {settings.siteLogo ? (
                <img src={settings.siteLogo} alt="The Predictor" className="w-48 h-48 object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.6)] relative z-10" />
              ) : (
                <Trophy className="w-40 h-40 text-[#d4af37] drop-shadow-[0_0_40px_rgba(212,175,55,0.6)] relative z-10" strokeWidth={1} />
              )}
            </div>
            
            <div className="w-full flex flex-col items-center gap-4 mt-2">
              <div className="text-white/80 font-bold tracking-[0.3em] text-lg">THE PREDICTOR</div>
              <div className="text-[#d4af37] font-black tracking-[0.3em] text-lg">FINAL</div>
              <div className="w-[300px]">
                <MatchCard matchId={104} />
              </div>
            </div>
            
            <div className="w-full flex flex-col items-center gap-2 mt-8">
              <div className="text-white/40 font-bold tracking-[0.2em] text-xs">THIRD PLACE</div>
              <div className="w-[280px]">
                <MatchCard matchId={103} />
              </div>
            </div>
          </div>
          
          {/* Semi Finals (Right) */}
          <div className="flex flex-col justify-around py-48">
            {rightSF.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Quarter Finals (Right) */}
          <div className="flex flex-col justify-around gap-12 py-24">
            {rightQF.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Round of 16 (Right) */}
          <div className="flex flex-col justify-around gap-6 py-10">
            {rightR16.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
          {/* Round of 32 (Right) */}
          <div className="flex flex-col justify-around gap-2 py-4">
            {rightR32.map((id) => <MatchCard key={id} matchId={id} />)}
          </div>
          
        </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.4);
        }
      `}} />
    </div>
  );
}
