import React, { useState, useRef } from "react";
import ReactModal from "react-modal";

interface ModalImageProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

const ModalImage: React.FC<ModalImageProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
  });

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    const target = e.currentTarget as HTMLDivElement;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - dragRef.current.translateX,
      startY: e.clientY - dragRef.current.translateY,
      translateX: dragRef.current.translateX,
      translateY: dragRef.current.translateY,
    };
    target.style.cursor = "grabbing";
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isZoomed || !dragRef.current.isDragging) return;
    if (e.buttons === 1) {
      const newX = e.clientX - dragRef.current.startX;
      const newY = e.clientY - dragRef.current.startY;
      dragRef.current.translateX = newX;
      dragRef.current.translateY = newY;

      if (previewRef.current) {
        const img = previewRef.current.querySelector("img");
        if (img) {
          img.style.transition = "none";
          img.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale3d(${zoomLevel}, ${zoomLevel}, 1)`;
        }
      }
    }
  };

  const handleDragEnd = (e: React.MouseEvent) => {
    dragRef.current.isDragging = false;
    (e.currentTarget as HTMLDivElement).style.cursor = "grab";
    if (previewRef.current) {
      const img = previewRef.current.querySelector("img");
      if (img) {
        img.style.transition = "transform 200ms";
      }
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const resetZoomAndPosition = () => {
    setIsZoomed(false);
    setZoomLevel(1.5);
    dragRef.current = {
      isDragging: false,
      startX: 0,
      startY: 0,
      translateX: 0,
      translateY: 0,
    };
    if (previewRef.current) {
      const img = previewRef.current.querySelector("img");
      if (img) {
        img.style.transform = "none";
      }
    }
  };

  const handleCloseModal = () => {
    resetZoomAndPosition();
    onClose();
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={handleCloseModal}
      className="modal-content"
      overlayClassName="modal-overlay"
      shouldCloseOnOverlayClick={true}
      style={{
        overlay: {
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
        },
      }}
    >
      <div className="bg-white p-4 rounded-lg shadow-xl max-w-4xl mx-auto relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleCloseModal}
          className="absolute top-2 right-2 z-50 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {imageUrl && (
          <div
            ref={previewRef}
            className={`cursor-${
              isZoomed ? "grab" : "zoom-in"
            } overflow-hidden ${isZoomed ? "h-[80vh]" : ""} relative mt-8`}
            onClick={() => !isZoomed && setIsZoomed(true)}
            onMouseDown={handleDragStart}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-auto object-contain"
              style={{
                transform: isZoomed
                  ? `translate3d(${dragRef.current.translateX}px, ${dragRef.current.translateY}px, 0) scale3d(${zoomLevel}, ${zoomLevel}, 1)`
                  : "none",
                transition: dragRef.current.isDragging
                  ? "none"
                  : "transform 200ms",
              }}
              draggable={false}
            />
            {isZoomed && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={handleZoomOut}
                  className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleZoomIn}
                  className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>
        {`
          .modal-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background-color: rgba(0, 0, 0, 0.75);
          }
          .modal-content {
            position: relative;
            outline: none;
            margin: auto;
          }
        `}
      </style>
    </ReactModal>
  );
};

export default ModalImage;
