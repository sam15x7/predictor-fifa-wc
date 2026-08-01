import React from 'react';
import { useSettings } from '../SettingsContext';
import { ArrowLeft, Play, Tag, ExternalLink } from 'lucide-react';

export default function LiveStreamsPage({ onBack }: { onBack: () => void }) {
  const { settings } = useSettings();
  const streams = settings.liveStreams || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 transition-colors duration-300 fade-in">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#d4af37] hover:text-[#b0902c] transition-colors mb-8 font-mono"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-[#d4af37] mb-2 uppercase tracking-wider font-mono">Live Streams</h1>
        <p className="text-gray-400 mb-8 font-mono">Select a stream to watch live matches</p>

        {streams.length === 0 ? (
          <div className="bg-[#111] border border-[#d4af37]/20 rounded-xl p-8 text-center text-gray-400 font-mono">
            No live streams are currently available. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {streams.map(stream => (
              <a
                key={stream.id}
                href={stream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-[#111] hover:bg-[#1a1a1a] border border-[#d4af37]/30 hover:border-[#d4af37] transition-all rounded-2xl p-6 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Play size={64} className="text-[#d4af37]" />
                </div>
                
                <h3 className="text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors mb-4 relative z-10">
                  {stream.name || 'Live Stream'}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                  {stream.tags && stream.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs font-mono bg-[#d4af37]/10 text-[#d4af37] px-2 py-1 rounded-md border border-[#d4af37]/20">
                      <Tag size={12} /> {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between text-sm font-mono text-[#a1a1aa] group-hover:text-white transition-colors relative z-10">
                  <span>Watch Now</span>
                  <ExternalLink size={16} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
