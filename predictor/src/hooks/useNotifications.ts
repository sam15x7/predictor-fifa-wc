import { useState, useEffect } from 'react';
import { AppMatch } from '../types';

export function useNotifications() {
  const [notifiedMatches, setNotifiedMatches] = useState<(string | number)[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('wc_notified_matches');
    if (saved) {
      try {
        setNotifiedMatches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveMatches = (matches: (string | number)[]) => {
    setNotifiedMatches(matches);
    localStorage.setItem('wc_notified_matches', JSON.stringify(matches));
  };

  const toggleNotification = (matchId: string | number) => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          if (notifiedMatches.includes(matchId)) {
            saveMatches(notifiedMatches.filter(id => id !== matchId));
          } else {
            saveMatches([...notifiedMatches, matchId]);
          }
        } else {
          alert('Please enable notifications in your browser settings.');
        }
      });
    } else {
      alert('Your browser does not support notifications.');
    }
  };

  return { notifiedMatches, toggleNotification };
}
