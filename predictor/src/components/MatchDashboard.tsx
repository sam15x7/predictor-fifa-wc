import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MatchDashboard() {
  const [standings, setStandings] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');

  React.useEffect(() => {
    axios.get('/api/standings').then(res => {
      if (res.data && res.data.response && res.data.response.length > 0) {
        setStandings(res.data.response[0].league.standings);
      }
    }).catch(console.error);
  }, []);

  const chartData = useMemo(() => {
    if (!standings || standings.length === 0) return [];
    const group = standings.find((g: any) => g[0] && g[0].group === `Group ${selectedGroup}`);
    if (!group) return [];
    
    return group.map((teamRow: any) => ({
      name: teamRow.team.name,
      Win: teamRow.all.win,
      Draw: teamRow.all.draw,
      Loss: teamRow.all.lose,
    }));
  }, [standings, selectedGroup]);

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-lg fade-in">
        <div className="text-sm font-bold font-mono uppercase tracking-widest mb-6 border-b border-[var(--border-color)] pb-3 flex justify-between items-center text-[#d4af37]">
          <span>Performance Distribution</span>
          {standings.length > 0 && (
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-[var(--bg-color)] border border-[var(--border-color)] text-sm rounded px-2 py-1 text-[var(--text-color)] focus:outline-none focus:border-[#d4af37]"
            >
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, standings.length).map(letter => (
                <option key={letter} value={letter}>Group {letter}</option>
              ))}
            </select>
          )}
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="Win" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Draw" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Loss" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--muted-text)] font-mono text-sm">
            Waiting for standing data...
          </div>
        )}
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-lg fade-in">
        <div className="text-sm font-bold font-mono uppercase tracking-widest mb-6 border-b border-[var(--border-color)] pb-3 flex justify-between items-center text-[#d4af37]">
          <span>FIFA World Cup 2026 — Team Standings</span>
        </div>

          {!standings || standings.length === 0 ? (
             <div className="text-center py-12 text-[var(--muted-text)] font-mono text-sm">
               Standings not available yet.
             </div>
          ) : (
            <div className="space-y-8">
              {standings.map((group: any, idx: number) => (
                <div key={idx} className="overflow-x-auto">
                  <div className="text-xs font-bold font-mono uppercase text-slate-400 mb-3">{group[0].group}</div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--bg-color)] text-[var(--muted-text)] font-mono text-[10px] uppercase">
                      <tr>
                        <th className="px-4 py-2 rounded-l-lg">Team</th>
                        <th className="px-4 py-2 text-center">MP</th>
                        <th className="px-4 py-2 text-center">W</th>
                        <th className="px-4 py-2 text-center">D</th>
                        <th className="px-4 py-2 text-center">L</th>
                        <th className="px-4 py-2 text-center">GF</th>
                        <th className="px-4 py-2 text-center">GA</th>
                        <th className="px-4 py-2 text-center">GD</th>
                        <th className="px-4 py-2 text-center font-bold rounded-r-lg">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((teamRow: any) => (
                        <tr key={teamRow.team.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-color)]/50 transition-colors">
                          <td className="px-4 py-3 flex items-center gap-3">
                            <span className="text-[10px] text-[var(--muted-text)] font-mono w-4">{teamRow.rank}</span>
                            <img src={teamRow.team.logo} alt={teamRow.team.name} className="w-5 h-5 object-contain" />
                            <span className="font-semibold">{teamRow.team.name}</span>
                          </td>
                          <td className="px-4 py-3 text-center">{teamRow.all.played}</td>
                          <td className="px-4 py-3 text-center">{teamRow.all.win}</td>
                          <td className="px-4 py-3 text-center">{teamRow.all.draw}</td>
                          <td className="px-4 py-3 text-center">{teamRow.all.lose}</td>
                          <td className="px-4 py-3 text-center">{teamRow.all.goals.for}</td>
                          <td className="px-4 py-3 text-center">{teamRow.all.goals.against}</td>
                          <td className="px-4 py-3 text-center">{teamRow.goalsDiff}</td>
                          <td className="px-4 py-3 text-center font-bold text-[#d4af37]">{teamRow.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
