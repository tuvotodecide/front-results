import React from 'react';
import Modal2 from '../../../components/Modal2';
import CreateNewsForm from './CreateNewsForm';

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

const IMAGE_URL_PATTERN = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:$|[?#])/i;

const resolveSafeUrl = (value: string) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = new URL(rawValue);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return rawValue;
  } catch {
    return null;
  }
};

export const resolveValidNewsImageUrl = (value: string) => {
  const safeUrl = resolveSafeUrl(value);
  if (!safeUrl) {
    return null;
  }

  try {
    const parsed = new URL(safeUrl);
    return IMAGE_URL_PATTERN.test(parsed.pathname || '') ? safeUrl : null;
  } catch {
    return null;
  }
};

const CreateNewsModal: React.FC<CreateNewsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear noticia"
      size="lg"
      type="plain"
    >
      <CreateNewsForm
        onSubmit={async (payload) => {
          await onSubmit(payload);
          onClose();
        }}
        isLoading={isLoading}
        onCancel={handleClose}
      />
    </Modal2>
  );
};

export default CreateNewsModal;
