import React, { useState, useEffect, useRef } from 'react';
import Modal2 from '../../../components/Modal2';
import type { Party, CreatePartyPayload } from '../types';

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePartyPayload) => Promise<Party>;
  isLoading: boolean;
  editingParty?: Party | null;
  submitError?: string | null;
  isReferendum?: boolean;
}

const DEFAULT_COLOR = '#2E7D32';
const MAX_COLORS = 4;

const PartyModal: React.FC<PartyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  editingParty,
  submitError,
  isReferendum = false,
}) => {
  const [name, setName] = useState('');
  // Cambiado a array para soportar múltiples colores
  const [colors, setColors] = useState<string[]>([DEFAULT_COLOR]);
  const [logoBase64, setLogoBase64] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [errors, setErrors] = useState<{ name?: string; colors?: string; logo?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingParty) {
        setName(editingParty.name);
        // Regla: Si no hay array de colores, usar colorHex como fallback
        const initialColors = editingParty.colors && editingParty.colors.length > 0
          ? editingParty.colors
          : [editingParty.colorHex || DEFAULT_COLOR];
        setColors(initialColors);
        setLogoPreview(editingParty.logoUrl);
        setLogoBase64(undefined);
      } else {
        setName('');
        setColors([DEFAULT_COLOR]);
        setLogoBase64(undefined);
        setLogoPreview(undefined);
      }
      setErrors({});
    }
  }, [isOpen, editingParty]);

  const validateHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  const handleColorChange = (index: number, value: string) => {
    let hex = value.startsWith('#') ? value : `#${value}`;
    hex = hex.slice(0, 7).toUpperCase();

    const newColors = [...colors];
    newColors[index] = hex;
    setColors(newColors);

    if (hex.length === 7 && !validateHex(hex)) {
      setErrors((prev) => ({ ...prev, colors: 'Formato inválido en uno de los colores' }));
    } else {
      setErrors((prev) => ({ ...prev, colors: undefined }));
    }
  };

  const addColorField = () => {
    if (colors.length < MAX_COLORS) {
      setColors([...colors, '#EDD577']);
    }
  };

  const removeColorField = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoBase64(base64);
      setLogoPreview(base64);
      setErrors((prev) => ({ ...prev, logo: undefined }));
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = '';
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
        setErrors((prev) => ({ ...prev, logo: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};

    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (colors.some(c => !validateHex(c))) newErrors.colors = 'Formato de color inválido';
    if (!logoBase64 && !logoPreview) {
      newErrors.logo = isReferendum ? 'La imagen es obligatoria' : 'El logo es obligatorio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        colors: colors, // Enviamos el array
        colorHex: colors[0], // Fallback para legacy
        logoBase64: logoBase64 || logoPreview,
      });
    } catch { }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title={isReferendum ? 'Datos de la opción' : 'Datos del Partido'}
      size="md"
      type="plain"
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isReferendum ? 'Nombre de la opción' : 'Nombre del Partido'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder={isReferendum ? 'Ej: Sí' : 'Ej: Movimiento Futuro'}
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

        {/* Colores */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {isReferendum ? 'Colores de la opción' : 'Colores del Partido'}
          </label>
          <div className="space-y-3">
            {colors.map((color, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[4rem_3rem_minmax(0,1fr)_2rem_2rem] sm:items-center">
                <span className="text-sm text-gray-500">Color {index + 1}:</span>

                <div
                  className="w-12 h-10 rounded border border-gray-200 shadow-sm"
                  style={{ backgroundColor: validateHex(color) ? color : '#ccc' }}
                />

                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  placeholder="#000000"
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                />

                <input
                  type="color"
                  value={validateHex(color) ? color : '#000000'}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                />

                {colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColorField(index)}
                    className="inline-flex h-8 w-8 items-center justify-center text-red-500 transition-colors hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botón Agregar Color Adicional */}
          {colors.length < MAX_COLORS && (
            <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-gray-200 bg-white rounded flex items-center justify-center">
                  <div className="w-6 h-6 border border-gray-100" />
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Agregar color adicional</p>
                  <p className="text-gray-400 text-xs">#EDD577</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addColorField}
                className="bg-[#2E7D32] hover:bg-[#256329] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <span className="text-lg">+</span> Agregar
              </button>
            </div>
          )}
          {errors.colors && (
            <p className="mt-2 text-sm text-red-600">{errors.colors}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">Puedes agregar hasta 4 colores en total.</p>
        </div>

        {/* Imagen / logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isReferendum ? 'Imagen *' : 'Logo *'}
          </label>
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-[#459151] rounded-lg p-8 text-center cursor-pointer hover:bg-green-50 transition-colors"
          >
            {logoPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={logoPreview}
                  alt={isReferendum ? 'Vista previa de la imagen' : 'Logo preview'}
                  className="w-32 h-32 object-contain rounded"
                />
                <p className="text-sm text-gray-500">
                  {isReferendum ? 'Haz clic para cambiar la imagen' : 'Click para cambiar'}
                </p>
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
                  {isReferendum
                    ? 'Arrastra la imagen aquí o haz clic para buscar'
                    : 'Arrastra tu logo aquí o clic para buscar'}
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
          {errors.logo && (
            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
          )}
        </div>

        {/* Botones (Originales) */}
        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
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
