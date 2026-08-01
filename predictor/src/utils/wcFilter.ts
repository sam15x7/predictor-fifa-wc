// [WC2026 ENHANCEMENT — Task 1]
const WC_COMPETITION_MARKERS = [
  'fifa world cup', 'world cup 2026', 'wc 2026', 'worldcup26', 'worldcup2026'
];

export function isWCMatch(match: any) {
  if (!match.competition && !match.league && !match.tournament && !match.season) return true;
  const haystack = [
    match.competition, match.league, match.tournament, match.season
  ].filter(Boolean).join(' ').toLowerCase();
  
  if (!haystack) return true;
  return WC_COMPETITION_MARKERS.some(m => haystack.includes(m));
}
