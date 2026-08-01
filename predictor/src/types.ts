export enum MatchStatus {
  SCHEDULED = 0,
  LIVE = 1,
  FINISHED = 2
}

export interface WC26Game {
  _id?: any;
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string | null;
  away_scorers: string | null;
  group: string;
  matchday: string;
  local_date: string;
  persian_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string; // 'notstarted', 'finished', etc.
  type: string;
  home_team_label?: string;
  away_team_label?: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
}

export interface WC26Team {
  _id?: any;
  id: string;
  name_en: string;
  name_fa?: string;
  flag?: string;
  fifa_code?: string;
  iso2?: string;
  groups?: string;
}

export interface AppMatch {
  id: number | string;
  stage: string;
  group?: string;
  home: string;
  away: string;
  venue: string;
  city: string;
  utc: string;
  status: MatchStatus;
  score?: string;
  elapsed?: string;
  homeScore?: number;
  awayScore?: number;
  dataSource: 'static' | 'live';
  isTentative?: boolean;
}
