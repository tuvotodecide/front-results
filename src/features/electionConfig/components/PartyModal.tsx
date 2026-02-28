// Modal para crear/editar partido
// Basado en captura 02_party_modal.png

import React, { useState, useEffect, useRef } from 'react';
import Modal2 from '../../../components/Modal2';
import type { Party, CreatePartyPayload } from '../types';

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePartyPayload) => Promise<Party>;
  isLoading: boolean;
  editingParty?: Party | null;
}

const DEFAULT_COLOR = '#2E7D32';

const PartyModal: React.FC<PartyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  editingParty,
}) => {
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(DEFAULT_COLOR);
  const [logoBase64, setLogoBase64] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!editingParty;

  useEffect(() => {
    if (isOpen) {
      if (editingParty) {
        setName(editingParty.name);
        setColorHex(editingParty.colorHex);
        setLogoPreview(editingParty.logoUrl);
        setLogoBase64(undefined);
      } else {
        setName('');
        setColorHex(DEFAULT_COLOR);
        setLogoBase64(undefined);
        setLogoPreview(undefined);
      }
      setErrors({});
    }
  }, [isOpen, editingParty]);

  const validateHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  const handleColorChange = (value: string) => {
    // Agregar # si no existe
    let hex = value.startsWith('#') ? value : `#${value}`;
    // Limitar a 7 caracteres
    hex = hex.slice(0, 7).toUpperCase();
    setColorHex(hex);

    if (hex.length === 7 && !validateHex(hex)) {
      setErrors((prev) => ({ ...prev, color: 'Formato inválido (ej: #2E7D32)' }));
    } else {
      setErrors((prev) => ({ ...prev, color: undefined }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoBase64(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoBase64(base64);
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; color?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!validateHex(colorHex)) {
      newErrors.color = 'Formato de color inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        colorHex,
        logoBase64: logoBase64 || logoPreview,
      });
    } catch {
      // Error manejado por el padre
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="Datos del Partido"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre del Partido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Partido
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Ej: Movimiento Futuro"
            disabled={isLoading}
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:ring-2 focus:ring-[#459151] focus:border-[#459151]
              transition-colors
              ${errors.name ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex items-center gap-4">
            {/* Preview del color */}
            <div
              className="w-12 h-12 rounded-full border-2 border-gray-200 shadow-inner"
              style={{ backgroundColor: validateHex(colorHex) ? colorHex : '#ccc' }}
            />
            {/* Input hex */}
            <input
              type="text"
              value={colorHex}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#2E7D32"
              disabled={isLoading}
              className={`
                flex-1 px-4 py-3 border rounded-lg font-mono
                focus:ring-2 focus:ring-[#459151] focus:border-[#459151]
                ${errors.color ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {/* Color picker nativo */}
            <input
              type="color"
              value={validateHex(colorHex) ? colorHex : DEFAULT_COLOR}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
          {errors.color && (
            <p className="mt-1 text-sm text-red-600">{errors.color}</p>
          )}
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-[#459151] rounded-lg p-8 text-center cursor-pointer hover:bg-green-50 transition-colors"
          >
            {logoPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 object-contain rounded"
                />
                <p className="text-sm text-gray-500">Click para cambiar</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-10 h-10 mx-auto text-gray-400 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
                <p className="text-gray-500">
                  Arrastra tu logo aquí o clic para buscar
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar y Continuar'
            )}
          </button>
        </div>
      </form>
    </Modal2>
  );
};

export default PartyModal;
