import express from 'express';
import path from 'path';
import axios from 'axios';
import Parser from 'rss-parser';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { eventEmitter, startPolling, setActiveEventIds, getActiveEventIds } from './src/services/espnPoller';

const firebaseConfig = {

  projectId: "loyal-spot-3hnbb",
  appId: "1:294602232165:web:d3c28f9fe86bbb9b63d18c",
  apiKey: "AIzaSyABmYlatNeWUWzD_8mOrujWKM1uhBlNCBc",
  authDomain: "loyal-spot-3hnbb.firebaseapp.com",
  storageBucket: "loyal-spot-3hnbb.firebasestorage.app",
  messagingSenderId: "294602232165"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, "ai-studio-predictor-87d6ef66-b316-40cb-a45d-66b8548ed60f");

export const app = express();
app.use(express.json());

const defaultSettings = {
  watchLiveEnabled: true,
  watchLiveUrl: "https://sam15x7.github.io/fifa/Cazetv(1).html",
  siteLogo: "https://i.ibb.co/k2dPbRyg/Picsart-26-06-28-20-19-42-827.png",
  siteFavicon: "https://i.ibb.co/k2dPbRyg/Picsart-26-06-28-20-19-42-827.png",
  donationUpiUrl: "https://upi.pe/adminchatterjee@fam/50.00?pn=admin+Chatterjee&tn=Wonderful+Website",
  donationBtc: "bc1q5v9z3w0u4a...4z3z",
  donationEth: "0x7a3B2...9c4E",
  donationSol: "7x2a...F91a",
  whatsappLink: "https://whatsapp.com/channel/0029VaEQJcJEVccLFGqfTo0w",
  newsMarqueeMessage: "Welcome to The Predictor. Follow live matches, predictions, and schedules.",
  welcomePopupEnabled: false,
  welcomePopupMessage: "Welcome to our site!",
  welcomePopupStartTime: "",
  welcomePopupEndTime: "",
  liveStreams: []
};

async function getSettings() {
  try {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error reading settings from Firestore", e);
  }
  return defaultSettings;
}

async function updateSettings(newSettings: any) {
  try {
    const current = await getSettings();
    const docRef = doc(db, 'config', 'settings');
    await setDoc(docRef, { ...current, ...newSettings }, { merge: true });
  } catch (e) {
    console.error("Error writing settings to Firestore", e);
  }
}

app.get('/api/settings', async (req, res) => {
  res.json(await getSettings());
});

app.post('/api/settings', async (req, res) => {
  const { username, password, settings } = req.body;
  if (username !== 'admin' || password !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await updateSettings(settings);
  res.json({ success: true });
});

const WC_COMPETITION_MARKERS = [
  'fifa world cup', 'world cup 2026', 'wc 2026', 'worldcup26', 'worldcup2026', '2026'
];

function isWCData(item: any) {
  if (!item) return false;
  const haystack = [
    item.competition, item.league, item.tournament, item.season, item.name
  ].filter(Boolean).join(' ').toLowerCase();
  
  if (!haystack) return true;
  return WC_COMPETITION_MARKERS.some(m => haystack.includes(m));
}

const wc26Cache = new Map<string, { data: any, expiry: number }>();

// [WC2026 ENHANCEMENT — Task 1]
app.get('/api/wc26/:endpoint', async (req, res) => {
  const endpoint = req.params.endpoint;
  if (!['games', 'groups', 'teams', 'stadiums'].includes(endpoint)) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const cacheKey = `/get/${endpoint}`;
    const cached = wc26Cache.get(cacheKey);
    
    let data;
    if (cached && Date.now() < cached.expiry) {
      data = cached.data;
    } else {
      const fallbackMapping: Record<string, string> = {
         'games': 'football.matches.json',
         'teams': 'football.teams.json',
         'groups': 'worldcup2026.groups.json',
         'stadiums': 'worldcup26.stadiums.json'
      };
      
      data = await fetchFromAPI(endpoint, fallbackMapping[endpoint] || 'football.matches.json');
      wc26Cache.set(cacheKey, { data, expiry: Date.now() + 60 * 1000 }); // 60s cache
    }

    let filteredData = data;
    if (Array.isArray(data)) {
       filteredData = data.filter(isWCData);
    } else if (data && data.data && Array.isArray(data.data)) {
       filteredData = { ...data, data: data.data.filter(isWCData) };
    } else if (!data) {
       return res.json({ data: null, fallback: true });
    }

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ data: filteredData, source: "The Predictor", cachedAt: new Date().toISOString(), ttl: 60 });
  } catch (e: any) {
    res.json({ data: null, error: true, fallback: true });
  }
});

