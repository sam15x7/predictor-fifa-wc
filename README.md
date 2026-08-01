
# 🏆 The Predictor — FIFA World Cup 2026 Dashboard

An all-in-one, full-stack interactive football dashboard and prediction suite for the **FIFA World Cup 2026** (hosted across the USA, Canada, and Mexico). Built using **React 19**, **TypeScript**, **Tailwind CSS v4**, **Node.js/Express**, and **Firebase Firestore**, this application offers live score updates, dynamic bracket generation, match predictions, stadium weather metrics, calendar exports, and real-time push notifications.

---

## 🌟 Key Features

### ⚽ Live Matches & Match Center
- **Dynamic Score Integration:** Real-time live score updates, elapsed match times, and score alerts synced with external sports APIs.
- **Urgent Kickoff Banners:** Sticky top-bar countdown timers with multi-stage urgency states (`SOON`, `TODAY`, `LIVE`, `FT`).
- **Interactive Match Cards:** 3D motion-tilt match cards featuring flag icons, venue details, and live goal pulse animations.
- **Match Popup Overlay:** Detailed match modal featuring team statistics, win probability models, weather at the host stadium, and streaming action triggers.

### 🌳 Dynamic 48-Team Knockout Bracket
- **Full Tournament Bracket:** Rendered grid spanning Round of 32, Round of 16, Quarterfinals, Semifinals, 3rd Place Playoff, and the Final.
- **Automatic Match Resolution:** Dynamically advances winning and losing teams through placeholder labels (e.g., `W Match 74` or `Runner-up Group A`) as group stage matches conclude.
- **One-Click Image Export:** Export the entire high-resolution bracket view directly to a `.png` image using `html-to-image`.

### 📊 Analytics, Standings & Predictions
- **Team Strength Index (TSI):** Algorithmic team strength ratings and tier classification (`ELITE`, `STRONG`, `COMPETITIVE`, `UNDERDOG`).
- **Win Probability Model:** Mathematical probability calculator assessing Home Win, Draw, and Away Win likelihoods for every match.
- **Head-to-Head (H2H) Comparison:** Interactive side-by-side team comparison tool evaluating historical form, wins, goals scored, and goals conceded.
- **Recharts Data Visualization:** Visual bar chart distribution of Group Stage performances (Wins, Draws, Losses) alongside full standings tables.

### 🏟️ Host Stadiums & Real-Time Weather
- **Comprehensive Stadium Directory:** Metadata for all 16 host venues across North America (MetLife Stadium, Estadio Azteca, BC Place, SoFi Stadium, etc.).
- **Live Open-Meteo Weather API Integration:** Automatically fetches current temperature and atmospheric condition codes for each stadium location.
- **Local Timezone Conversion:** Live local clock for every host city based on exact geographical timezones.

### 🔔 Real-Time Notifications & Calendar Sync
- **Server-Sent Events (SSE) Live Poller:** Express-backed ESPN API polling server pushing live match events (Kickoffs, Goals, Yellow/Red Cards, Half-Time/Full-Time) straight to connected clients.
- **Desktop Browser Notifications:** Web Notification API integration alerting users 15 minutes before selected kickoffs.
- **Calendar Exports:** One-click `.ics` calendar file generation for individual matches.
- **Custom PDF Timetable Generator:** PDF match schedule exporter powered by `jsPDF`, complete with team flags, localized timezones, and stage headers.

### ⚙️ Admin Portal & Control Panel
- **Protected Admin Route:** Secure authentication portal located at `/admin`.
- **Live Stream Directory Management:** Add, tag, and modify live stream video links dynamically.
- **Branding & Announcement Control:** Custom rich-text scrolling marquee tickers, welcome popup modals, custom site logos, and favicons.
- **Firebase Firestore Persistence:** Instant synchronization of site configuration settings with Firestore.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework:** React 19 with Vite 6
- **Language:** TypeScript 5.8
- **Styling:** Tailwind CSS v4, CSS Variables, Glassmorphism
- **Animations:** Framer Motion 12
- **Icons:** Lucide React
- **Charts & Export:** Recharts 3, jsPDF, html-to-image, html2canvas
- **Date Handling:** `date-fns`, `date-fns-tz`

### **Backend & APIs**
- **Runtime:** Node.js (ESModules) with Express 4
- **Database:** Firebase Firestore (Admin SDK & Client SDK)
- **Real-time Engine:** Express Server-Sent Events (SSE) + Node `EventEmitter`
- **External Data Pipelines:**
  - `worldcup26.ir` API / GitHub Data Mirror (Fixtures, Teams, Groups, Standings)
  - Google News RSS Parser (Live World Cup News)
  - Open-Meteo API (Live Stadium Weather)
  - ESPN Summary API (Live Event Tracking)

---

## 📁 Repository Directory Structure

