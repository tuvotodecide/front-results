// Modal para crear notificación a votantes
// Se usa desde la vista de estado de elección activa

import React, { useState } from 'react';
import Modal2 from '../../../components/Modal2';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (title: string, message: string) => Promise<void>;
  isLoading?: boolean;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onSend,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !isLoading;

  const handleSend = async () => {
    if (!canSend) return;

    setError(null);
    try {
      await onSend(title.trim(), message.trim());
      // Limpiar y cerrar al éxito
      setTitle('');
      setMessage('');
      onClose();
    } catch {
      setError('Error al enviar la notificación. Intenta de nuevo.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setMessage('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear notificación"
      size="lg"
      type="plain"
    >
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          Envía una notificación a todos los votantes habilitados de esta elección.
        </p>

        {/* Campo título */}
        <div>
          <label htmlFor="notif-title" className="block text-sm font-medium text-gray-700 mb-1">
            Título de la notificación
          </label>
          <input
            id="notif-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="Ej: Recordatorio de votación"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#459151] focus:border-[#459151] disabled:bg-gray-100"
          />
        </div>

        {/* Campo mensaje */}
        <div>
          <label htmlFor="notif-message" className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje
          </label>
          <textarea
            id="notif-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Escribe el mensaje que recibirán los votantes..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#459151] focus:border-[#459151] disabled:bg-gray-100 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`inline-flex items-center gap-2 px-6 py-2 font-semibold rounded-lg transition-all ${
              canSend
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Enviar notificación
              </>
            )}
          </button>
        </div>
      </div>
    </Modal2>
  );
};

export default NotificationModal;