// --- WC2026 Live API Integration ---
const WC26_API_BASE = 'https://worldcup26.ir/get';
const REPO_BASE = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';
const apiCache: Record<string, {data: any, time: number}> = {};

async function fetchFromAPI(endpoint: string, fallbackFile: string) {
  const now = Date.now();
  if (apiCache[endpoint] && now - apiCache[endpoint].time < 60000) {
    return apiCache[endpoint].data;
  }
  
  const url = `${WC26_API_BASE}/${endpoint}`;
  let attempt = 0;
  const maxAttempts = 1;
  let apiData = null;

  while (attempt < maxAttempts) {
    try {
      const res = await axios.get(url, { 
        timeout: 4000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      apiData = res.data;
      break; // Success
    } catch (e: any) {
      attempt++;
      if (attempt === maxAttempts) {
        console.log(`[Warn] API failed after ${maxAttempts} attempts for ${endpoint}:`, e.message);
      }
    }
  }

  if (apiData) {
    if (Array.isArray(apiData)) {
       apiData = { [endpoint]: apiData };
    }
    apiCache[endpoint] = { data: apiData, time: now };
    return apiData;
  }
  
  // Fallback to github repo if live API fails
  try {
      console.log("Attempting fallback for", endpoint, "via github repo", fallbackFile);
      const fallbackUrl = `${REPO_BASE}/${fallbackFile}`;
      const fallbackRes = await axios.get(fallbackUrl, { timeout: 10000 });
      let fallbackData = fallbackRes.data;
      if (Array.isArray(fallbackData)) {
         fallbackData = { [endpoint]: fallbackData };
      }
      apiCache[endpoint] = { data: fallbackData, time: now }; // Cache fallback data
      return fallbackData;
    } catch (fallbackErr: any) {
       console.log(`[Error] Github fallback also failed for ${endpoint}:`, fallbackErr.message);
    }
    return null;
}


app.get('/api/live-scores', async (req, res) => {
  try {
    const gamesData = await fetchFromAPI('games', 'football.matches.json');
    const teamsData = await fetchFromAPI('teams', 'football.teams.json');
    if (!gamesData || !teamsData) return res.json({ response: [] });

    const matches = gamesData.games || [];
    const teams = teamsData.teams || [];

    // Matches that have started but aren't finished
    const liveMatches = matches.filter((m: any) => m.finished === "FALSE" && m.time_elapsed !== "notstarted");
    
    // If no actual live matches are ongoing right now, just return an empty array 
    // or maybe fallback if we want to preview
    const response = liveMatches.map((m: any) => {
       const home = teams.find((t: any) => t.id === m.home_team_id);
       const away = teams.find((t: any) => t.id === m.away_team_id);
       return {
         fixture: { status: { elapsed: m.time_elapsed, short: m.time_elapsed } },
         league: { id: 1, name: "FIFA World Cup" },
         teams: { home: { name: home?.name_en || m.home_team_id }, away: { name: away?.name_en || m.away_team_id } },
         goals: { home: parseInt(m.home_score || 0), away: parseInt(m.away_score || 0) }
       }
    });

    res.json({ response });
  } catch (e) {
    console.log(e);
    res.json({ response: [] });
  }
});

app.get('/api/upcoming', async (req, res) => {
  try {
    const gamesData = await fetchFromAPI('games', 'football.matches.json');
    const teamsData = await fetchFromAPI('teams', 'football.teams.json');
    if (!gamesData || !teamsData) return res.json({ response: [] });
    
    const matches = gamesData.games || [];
    const teams = teamsData.teams || [];
    
    const upcoming = matches.filter((m: any) => m.time_elapsed === "notstarted");
    
    const response = upcoming.map((m: any) => {
       const home = teams.find((t: any) => t.id === m.home_team_id);
       const away = teams.find((t: any) => t.id === m.away_team_id);
       
       let dateIso = new Date().toISOString();
       try {
          if (m.local_date) {
            const [dt, tm] = m.local_date.split(' ');
            const [mo, da, ye] = dt.split('/');
            dateIso = new Date(`${ye}-${mo}-${da}T${tm}:00Z`).toISOString();
          }
       } catch(e) {}
       
       return {
         fixture: { date: dateIso, status: { short: "NS" } },
         teams: { 
            home: { name: home?.name_en || m.home_team_id, logo: home?.flag }, 
            away: { name: away?.name_en || m.away_team_id, logo: away?.flag } 
         },
         goals: { home: null, away: null }
       };
    });
    
    res.json({ response });
  } catch (e) {
    console.log(e);
    res.json({ response: [] });
  }
});

app.get('/api/player', async (req, res) => {
  // Mock player search from squads if needed, wait there's no player data in the repo.
  // We'll return empty as worldcup2026 repo doesn't serve players yet.
  res.json({ response: [] });
});

app.get('/api/news', async (req, res) => {
  try {
    const parser = new Parser();
    const query = encodeURIComponent('("FIFA World Cup 2026" OR "FFWC2026" OR site:fifa.com OR site:footem.in)');
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    
    let xmlData = '';
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/xml, application/xml, application/rss+xml'
        },
        timeout: 8000
      });
      xmlData = response.data;
    } catch (fetchErr: any) {
      console.log("Direct fetch failed, falling back to proxy...", fetchErr.message);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyResponse = await axios.get(proxyUrl, { timeout: 10000 });
      xmlData = proxyResponse.data;
    }
    
    const feed = await parser.parseString(xmlData);
    
    const sortedItems = feed.items.sort((a, b) => {
      const dA = new Date(a.pubDate || 0).getTime();
      const dB = new Date(b.pubDate || 0).getTime();
      return dB - dA;
    });

    const news = sortedItems.slice(0, 50).map((item, index) => ({
      id: index + 1,
      source: item.source || "Google News",
      title: item.title,
      time: item.pubDate,
      url: item.link
    }));
    res.json(news);
  } catch(err) {
    console.log("RSS Processing Error:", err);
    res.json([]);
  }
});

