import React, { useEffect, useState } from 'react';
import Modal2 from '../../../components/Modal2';

type CreateNewsPayload = {
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
};

interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNewsPayload) => Promise<void>;
  isLoading?: boolean;
}

const CreateNewsModal: React.FC<CreateNewsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setBody('');
      setLink('');
      setImageUrl('');
      setError(null);
    }
  }, [isOpen]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !isLoading;

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Completa el título y la descripción para publicar la noticia.');
      return;
    }

    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      onClose();
    } catch (submitError: any) {
      setError(submitError?.message || 'No se pudo publicar la noticia.');
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear noticia"
      size="lg"
      type="plain"
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Esta noticia se publicará de inmediato para los votantes del padrón actual.
        </p>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isLoading}
            placeholder="Ej: Cambio de horario o información importante"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15 disabled:bg-slate-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Descripción</span>
          <textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={isLoading}
            placeholder="Escribe el contenido breve que deben ver los votantes."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15 disabled:bg-slate-100"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Enlace opcional</span>
            <input
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              disabled={isLoading}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15 disabled:bg-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              URL de imagen (opcional)
            </span>
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              disabled={isLoading}
              placeholder="https://.../imagen.png"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15 disabled:bg-slate-100"
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-xl bg-[#459151] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Publicando...' : 'Publicar noticia'}
          </button>
        </div>
      </div>
    </Modal2>
  );
};

export default CreateNewsModal;
