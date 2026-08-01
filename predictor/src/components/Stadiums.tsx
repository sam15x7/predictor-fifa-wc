import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Users, CloudRain, Sun, Cloud, Thermometer, ChevronRight } from 'lucide-react';
import { stadiumsData } from '../data/stadiums';
import { cn } from '../lib/utils';
import { format as formatTZ, toZonedTime } from 'date-fns-tz';

const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-gray-300" />;
    if (code >= 45 && code <= 48) return <Cloud className="w-5 h-5 text-gray-400" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudRain className="w-5 h-5 text-white" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (code >= 95) return <CloudRain className="w-5 h-5 text-purple-400" />;
    return <Cloud className="w-5 h-5 text-gray-300" />;
};

export default function Stadiums() {
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchWeather() {
      // Fetch open-meteo for all stadiums in parallel
      const newWeather: Record<string, any> = {};
      await Promise.all(stadiumsData.map(async (stadium) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${stadium.lat}&longitude=${stadium.lng}&current_weather=true`);
          if (res.ok) {
            const data = await res.json();
            newWeather[stadium.id] = data.current_weather;
          }
        } catch (e) {
          console.error('Weather fetch error', e);
        }
      }));
      setWeatherData(newWeather);
    }
    fetchWeather();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Host Stadiums</h1>
      </motion.div>

      <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
        {stadiumsData.map((stadium, i) => {
          const weather = weatherData[stadium.id];
          const localTime = toZonedTime(now, stadium.timezone);
          
          return (
            <motion.div
              key={stadium.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group relative bg-[#1A1F26] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#E8001D]/50 transition-all duration-300 shadow-lg shadow-black/20"
            >
              <div className="h-48 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F26] via-transparent to-transparent z-10" />
                <img 
                  src={stadium.image} 
                  alt={stadium.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-duration-700"
                />
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-semibold text-white uppercase tracking-wider">
                    {stadium.city}
                  </span>
                </div>
              </div>

              <div className="p-5 relative z-20">
                <h3 className="text-xl font-bold text-white mb-4 line-clamp-1">{stadium.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-400 text-sm bg-black/20 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#E8001D]" />
                      <span>Capacity</span>
                    </div>
                    <span className="font-mono text-white">{stadium.capacity.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-400 text-sm bg-black/20 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#E8001D]" />
                      <span>Local Time</span>
                    </div>
                    <span className="font-mono text-white">{formatTZ(localTime, 'HH:mm:ss')}</span>
                  </div>

                  {weather ? (
                    <div className="flex items-center justify-between text-gray-400 text-sm bg-black/20 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-[#E8001D]" />
                        <span>Weather</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(weather.weathercode)}
                        <span className="font-mono text-white">{weather.temperature}°C</span>
                      </div>
                    </div>
                  ) : (
                     <div className="flex items-center justify-between text-gray-400 text-sm bg-black/20 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-gray-600" />
                        <span>Weather</span>
                      </div>
                      <div className="w-12 h-4 bg-gray-800 animate-pulse rounded" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
