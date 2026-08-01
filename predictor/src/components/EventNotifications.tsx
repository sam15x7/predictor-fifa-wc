import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Goal, Square, Watch } from 'lucide-react';
import { format } from 'date-fns';

export interface ParsedEvent {
  id: string;
  timestamp: string;
  playerName: string;
  eventType: string;
  teamLogo: string;
  teamName: string;
  text: string;
  matchId: string;
}

export default function EventNotifications() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.onmessage = (e) => {
      try {
        const newEvent: ParsedEvent = JSON.parse(e.data);
        setEvents(prev => {
          // Prevent duplicates
          if (prev.some(evt => evt.id === newEvent.id)) return prev;
          
          const updated = [newEvent, ...prev];
          return updated.slice(0, 5); // Keep last 5 events
        });
      } catch (err) {
        console.error("Failed to parse event", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GOAL': return <div className="text-white bg-green-500 rounded-full p-1"><Goal size={16} /></div>;
      case 'YELLOW_CARD': return <div className="text-yellow-500"><Square fill="currentColor" size={18} /></div>;
      case 'RED_CARD': return <div className="text-red-500"><Square fill="currentColor" size={18} /></div>;
      case 'KICKOFF': return <div className="text-blue-400"><Watch size={18} /></div>;
      case 'HALF_TIME':
      case 'FULL_TIME': return <div className="text-slate-400"><Watch size={18} /></div>;
      default: return <Bell size={18} className="text-[#d4af37]" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'GOAL': return 'border-green-500/50 bg-green-950/20';
      case 'YELLOW_CARD': return 'border-yellow-500/50 bg-yellow-950/20';
      case 'RED_CARD': return 'border-red-500/50 bg-red-950/20';
      default: return 'border-[#d4af37]/30 bg-black/80';
    }
  };

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
      <AnimatePresence>
        {events.map((evt) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl border backdrop-blur-md shadow-2xl ${getEventColor(evt.eventType)}`}
          >
            {evt.teamLogo ? (
              <img src={evt.teamLogo} alt={evt.teamName} className="w-10 h-10 object-contain drop-shadow-md rounded-full bg-white/5 p-1" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 shrink-0">
                <Bell size={20} className="text-[#d4af37]" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getEventIcon(evt.eventType)}
                  <span className="font-bold text-sm tracking-wide">{evt.eventType.replace('_', ' ')}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {format(new Date(evt.timestamp), 'HH:mm')}
                </span>
              </div>
              
              <div className="text-sm font-semibold truncate mb-0.5">
                {evt.playerName || evt.teamName || 'Match Event'}
              </div>
              <div className="text-xs text-slate-300 line-clamp-2">
                {evt.text}
              </div>
            </div>
            
            <button 
              onClick={() => setEvents(prev => prev.filter(e => e.id !== evt.id))}
              className="absolute top-2 right-2 text-slate-500 hover:text-white"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
