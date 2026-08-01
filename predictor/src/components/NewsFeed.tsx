import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NewsFeed() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/news').then(res => {
      setNews(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const formatTime = (timeStr: string) => {
    try {
      if (!timeStr) return '';
      return formatDistanceToNow(new Date(timeStr), { addSuffix: true });
    } catch(e) {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 h-24"></div>
        ))}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-text)] font-mono text-sm border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)]">
        News not available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 fade-in">
      {news.map((item) => (
        <a 
          key={item.id} 
          href={item.url} 
          target="_blank" 
          rel="noreferrer"
          className="group flex flex-col p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl hover:border-[#d4af37]/50 transition-all hover:bg-[var(--accent-bg)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} className="text-[#d4af37]" />
            <span className="text-xs font-mono font-bold uppercase text-[#d4af37] tracking-wider flex-1">
              {item.source}
            </span>
            <span className="text-[10px] font-mono text-[var(--muted-text)]">
              {formatTime(item.time)}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--text-color)] group-hover:text-[#d4af37] transition-colors line-clamp-2">
            {item.title}
          </h3>
          <div className="mt-auto pt-3 flex justify-end">
            <div className="text-xs font-mono text-[var(--muted-text)] flex items-center gap-1 group-hover:text-[#d4af37] transition-colors">
              Read more <ExternalLink size={12} />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
