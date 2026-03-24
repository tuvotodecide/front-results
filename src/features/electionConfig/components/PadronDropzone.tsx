// Dropzone para subir archivo CSV del padrón electoral
// Basado en captura 01_dropzone.png

import React, { useRef, useState } from 'react';

interface PadronDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const CSVIcon = () => (
  <svg
    className="w-20 h-20 text-[#459151]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {/* Documento */}
    <rect x="16" y="8" width="48" height="64" rx="4" strokeLinejoin="round" />
    {/* Esquina doblada */}
    <path d="M48 8v16h16" strokeLinejoin="round" />
    <path d="M48 8l16 16" strokeLinejoin="round" />
    {/* Líneas de texto */}
    <line x1="26" y1="36" x2="54" y2="36" strokeWidth="3" strokeLinecap="round" />
    <line x1="26" y1="46" x2="54" y2="46" strokeWidth="3" strokeLinecap="round" />
    <line x1="26" y1="56" x2="42" y2="56" strokeWidth="3" strokeLinecap="round" />
    {/* Badge de check */}
    <circle cx="58" cy="18" r="8" fill="#459151" stroke="none" />
    <path d="M54 18l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PadronDropzone: React.FC<PadronDropzoneProps> = ({ onFileSelect, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-[#459151] bg-green-50'
            : 'border-[#459151] hover:bg-green-50/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Icono */}
        <div className="flex justify-center mb-6">
          <CSVIcon />
        </div>

        {/* Texto principal */}
        <p className="text-gray-700 text-lg mb-2">
          Arrastra aquí el archivo del Padrón Electoral (.CSV)
        </p>

        {/* Texto secundario */}
        <p className="text-gray-500 text-sm mb-6">
          o haz clic en el botón de abajo
        </p>

        {/* Botón */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={disabled}
          className={`
            px-8 py-3 border-2 border-[#459151] text-[#459151] font-semibold rounded-lg
            hover:bg-[#459151] hover:text-white transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Seleccionar archivo
        </button>
      </div>

      {/* Banner de tutorial */}
      <div className="bg-[#c0392b] rounded-lg p-4 flex items-center gap-4">
        {/* Icono de video */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Texto */}
        <div className="text-white">
          <p className="font-semibold text-lg">¿Primera vez subiendo un padrón?</p>
          <p className="text-white/80 text-sm">Ver tutorial en video</p>
        </div>
      </div>
    </div>
  );
};

export default PadronDropzone;
