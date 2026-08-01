import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Save, LogOut, Smile, Plus, Trash2 } from 'lucide-react';
import { AppSettings, useSettings, LiveStream } from './SettingsContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import EmojiPicker from 'emoji-picker-react';

export default function AdminPortal() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { settings: initialSettings, loading } = useSettings();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEventIds, setActiveEventIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !settings) {
      setSettings(initialSettings);
    }
  }, [loading, initialSettings, settings]);

  useEffect(() => {
    if (loggedIn) {
      fetch('/api/notifications/active')
        .then(res => res.json())
        .then(data => setActiveEventIds(data.activeEventIds || []))
        .catch(err => console.error(err));
    }
  }, [loggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'samihan' && password === '456SamihanJujuKOLA') {
      setLoggedIn(true);
      setStatus('');
    } else {
      setStatus('Invalid credentials');
    }
  };

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, settings })
      });
      
      const res2 = await fetch('/api/notifications/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: activeEventIds.filter(id => id.trim() !== '') })
      });

      if (res.ok && res2.ok) {
        setStatus('Settings saved successfully!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('Failed to save settings.');
      }
    } catch (e) {
      setStatus('Error saving settings.');
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#111111] border border-[#d4af37]/30 p-8 rounded-2xl w-full max-w-md shadow-2xl shadow-[#d4af37]/10">
          <div className="flex justify-center mb-6 text-[#d4af37]">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-6 font-mono">ADMIN LOGIN</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-3 text-white focus:border-[#d4af37] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-3 text-white focus:border-[#d4af37] outline-none"
              />
            </div>
            {status && <p className="text-red-500 text-sm font-mono text-center">{status}</p>}
            <button type="submit" className="w-full bg-[#d4af37] text-black font-bold py-3 rounded-lg hover:bg-[#b0902c] transition-colors mt-4">
              LOGIN
            </button>
          </form>
          <div className="mt-4 text-center">
             <a href="/" className="text-[#a1a1aa] hover:text-[#d4af37] text-xs font-mono transition-colors">← Back to Site</a>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-mono text-[#d4af37] flex items-center gap-3">
            <ShieldAlert /> ADMIN DASHBOARD
          </h1>
          <div className="flex gap-4">
             <a href="/" className="px-4 py-2 bg-[#111111] border border-[#d4af37]/30 rounded-lg hover:bg-[#1a1a1a] transition-colors">View Site</a>
             <button onClick={() => setLoggedIn(false)} className="px-4 py-2 bg-red-900/50 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-900 flex items-center gap-2 transition-colors">
               <LogOut size={16} /> Logout
             </button>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">Live Match Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="watchLiveEnabled"
                checked={settings.watchLiveEnabled}
                onChange={e => setSettings({...settings, watchLiveEnabled: e.target.checked})}
                className="w-5 h-5 accent-[#d4af37]"
              />
              <label htmlFor="watchLiveEnabled" className="font-mono">Enable "Watch Live" Button</label>
            </div>

            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Watch Live URL</label>
              <input
                type="text"
                value={settings.watchLiveUrl}
                onChange={e => setSettings({...settings, watchLiveUrl: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">Branding</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Site Logo URL (SVG/PNG)</label>
              <input
                type="text"
                value={settings.siteLogo}
                placeholder="Leave blank for default"
                onChange={e => setSettings({...settings, siteLogo: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Favicon URL (ICO/PNG)</label>
              <input
                type="text"
                value={settings.siteFavicon}
                placeholder="Leave blank for default"
                onChange={e => setSettings({...settings, siteFavicon: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">Announcements</h2>
          
          <div>
            <label className="block text-sm font-mono text-[#a1a1aa] mb-2">Scrolling Marquee Message (Rich Text)</label>
            <div className="bg-white text-black rounded-lg overflow-hidden">
              <ReactQuill 
                theme="snow" 
                value={settings.newsMarqueeMessage || ''} 
                onChange={val => setSettings({...settings, newsMarqueeMessage: val})} 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#d4af37]/20">
            <h3 className="text-lg font-bold text-[#d4af37] mb-4">Welcome Popup</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="welcomePopupEnabled"
                  checked={settings.welcomePopupEnabled || false}
                  onChange={e => setSettings({...settings, welcomePopupEnabled: e.target.checked})}
                  className="w-5 h-5 accent-[#d4af37]"
                />
                <label htmlFor="welcomePopupEnabled" className="font-mono">Enable Welcome Popup</label>
              </div>

              <div>
                <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Popup Message</label>
                <div className="relative">
                  <textarea
                    value={settings.welcomePopupMessage || ''}
                    onChange={e => setSettings({...settings, welcomePopupMessage: e.target.value})}
                    className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-3 pr-12 text-white focus:border-[#d4af37] outline-none font-mono text-sm min-h-[100px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute top-3 right-3 text-[#d4af37] hover:text-white"
                  >
                    <Smile size={20} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full right-0 mt-2 z-50">
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          setSettings({...settings, welcomePopupMessage: (settings.welcomePopupMessage || '') + emojiData.emoji});
                          setShowEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={settings.welcomePopupStartTime || ''}
                    onChange={e => setSettings({...settings, welcomePopupStartTime: e.target.value})}
                    className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-[#a1a1aa] mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={settings.welcomePopupEndTime || ''}
                    onChange={e => setSettings({...settings, welcomePopupEndTime: e.target.value})}
                    className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">Real-Time Event Tracking (ESPN)</h2>
          <p className="text-sm text-[#a1a1aa] font-mono">
            Enter up to 3 active ESPN Event IDs to track live events (Kickoff, Goals, Cards). Notifications will be pushed to all connected clients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Event ID {index + 1}</label>
                <input
                  type="text"
                  value={activeEventIds[index] || ''}
                  onChange={e => {
                    const newIds = [...activeEventIds];
                    newIds[index] = e.target.value;
                    setActiveEventIds(newIds.slice(0, 3));
                  }}
                  className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
                  placeholder="e.g. 401879301"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[#d4af37]/20 pb-2">
            <h2 className="text-xl font-bold text-[#d4af37]">Live Streams Management</h2>
            <button
              onClick={() => {
                const newStream: LiveStream = { id: Date.now().toString(), name: '', url: '', tags: [] };
                setSettings({ ...settings, liveStreams: [...(settings.liveStreams || []), newStream] });
              }}
              className="flex items-center gap-1 text-sm bg-[#d4af37] text-black px-3 py-1 rounded-md font-bold hover:bg-[#b0902c] transition"
            >
              <Plus size={16} /> Add Stream
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.liveStreams || []).map((stream, idx) => (
              <div key={stream.id} className="p-4 border border-[#d4af37]/20 rounded-lg bg-black space-y-4 relative">
                <button
                  onClick={() => {
                    const newStreams = settings.liveStreams.filter(s => s.id !== stream.id);
                    setSettings({ ...settings, liveStreams: newStreams });
                  }}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-400"
                >
                  <Trash2 size={20} />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Button Name</label>
                    <input
                      type="text"
                      value={stream.name}
                      onChange={e => {
                        const newStreams = [...settings.liveStreams];
                        newStreams[idx].name = e.target.value;
                        setSettings({ ...settings, liveStreams: newStreams });
                      }}
                      className="w-full bg-[#111] border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
                      placeholder="e.g. FIFA TV English"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Stream URL</label>
                    <input
                      type="text"
                      value={stream.url}
                      onChange={e => {
                        const newStreams = [...settings.liveStreams];
                        newStreams[idx].url = e.target.value;
                        setSettings({ ...settings, liveStreams: newStreams });
                      }}
                      className="w-full bg-[#111] border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono text-[#a1a1aa] mb-2">Tags</label>
                  <div className="flex flex-wrap gap-4">
                    {['English', 'Arabic', 'Malayalam', 'German', 'Chinese', 'HD', '720P', '4K'].map(tag => (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stream.tags.includes(tag)}
                          onChange={e => {
                            const newStreams = [...settings.liveStreams];
                            if (e.target.checked) {
                              newStreams[idx].tags.push(tag);
                            } else {
                              newStreams[idx].tags = newStreams[idx].tags.filter(t => t !== tag);
                            }
                            setSettings({ ...settings, liveStreams: newStreams });
                          }}
                          className="w-4 h-4 accent-[#d4af37]"
                        />
                        <span className="text-sm font-mono text-white">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {(!settings.liveStreams || settings.liveStreams.length === 0) && (
               <div className="text-center text-[#a1a1aa] font-mono text-sm py-4">No live streams added yet.</div>
            )}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">WhatsApp Channel Link</label>
              <input
                type="text"
                value={settings.whatsappLink}
                onChange={e => setSettings({...settings, whatsappLink: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Donation UPI URL</label>
              <input
                type="text"
                value={settings.donationUpiUrl}
                onChange={e => setSettings({...settings, donationUpiUrl: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Donation BTC Address</label>
              <input
                type="text"
                value={settings.donationBtc}
                onChange={e => setSettings({...settings, donationBtc: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Donation ETH Address</label>
              <input
                type="text"
                value={settings.donationEth}
                onChange={e => setSettings({...settings, donationEth: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-[#a1a1aa] mb-1">Donation SOL Address</label>
              <input
                type="text"
                value={settings.donationSol}
                onChange={e => setSettings({...settings, donationSol: e.target.value})}
                className="w-full bg-black border border-[#d4af37]/30 rounded-lg p-2 text-white focus:border-[#d4af37] outline-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-[#d4af37]/20">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#d4af37] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#b0902c] transition-colors"
          >
            <Save size={20} /> SAVE CHANGES
          </button>
          {status && (
            <span className={`font-mono text-sm ${status.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