```text
.
├── api/
│   └── [...path].ts           # Serverless route handler for production deployments
├── src/
│   ├── components/            # React UI Components
│   │   ├── AdminPortal.tsx            # Protected admin management dashboard
│   │   ├── EventNotifications.tsx     # SSE real-time event toast overlay
│   │   ├── ErrorBoundary.tsx          # Component error catcher
│   │   ├── KnockoutBracket.tsx        # Interactive tournament bracket
│   │   ├── LiveScore.tsx              # Live match header & upcoming countdown
│   │   ├── LiveStreamsPage.tsx        # Video stream hub
│   │   ├── MatchCard.tsx              # 3D interactive match card component
│   │   ├── MatchDashboard.tsx         # Standings tables & Recharts graphs
│   │   ├── MatchPopup.tsx             # Match detail modal
│   │   ├── NewsFeed.tsx               # World Cup news feed
│   │   ├── NextMatchBanner.tsx        # Urgent sticky kickoff banner
│   │   ├── ParticleBackground.tsx     # Ambient background particle effect
│   │   ├── Stadiums.tsx               # Host stadiums & live weather metrics
│   │   ├── SupportPage.tsx            # Donation portal (UPI & Crypto)
│   │   └── TeamCompareModal.tsx       # Side-by-side H2H analytics modal
│   ├── data/
│   │   ├── stadiums.ts                # Stadium coordinates, capacities & images
│   │   └── index.ts                   # Static fallback schedules & timezone lists
│   ├── hooks/
│   │   └── useNotifications.ts        # LocalStorage notification preference manager
│   ├── lib/
│   │   ├── fifa-utils.ts              # TSI logic, probability model, flag mapper & ICS generator
│   │   └── utils.ts                   # Tailwind class merger utility
│   ├── services/
│   │   ├── espnPoller.ts              # ESPN live match event polling service
│   │   └── wc26.ts                    # Live data fetching & mapping transforms
│   ├── utils/
│   │   └── pdfExport.ts               # jsPDF custom schedule exporter
│   ├── App.tsx                    # Main Dashboard SPA container
│   ├── main.tsx                   # React root mount & portal router
│   ├── SettingsContext.tsx        # Global app settings context
│   ├── types.ts                   # TypeScript interfaces & enums
│   └── index.css                  # Custom theme variables & Tailwind imports
├── server.ts                      # Express API server & Vite middleware
├── vite.config.ts                 # Vite bundler configuration
├── package.json                   # Dependencies & npm scripts
├── tsconfig.json                  # TypeScript compiler options
└── README.md                      # Documentation

```

---

## 🚀 Getting Started

Follow these instructions to clone, configure, and run the project locally on your machine.

### **Prerequisites**

* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### **1. Clone the Repository**

```bash
git clone [https://github.com/your-username/fifa-world-cup-2026-dashboard.git](https://github.com/your-username/fifa-world-cup-2026-dashboard.git)
cd fifa-world-cup-2026-dashboard

```

### **2. Install Dependencies**

```bash
npm install

```

### **3. Environment Setup**

Create a `.env` file in the root directory (you can copy `.env.example`):

```bash
cp .env.example .env

```

Configure your environment variables:

```env
APP_URL="http://localhost:3000"

# Credentials for World Cup Live API provider
WC26_EMAIL="your_registered_email@example.com"
WC26_PASS="your_password"

```

### **4. Run Development Server**

Start the Express server integrated with Vite development middleware:

```bash
npm run dev

```

Open your browser and navigate to:

```text
http://localhost:3000

```

---

## 🛠️ Build for Production

To create an optimized production build and start the server:

```bash
# Compile client assets and bundle server script
npm run build

# Start production server
npm start

```

---

## 🔑 Admin Portal Configuration

The application includes an administrative management panel accessible directly through the browser at `/admin`.

* **URL:** `http://localhost:3000/admin`
* **Default Credentials:**
* **Username:** `admin`
* **Password:** `admin`



### **Admin Portal Capabilities:**

1. **Live Stream Manager:** Add or delete streaming links, assign tags (e.g., `English`, `HD`, `4K`).
2. **Branding Settings:** Dynamically update the website logo and favicon URLs.
3. **Marquee & Announcements:** Edit rich-text scrolling announcements and configure timed welcome popup messages.
4. **Real-Time ESPN Event Tracking:** Input active ESPN Event IDs to trigger instant match notification toasts for goals, cards, and kickoff events.
5. **Donation Links:** Update UPI payment links and cryptocurrency wallet addresses (BTC, ETH, SOL).

---

## 🔌 API Endpoints Reference

The backend Express server exposes several internal REST and streaming endpoints:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/settings` | `GET` | Fetches site settings & configurations from Firestore. |
| `/api/settings` | `POST` | Updates site settings (Requires admin credentials). |
| `/api/wc26/:endpoint` | `GET` | Proxies live tournament endpoints (`games`, `teams`, `groups`, `stadiums`) with a 60s memory cache and fallback to GitHub mirrors. |
| `/api/live-scores` | `GET` | Returns currently active live matches and scores. |
| `/api/upcoming` | `GET` | Returns upcoming scheduled matches. |
| `/api/news` | `GET` | Parses Google News RSS feed for World Cup headlines. |
| `/api/standings` | `GET` | Returns full tournament group standings and goal statistics. |
| `/api/notifications/stream` | `GET` | Server-Sent Events (SSE) channel pushing live match events in real-time. |
| `/api/notifications/track` | `POST` | Registers ESPN match IDs for the server poller to monitor. |

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the project:

1. **Fork the Repository**
2. **Create a Feature Branch:** `git checkout -b feature/AmazingFeature`
3. **Commit Your Changes:** `git commit -m 'Add some AmazingFeature'`
4. **Push to the Branch:** `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

```

```
