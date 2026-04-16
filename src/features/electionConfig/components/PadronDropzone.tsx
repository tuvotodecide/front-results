// Dropzone principal para subir PDF o imagen del padrón electoral

import React, { useRef, useState } from 'react';

interface PadronDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  onManualStart?: () => void;
}

const DocumentIcon = () => (
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
  </svg>
);

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const isSupportedFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return (
    ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension))
  );
};

const PadronDropzone: React.FC<PadronDropzoneProps> = ({
  onFileSelect,
  disabled = false,
  onManualStart,
}) => {
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
    if (file && isSupportedFile(file)) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isSupportedFile(file)) {
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
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Icono */}
        <div className="flex justify-center mb-6">
          <DocumentIcon />
        </div>

        {/* Texto principal */}
        <p className="text-gray-700 text-xl font-semibold mb-2">
          Arrastra aquí el archivo del padrón electoral
        </p>

        {/* Texto secundario */}
        <p className="text-gray-500 text-sm mb-1">
          PDF o imagen: JPG, JPEG, PNG o WEBP
        </p>
        <p className="text-gray-500 text-sm mb-6">
          También puedes hacer clic para seleccionar el archivo desde tu equipo
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

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-blue-800">
            <p className="font-semibold">Puedes cargar un PDF o imagen para intentar el análisis automático.</p>
            <p className="mt-1 text-sm text-blue-700">
              Si el análisis automático está disponible, intentaremos convertir el archivo en un padrón editable. Si no está disponible o no se detectan datos útiles, podrás continuar con carga manual sin bloquear el flujo.
            </p>
          </div>
        </div>
      </div>

      {onManualStart ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onManualStart}
            disabled={disabled}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Crear padrón manualmente
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PadronDropzone;
