import React from 'react';

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="particles-container">
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * -20;
          return (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animation: `drift ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: '0 0 4px rgba(255,255,255,0.8)'
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(50px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
