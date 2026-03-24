// Frame de teléfono para preview de papeleta
// Basado en captura 01_preview.png

import React from 'react';

interface PhoneMockupProps {
  children: React.ReactNode;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({ children }) => {
  return (
    <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
      {/* Frame del teléfono */}
      <div
        className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Notch superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

        {/* Speaker */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full z-20" />

        {/* Pantalla */}
        <div className="relative bg-white rounded-[2.25rem] overflow-hidden" style={{ minHeight: '580px' }}>
          {/* Status bar simulada */}
          <div className="h-8 bg-gray-100 flex items-center justify-between px-6">
            <span className="text-xs text-gray-600 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
              </svg>
              <div className="flex gap-0.5">
                <div className="w-1 h-2 bg-gray-600 rounded-sm" />
                <div className="w-1 h-3 bg-gray-600 rounded-sm" />
                <div className="w-1 h-4 bg-gray-600 rounded-sm" />
                <div className="w-1 h-3 bg-gray-400 rounded-sm" />
              </div>
              <svg className="w-5 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="7" width="18" height="10" rx="2" />
                <rect x="20" y="10" width="2" height="4" rx="1" />
              </svg>
            </div>
          </div>

          {/* Contenido de la app */}
          <div className="overflow-y-auto" style={{ maxHeight: '540px' }}>
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
};

export default PhoneMockup;
