import React, { createContext, useContext, useEffect, useState } from 'react';

export interface LiveStream {
  id: string;
  name: string;
  url: string;
  tags: string[];
}

export interface AppSettings {
  watchLiveEnabled: boolean;
  watchLiveUrl: string;
  siteLogo: string;
  siteFavicon: string;
  donationUpiUrl: string;
  donationBtc: string;
  donationEth: string;
  donationSol: string;
  whatsappLink: string;
  newsMarqueeMessage: string;
  welcomePopupEnabled: boolean;
  welcomePopupMessage: string;
  welcomePopupStartTime: string;
  welcomePopupEndTime: string;
  liveStreams: LiveStream[];
}

const defaultSettings: AppSettings = {
  watchLiveEnabled: true,
  watchLiveUrl: "https://sam15x7.github.io/fifa/Cazetv(1).html",
  siteLogo: "https://i.ibb.co/k2dPbRyg/Picsart-26-06-28-20-19-42-827.png",
  siteFavicon: "https://i.ibb.co/k2dPbRyg/Picsart-26-06-28-20-19-42-827.png",
  donationUpiUrl: "https://upi.pe/samihanchatterjee@fam/50.00?pn=Samihan+Chatterjee&tn=Wonderful+Website",
  donationBtc: "",
  donationEth: "",
  donationSol: "",
  whatsappLink: "https://whatsapp.com/channel/0029VaEQJcJEVccLFGqfTo0w",
  newsMarqueeMessage: "Welcome to The Predictor. Follow live matches, predictions, and schedules.",
  welcomePopupEnabled: false,
  welcomePopupMessage: "Welcome to our site!",
  welcomePopupStartTime: "",
  welcomePopupEndTime: "",
  liveStreams: []
};

const SettingsContext = createContext<{ settings: AppSettings, loading: boolean }>({
  settings: defaultSettings,
  loading: true
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);

        // Update favicon if set
        if (data.siteFavicon) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.siteFavicon;
        }
      })
      .catch(err => {
        console.error('Failed to load settings', err);
        setLoading(false);
      });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
