import React, { useState, useMemo } from 'react';
import { X, Activity, Swords, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getCountryCode } from '../lib/fifa-utils';
import { WC26Game, WC26Team } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamCompareModalProps {
  initialTeam: string | null;
  onClose: () => void;
  allGames: WC26Game[];
  allTeams: WC26Team[];
}

export default function TeamCompareModal({ initialTeam, onClose, allGames, allTeams }: TeamCompareModalProps) {
  const [team1, setTeam1] = useState<string | null>(initialTeam);
  const [team2, setTeam2] = useState<string | null>(null);

  // Get unique teams from games (using team names)
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    allGames.forEach(g => {
      if (g.home_team_label && g.home_team_id === '0') return; // skip placeholders
      if (g.away_team_label && g.away_team_id === '0') return;
      
      const t1 = allTeams.find(t => t.id === g.home_team_id)?.name_en || g.home_team_name_en;
      const t2 = allTeams.find(t => t.id === g.away_team_id)?.name_en || g.away_team_name_en;
      
      if (t1) teams.add(t1);
      if (t2) teams.add(t2);
    });
    return Array.from(teams).sort();
  }, [allGames, allTeams]);

  // Normalize team name helper
  const normalizeTeamName = (name: string) => {
    const n = name.trim();
    if (n === 'United States') return 'USA';
    if (n === 'Czech Republic') return 'Czechia';
    if (n === 'Democratic Republic of the Congo') return 'DR Congo';
    return n;
  };

  const normalizedUniqueTeams = useMemo(() => {
    return uniqueTeams.map(normalizeTeamName).filter((v, i, a) => a.indexOf(v) === i).sort();
  }, [uniqueTeams]);

  // Compute form for a team
  const getTeamForm = (teamName: string) => {
    const games = allGames.filter(g => {
      const h = normalizeTeamName(allTeams.find(t => t.id === g.home_team_id)?.name_en || g.home_team_name_en || '');
      const a = normalizeTeamName(allTeams.find(t => t.id === g.away_team_id)?.name_en || g.away_team_name_en || '');
      return (h === teamName || a === teamName) && g.finished === 'TRUE';
    }).sort((a, b) => new Date(b.local_date || 0).getTime() - new Date(a.local_date || 0).getTime());

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    const recentResults = games.slice(0, 5).map(g => {
      const h = normalizeTeamName(allTeams.find(t => t.id === g.home_team_id)?.name_en || g.home_team_name_en || '');
      const isHome = h === teamName;
      const parsedHScore = parseInt(g.home_score || '0');
      const parsedAScore = parseInt(g.away_score || '0');
      const hScore = isNaN(parsedHScore) ? 0 : parsedHScore;
      const aScore = isNaN(parsedAScore) ? 0 : parsedAScore;
      
      goalsFor += isHome ? hScore : aScore;
      goalsAgainst += isHome ? aScore : hScore;

      if (hScore === aScore) {
        draws++;
        return 'D';
      }
      if (isHome) {
        if (hScore > aScore) { wins++; return 'W'; }
        else { losses++; return 'L'; }
      } else {
        if (aScore > hScore) { wins++; return 'W'; }
        else { losses++; return 'L'; }
      }
    });

    return { wins, draws, losses, goalsFor, goalsAgainst, recentResults, totalGames: games.length };
  };

  const getH2H = (t1: string, t2: string) => {
    const games = allGames.filter(g => {
      const h = normalizeTeamName(allTeams.find(t => t.id === g.home_team_id)?.name_en || g.home_team_name_en || '');
      const a = normalizeTeamName(allTeams.find(t => t.id === g.away_team_id)?.name_en || g.away_team_name_en || '');
      return ((h === t1 && a === t2) || (h === t2 && a === t1)) && g.finished === 'TRUE';
    });

    let t1Wins = 0;
    let t2Wins = 0;
    let draws = 0;

    games.forEach(g => {
      const h = normalizeTeamName(allTeams.find(t => t.id === g.home_team_id)?.name_en || g.home_team_name_en || '');
      const isT1Home = h === t1;
      const parsedHScore = parseInt(g.home_score || '0');
      const parsedAScore = parseInt(g.away_score || '0');
      const hScore = isNaN(parsedHScore) ? 0 : parsedHScore;
      const aScore = isNaN(parsedAScore) ? 0 : parsedAScore;
      
      if (hScore === aScore) draws++;
      else if (isT1Home) {
        if (hScore > aScore) t1Wins++;
        else t2Wins++;
      } else {
        if (aScore > hScore) t2Wins++;
        else t1Wins++;
      }
    });

    return { t1Wins, t2Wins, draws, total: games.length, games };
  };

  if (!initialTeam) return null;

  const t1Form = team1 ? getTeamForm(team1) : null;
  const t2Form = team2 ? getTeamForm(team2) : null;
  const h2h = (team1 && team2) ? getH2H(team1, team2) : null;

  const ResultIcon = ({ result }: { result: string }) => {
    if (result === 'W') return <div className="w-6 h-6 rounded flex items-center justify-center bg-green-500/20 text-green-500 border border-green-500/30 text-xs font-bold" title="Win"><TrendingUp size={12} /></div>;
    if (result === 'L') return <div className="w-6 h-6 rounded flex items-center justify-center bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold" title="Loss"><TrendingDown size={12} /></div>;
    return <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-500/20 text-slate-400 border border-slate-500/30 text-xs font-bold" title="Draw"><Minus size={12} /></div>;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#111] border border-[#d4af37]/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-black via-[#d4af37]/10 to-black p-4 border-b border-[#d4af37]/30 flex justify-between items-center relative">
            <h2 className="text-xl font-bold text-[#d4af37] font-mono flex items-center gap-2">
              <Swords size={20} /> Team Compare
            </h2>
            <button onClick={onClose} className="p-2 bg-black/50 hover:bg-[#d4af37]/20 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-[#d4af37]/50">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
            
            {/* Team Selectors */}
            <div className="flex flex-row gap-4 items-center mb-8 relative">
              <div className="flex-1 w-full flex flex-col items-center">
                {team1 ? (
                  <div className="text-center w-full bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-xl shadow-sm relative group">
                    <img src={`https://flagcdn.com/w160/${getCountryCode(team1)}.png`} alt={team1} className="w-20 h-20 object-contain mx-auto drop-shadow-xl mb-3" />
                    <h3 className="font-bold text-xl">{team1}</h3>
                    <select 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={team1}
                      onChange={(e) => setTeam1(e.target.value)}
                    >
                      {normalizedUniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-black/80 px-2 py-1 rounded text-[#d4af37] pointer-events-none">Change</div>
                  </div>
                ) : (
                  <select 
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 text-center focus:border-[#d4af37] outline-none"
                    value={team1 || ''}
                    onChange={(e) => setTeam1(e.target.value)}
                  >
                    <option value="" disabled>Select Team 1</option>
                    {normalizedUniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>

              <div className="text-[#d4af37] font-bold font-mono text-xl bg-black rounded-full w-10 h-10 flex items-center justify-center border border-[#d4af37]/30 shrink-0 z-10 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                VS
              </div>

              <div className="flex-1 w-full flex flex-col items-center">
                {team2 ? (
                  <div className="text-center w-full bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-xl shadow-sm relative group">
                    <img src={`https://flagcdn.com/w160/${getCountryCode(team2)}.png`} alt={team2} className="w-20 h-20 object-contain mx-auto drop-shadow-xl mb-3" />
                    <h3 className="font-bold text-xl">{team2}</h3>
                    <select 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={team2}
                      onChange={(e) => setTeam2(e.target.value)}
                    >
                      <option value="">Clear</option>
                      {normalizedUniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button 
                      className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 z-20"
                      onClick={(e) => { e.stopPropagation(); setTeam2(null); }}
                      title="Clear selection"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-black/80 px-2 py-1 rounded text-[#d4af37] pointer-events-none">Change</div>
                  </div>
                ) : (
                  <div className="w-full relative">
                    <select 
                      className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] border-dashed rounded-xl p-4 text-center text-slate-400 focus:border-[#d4af37] outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                      value=""
                      onChange={(e) => setTeam2(e.target.value)}
                    >
                      <option value="" disabled>Select opponent to compare...</option>
                      {normalizedUniqueTeams.filter(t => t !== team1).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col gap-6">
              
              {/* Head to Head (if both selected) */}
              {team1 && team2 && h2h && (
                <div className="bg-black/50 border border-[#d4af37]/20 rounded-xl p-6">
                  <h4 className="text-center font-bold text-[#d4af37] mb-6 flex items-center justify-center gap-2">
                    <Swords size={18} /> Head to Head
                  </h4>
                  
                  {h2h.total > 0 ? (
                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                      <div className="flex justify-between items-center text-sm font-mono mb-2">
                        <span className="font-bold">{team1} Wins: <span className="text-[#d4af37]">{h2h.t1Wins}</span></span>
                        <span className="text-slate-500">Draws: {h2h.draws}</span>
                        <span className="font-bold">{team2} Wins: <span className="text-[#d4af37]">{h2h.t2Wins}</span></span>
                      </div>
                      
                      {/* Bar chart representation */}
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(h2h.t1Wins / h2h.total) * 100}%` }} className="bg-blue-500"></div>
                        <div style={{ width: `${(h2h.draws / h2h.total) * 100}%` }} className="bg-slate-500"></div>
                        <div style={{ width: `${(h2h.t2Wins / h2h.total) * 100}%` }} className="bg-rose-500"></div>
                      </div>
                      <div className="text-center text-xs text-slate-500 mt-2">Based on {h2h.total} recent finished matches in database</div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-4 italic text-sm">
                      No recent finished matches between these two teams in the database.
                    </div>
                  )}
                </div>
              )}

              {/* Individual Form Side-by-Side */}
              <div className="grid grid-cols-2 gap-6">
                {team1 && t1Form && (
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-sm text-[var(--muted-text)] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Activity size={16} /> {team1} Form
                    </h4>
                    
                    <div className="flex justify-between mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-green-500">{t1Form.wins}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-slate-400">{t1Form.draws}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Draws</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-red-500">{t1Form.losses}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Losses</div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-[10px] text-slate-500 uppercase mb-2">Recent Results</div>
                      {t1Form.recentResults.length > 0 ? (
                        <div className="flex gap-2">
                          {t1Form.recentResults.map((r, i) => <ResultIcon key={i} result={r} />)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No finished matches found</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-[var(--border-color)] pt-4">
                      <div>
                        <span className="text-slate-500">Goals For:</span> <span className="font-mono font-bold">{t1Form.goalsFor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Goals Against:</span> <span className="font-mono font-bold">{t1Form.goalsAgainst}</span>
                      </div>
                    </div>
                  </div>
                )}

                {team2 && t2Form && (
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-sm text-[var(--muted-text)] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Activity size={16} /> {team2} Form
                    </h4>
                    
                    <div className="flex justify-between mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-green-500">{t2Form.wins}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-slate-400">{t2Form.draws}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Draws</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-red-500">{t2Form.losses}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Losses</div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-[10px] text-slate-500 uppercase mb-2">Recent Results</div>
                      {t2Form.recentResults.length > 0 ? (
                        <div className="flex gap-2">
                          {t2Form.recentResults.map((r, i) => <ResultIcon key={i} result={r} />)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No finished matches found</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-[var(--border-color)] pt-4">
                      <div>
                        <span className="text-slate-500">Goals For:</span> <span className="font-mono font-bold">{t2Form.goalsFor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Goals Against:</span> <span className="font-mono font-bold">{t2Form.goalsAgainst}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
