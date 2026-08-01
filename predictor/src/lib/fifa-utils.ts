export function getCountryCode(team: string): string {
  const codes: Record<string, string> = {
    "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czechia": "cz",
    "Canada": "ca", "Bosnia and Herzegovina": "ba", "USA": "us", "Paraguay": "py",
    "Qatar": "qa", "Switzerland": "ch", "Brazil": "br", "Morocco": "ma",
    "Haiti": "ht", "Scotland": "gb-sct", "Australia": "au", "Turkey": "tr",
    "Germany": "de", "Curaçao": "cw", "Netherlands": "nl", "Japan": "jp",
    "Ivory Coast": "ci", "Ecuador": "ec", "Sweden": "se", "Tunisia": "tn",
    "Spain": "es", "Cape Verde": "cv", "Belgium": "be", "Egypt": "eg",
    "Saudi Arabia": "sa", "Uruguay": "uy", "Iran": "ir", "New Zealand": "nz",
    "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
    "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
    "Portugal": "pt", "DR Congo": "cd", "England": "gb-eng", "Croatia": "hr",
    "Ghana": "gh", "Panama": "pa", "Uzbekistan": "uz", "Colombia": "co"
  };
  return codes[team] || "un";
}

export function getTeamStrength(team: string): number {
  const strengths: Record<string, number> = {
    "Argentina": 95, "France": 94, "Brazil": 93, "England": 92, "Belgium": 90,
    "Spain": 89, "Portugal": 89, "Netherlands": 88, "Germany": 87, "Uruguay": 86,
    "Croatia": 85, "Colombia": 84, "Senegal": 83, "Japan": 82, "Morocco": 83,
    "USA": 81, "Mexico": 81, "Switzerland": 81, "Ecuador": 79, "Sweden": 79,
    "Iran": 78, "South Korea": 78, "Austria": 78, "Algeria": 77, "Tunisia": 77,
    "Turkey": 76, "Czechia": 76, "Egypt": 75, "Norway": 75, "Australia": 74,
    "Canada": 74, "Panama": 73, "Saudi Arabia": 73, "Qatar": 72, "Iraq": 72,
    "South Africa": 71, "Uzbekistan": 70, "Jordan": 69, "Bosnia and Herzegovina": 69,
    "New Zealand": 68, "Paraguay": 68, "Haiti": 65, "Curaçao": 65, "Cape Verde": 65,
    "DR Congo": 64, "Ghana": 75, "Scotland": 76
  };
  return strengths[team] || 70;
}

export function getTeamTier(strength: number) {
  if (strength >= 90) return 'ELITE';
  if (strength >= 83) return 'STRONG';
  if (strength >= 75) return 'COMPETITIVE';
  return 'UNDERDOG';
}

export function calculateWinProbability(home: string, away: string) {
  const sH = getTeamStrength(home);
  const sA = getTeamStrength(away);
  const diff = sH - sA;
  
  // Base win probabilities
  let homeProb = Math.max(10, Math.min(90, 40 + diff * 1.5));
  let awayProb = Math.max(10, Math.min(90, 35 - diff * 1.5));
  let drawProb = Math.max(5, 100 - homeProb - awayProb);

  // Normalize to 100
  const total = homeProb + awayProb + drawProb;
  return {
    home: Math.round((homeProb / total) * 100),
    draw: Math.round((drawProb / total) * 100),
    away: Math.round((awayProb / total) * 100)
  };
}

export function generateICS(match: any) {
  const startDate = new Date(match.utc);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FIFA World Cup 2026//EN',
    'BEGIN:VEVENT',
    `UID:${match.id}@fifa2026.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:⚽ ${match.home} vs ${match.away}`,
    `LOCATION:${match.venue}, ${match.city}`,
    `DESCRIPTION:FIFA World Cup 2026 - ${match.stage} Match`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `match-${match.home}-vs-${match.away}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
