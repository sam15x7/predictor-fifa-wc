import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, QrCode } from 'lucide-react';
import { useSettings } from '../SettingsContext';

export default function SupportPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'upi' | 'crypto'>('upi');
  const [copied, setCopied] = useState('');
  const { settings } = useSettings();

  const cryptoAddresses = [
    { name: 'Bitcoin (BTC)', address: settings.donationBtc || '19Ra1Uz11yHT4PzFrmQvLR8BzgyhwAMYJW', icon: '₿' },
    { name: 'Ethereum (ETH)', address: settings.donationEth || '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', icon: 'Ξ' },
    { name: 'Solana (SOL)', address: settings.donationSol || '7x2a...F91a', icon: '◎' }
  ].filter(c => c.address);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 transition-colors duration-300 fade-in">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#d4af37] hover:text-[#b0902c] transition-colors mb-8 font-mono"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-[#d4af37] mb-2 uppercase tracking-wider font-mono">Support the Creator</h1>
        <p className="text-gray-400 mb-8 font-mono">Your support helps keep this project alive and updated.</p>

        <div className="bg-[#111] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex bg-[#1a1a1a] p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('upi')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'upi' ? 'bg-[#d4af37] text-black shadow-md glow-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <QrCode size={16} /> UPI
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'crypto' ? 'bg-[#d4af37] text-black shadow-md glow-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="font-serif">₿</span> Crypto
            </button>
          </div>

          {activeTab === 'upi' ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(settings.donationUpiUrl.replace('https://upi.pe/', 'upi://pay?pa=').split('?')[0])}`}
                  alt="UPI QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
              <p className="text-sm font-mono text-gray-400">Scan to pay via any UPI app</p>
              
              <button 
                onClick={() => window.open(settings.donationUpiUrl, '_blank')}
                className="w-full max-w-sm mt-4 bg-[#d4af37] hover:bg-[#b0902c] text-black font-bold py-4 rounded-xl transition-colors shadow-lg shadow-[#d4af37]/20"
              >
                Pay via App
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cryptoAddresses.map((crypto, idx) => (
                <div key={idx} className="bg-black border border-[#d4af37]/20 rounded-xl p-4 hover:border-[#d4af37]/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-300">
                    <span className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-sm border border-[#d4af37]/30">
                      {crypto.icon}
                    </span>
                    {crypto.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#1a1a1a] font-mono text-[10px] sm:text-xs overflow-hidden text-ellipsis p-3 rounded-lg border border-[#d4af37]/20 text-gray-400">
                      {crypto.address}
                    </div>
                    <button
                      onClick={() => handleCopy(crypto.address, crypto.name)}
                      className="p-3 bg-[#1a1a1a] border border-[#d4af37]/20 hover:border-[#d4af37] rounded-lg transition-colors group"
                      title="Copy Address"
                    >
                      {copied === crypto.name ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} className="text-gray-400 group-hover:text-[#d4af37] transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
