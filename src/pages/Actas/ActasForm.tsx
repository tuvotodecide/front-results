import React, { useState, useRef } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSubmitBallotMutation } from "../../store/actas/actasEndpoints";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import LoadingButton from "../../components/LoadingButton";

interface FormValues {
  file: File | null;
  tableNumber: string;
  citizenId: string;
  locationCode: string;
}

const validationSchema = Yup.object({
  tableNumber: Yup.string().required("Table number is required"),
  citizenId: Yup.string().required("Citizen ID is required"),
  locationCode: Yup.string().required("Location code is required"),
});

const ActasForm: React.FC = () => {
  const [submitBallot] = useSubmitBallotMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
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
  const navigate = useNavigate();

  const initialValues: FormValues = {
    file: null,
    tableNumber: "",
    citizenId: "",
    locationCode: "",
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    setIsSubmitting(true);
    const formData = new FormData();
    if (values.file) {
      formData.append("file", values.file);
    }
    formData.append("tableNumber", values.tableNumber);
    formData.append("citizenId", values.citizenId);
    formData.append("locationCode", values.locationCode);

    try {
      await submitBallot(formData).unwrap();
      setIsModalOpen(true);
      resetForm();
      setPreviewUrl(null);
      // Reset file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      setFieldValue("file", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  return (
    <>
      <div className="flex h-full justify-center items-center">
        <div className="grow max-w-md p-8 bg-white rounded shadow-md">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-700 border-b pb-4 border-gray-300">
            Subir Acta
          </h1>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cargar Imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setFieldValue)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {previewUrl && (
                    <div
                      className="mt-2 relative cursor-pointer"
                      onClick={() => setIsPreviewModalOpen(true)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition-colors duration-200 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Numero de la Mesa
                  </label>
                  <Field
                    name="tableNumber"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="tableNumber"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carnet de identidad del ciudadano
                  </label>
                  <Field
                    name="citizenId"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="citizenId"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Codigo del Recinto
                  </label>
                  <Field
                    name="locationCode"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="locationCode"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>
                <div className=" flex justify-center mt-6 pt-6 border-t border-gray-300">
                  <LoadingButton type="submit" isLoading={isSubmitting}>
                    Enviar
                  </LoadingButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={true}
      >
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-auto">
          <div className="flex flex-col items-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-4 text-green-600">
              ¡Éxito!
            </h2>
            <p className="text-center mb-6">
              El acta se ha subido correctamente.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/resultados")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPreviewModalOpen}
        onRequestClose={() => {
          setIsPreviewModalOpen(false);
          resetZoomAndPosition();
        }}
        className="modal-content"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={true}
      >
        <div className="bg-white p-4 rounded-lg shadow-xl max-w-4xl w-full mx-auto relative">
          <button
            onClick={() => {
              setIsPreviewModalOpen(false);
              resetZoomAndPosition();
            }}
            className="absolute top-2 right-2 z-50 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1"
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
          {previewUrl && (
            <div
              ref={previewRef}
              className={`cursor-${
                isZoomed ? "grab" : "zoom-in"
              } overflow-hidden ${isZoomed ? "h-[80vh]" : ""} relative`}
              onClick={() => !isZoomed && setIsZoomed(true)}
              onMouseDown={handleDragStart}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto"
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
      </Modal>

      <style>
        {`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .modal-content {
            position: relative;
            outline: none;
            width: 100%;
          }
        `}
      </style>
    </>
  );
};

export default ActasForm;
