import { MatchStatus, WC26Game, WC26Team, AppMatch } from '../types';
import { fromZonedTime } from 'date-fns-tz';

let cachedTeams: WC26Team[] = [];

const stadiumTimezones: Record<string, string> = {
  "1": "America/Mexico_City",
  "2": "America/Mexico_City",
  "3": "America/Monterrey",
  "4": "America/Chicago",
  "5": "America/Chicago",
  "6": "America/Chicago",
  "7": "America/New_York",
  "8": "America/New_York",
  "9": "America/New_York",
  "10": "America/New_York",
  "11": "America/New_York",
  "12": "America/Toronto",
  "13": "America/Vancouver",
  "14": "America/Los_Angeles",
  "15": "America/Los_Angeles",
  "16": "America/Los_Angeles"
};

export async function getTeams(): Promise<WC26Team[]> {
  if (cachedTeams.length) return cachedTeams;
  try {
    const res = await fetch('/api/wc26/teams');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json.data && json.data.teams) {
      cachedTeams = json.data.teams;
      return cachedTeams;
    }
  } catch (e) {
    console.error('Failed to fetch teams', e);
  }
  return [];
}

export async function getGroups(): Promise<any[]> {
  try {
    const res = await fetch('/api/wc26/groups');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data?.groups || [];
  } catch (e) {
    console.error('Failed to fetch groups', e);
    return [];
  }
}

export async function getStandings(): Promise<any[]> {
  try {
    const res = await fetch('/api/standings');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json && json.response && json.response.length > 0) {
      return json.response[0].league.standings || [];
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch standings', e);
    return [];
  }
}

export async function getStadiums(): Promise<any[]> {
  try {
    const res = await fetch('/api/wc26/stadiums');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data?.stadiums || [];
  } catch (e) {
    console.error('Failed to fetch stadiums', e);
    return [];
  }
}

export async function getGames(): Promise<WC26Game[]> {
  try {
    const res = await fetch('/api/wc26/games');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data?.games || [];
  } catch (e) {
    console.error('Failed to fetch games', e);
    return [];
  }
}

export async function getLiveMatches(): Promise<WC26Game[]> {
  const games = await getGames();
  return games.filter(g => g.finished === 'FALSE' && g.time_elapsed !== 'notstarted');
}

function normalizeTeamName(name: string): string {
  if (!name) return name;
  const n = name.trim();
  if (n === 'United States') return 'USA';
  if (n === 'Czech Republic') return 'Czechia';
  if (n === 'Democratic Republic of the Congo') return 'DR Congo';
  return n;
}

export function mapWC26MatchToAppMatch(wcMatch: WC26Game, teams: WC26Team[]): Partial<AppMatch> {
  let homeName = '';
  let awayName = '';
  let isTentative = false;

  if (wcMatch.home_team_id === '0' || wcMatch.away_team_id === '0') {
    isTentative = true;
    homeName = wcMatch.home_team_label || 'TBD';
    awayName = wcMatch.away_team_label || 'TBD';
  } else {
    // If we have actual team IDs, try to find them
    const home = teams.find(t => t.id === wcMatch.home_team_id);
    const away = teams.find(t => t.id === wcMatch.away_team_id);
    homeName = normalizeTeamName(home?.name_en || wcMatch.home_team_name_en || hcMatchFallback(wcMatch.home_team_id));
    awayName = normalizeTeamName(away?.name_en || wcMatch.away_team_name_en || hcMatchFallback(wcMatch.away_team_id));
    
    // If the labels suggest it was a placeholder but now has a real team, or if the stage is knockout but it has label, maybe it's semi-tentative, 
    // but we can trust it's not tentative if it has a real team ID.
  }

  let status = MatchStatus.SCHEDULED;
  if (wcMatch.finished === 'TRUE' || wcMatch.time_elapsed === 'finished' || wcMatch.time_elapsed === 'FT' || wcMatch.time_elapsed === 'AET' || wcMatch.time_elapsed === 'PENS') {
    status = MatchStatus.FINISHED;
  } else if (wcMatch.time_elapsed !== 'notstarted') {
    status = MatchStatus.LIVE;
  }

  let dt = new Date();
  if (wcMatch.local_date) {
    try {
      const [datePart, timePart] = wcMatch.local_date.split(' ');
      const [month, day, year] = datePart.split('/');
      const localString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}:00`;
      const tz = stadiumTimezones[wcMatch.stadium_id] || "America/New_York";
      dt = fromZonedTime(localString, tz);
    } catch (e) {
      console.error('Failed to parse local_date', e);
    }
  }

  const parsedHomeScore = parseInt(wcMatch.home_score || '0');
  const parsedAwayScore = parseInt(wcMatch.away_score || '0');

  return {
    id: parseInt(wcMatch.id) || wcMatch.id as any,
    home: homeName,
    away: awayName,
    score: `${wcMatch.home_score || 0} - ${wcMatch.away_score || 0}`,
    homeScore: isNaN(parsedHomeScore) ? undefined : parsedHomeScore,
    awayScore: isNaN(parsedAwayScore) ? undefined : parsedAwayScore,
    status,
    elapsed: wcMatch.time_elapsed,
    group: wcMatch.group,
    utc: dt.toISOString(),
    isTentative
  };
}

function hcMatchFallback(id: string) {
    return 'Team ' + id;
}
