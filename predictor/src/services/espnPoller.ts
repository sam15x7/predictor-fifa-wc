import axios from 'axios';
import { EventEmitter } from 'events';

export const eventEmitter = new EventEmitter();

let activeEventIds: string[] = [];
const seenEvents = new Map<string, Set<string>>();

const POLL_INTERVAL = 10000;

export function setActiveEventIds(ids: string[]) {
  activeEventIds = ids.slice(0, 3);
}

export function getActiveEventIds() {
  return activeEventIds;
}

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

async function fetchMatchEvents(eventId: string) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${eventId}`;
    const res = await axios.get(url, { timeout: 8000 });
    const data = res.data;
    
    if (!data || !data.keyEvents || !data.header) return;

    const competitors = data.header.competitions?.[0]?.competitors || [];
    const teamLogos: Record<string, string> = {};
    for (const c of competitors) {
      if (c.team && c.team.id) {
        teamLogos[c.team.id] = c.team.logos?.[0]?.href || '';
      }
    }

    if (!seenEvents.has(eventId)) {
      seenEvents.set(eventId, new Set());
    }
    const seen = seenEvents.get(eventId)!;

    for (const event of data.keyEvents) {
      if (!seen.has(event.id)) {
        seen.add(event.id);
        
        let playerName = '';
        if (event.participants && event.participants.length > 0) {
           playerName = event.participants[0].athlete?.displayName || '';
        } else if (event.shortText) {
           playerName = event.shortText.split(' ')[0];
        }

        const teamId = event.team?.id;
        const teamLogo = teamId ? teamLogos[teamId] : '';
        const teamName = event.team?.displayName || '';
        
        let eventType = event.type?.text || 'Unknown';
        if (eventType.includes('Goal')) eventType = 'GOAL';
        else if (eventType.includes('Yellow Card')) eventType = 'YELLOW_CARD';
        else if (eventType.includes('Red Card')) eventType = 'RED_CARD';
        else if (eventType.includes('Half')) eventType = 'HALF_TIME';
        else if (eventType.includes('Kickoff')) eventType = 'KICKOFF';
        else if (eventType.includes('End Regular Time')) eventType = 'FULL_TIME';
        
        const parsed: ParsedEvent = {
          id: event.id,
          matchId: eventId,
          timestamp: event.clock?.displayValue || event.wallclock || new Date().toISOString(),
          playerName,
          eventType,
          teamLogo,
          teamName,
          text: event.text || event.shortText
        };
        
        eventEmitter.emit('matchEvent', parsed);
      }
    }
  } catch (err: any) {
    console.error(`Error polling event ${eventId}: ${err.message}`);
  }
}

function pollEvents() {
  for (const id of activeEventIds) {
    fetchMatchEvents(id);
  }
}

let pollerInterval: any = null;

export function startPolling() {
  if (pollerInterval) clearInterval(pollerInterval);
  pollerInterval = setInterval(pollEvents, POLL_INTERVAL);
  // Also poll immediately
  pollEvents();
}