app.get('/api/standings', async (req, res) => {
  try {
    const groupsData = await fetchFromAPI('groups', 'worldcup2026.groups.json');
    const teamsData = await fetchFromAPI('teams', 'football.teams.json');
    if (!groupsData || !teamsData) return res.json({ response: [] });
    
    const groups = groupsData.groups || [];
    const teams = teamsData.teams || [];
    
    const standingsList = groups.map((g: any) => {
       return g.teams.map((t: any, index: number) => {
           const teamInfo = teams.find((tm: any) => tm.id === t.team_id || tm.id === t._id?.$oid || tm.id === String(t.team_id));
           // API repo uses "team_id": "1" etc.
           
           return {
               rank: index + 1,
               team: { id: t.team_id, name: teamInfo?.name_en || "Team " + t.team_id, logo: teamInfo?.flag || `https://flagcdn.com/w40/${teamInfo?.iso2?.toLowerCase() || 'xx'}.png` },
               all: {
                   played: parseInt(t.mp || 0),
                   win: parseInt(t.w || 0),
                   draw: parseInt(t.d || 0),
                   lose: parseInt(t.l || 0),
                   goals: { "for": parseInt(t.gf || 0), "against": parseInt(t.ga || 0) }
               },
               goalsDiff: parseInt(t.gd || 0),
               points: parseInt(t.pts || 0),
               group: `Group ${g.name}`
           }
       });
    });

    res.json({ response: [ { league: { standings: standingsList } } ] });
  } catch(err) {
    console.log(err);
    res.json({ response: [] });
  }
});

app.get('/api/h2h', (req, res) => {
  res.json({
    matches: []
  });
});

// Notifications Polling
startPolling();

app.post('/api/notifications/track', (req, res) => {
  const { eventIds } = req.body;
  if (!Array.isArray(eventIds)) {
    return res.status(400).json({ error: 'eventIds must be an array' });
  }
  setActiveEventIds(eventIds.slice(0, 3));
  res.json({ success: true, activeEventIds: getActiveEventIds() });
});

app.get('/api/notifications/active', (req, res) => {
  res.json({ activeEventIds: getActiveEventIds() });
});

app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const listener = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventEmitter.on('matchEvent', listener);

  req.on('close', () => {
    eventEmitter.off('matchEvent', listener);
  });
});

if (process.env.VERCEL !== '1') {
  async function startServer() {
    const PORT = 3000;
  
    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  startServer();
}

export default app;
