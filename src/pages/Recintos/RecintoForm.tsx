import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RecintoElectoral } from "../../types/recintos";
import {
  useCreateRecintoMutation,
  useUpdateRecintoMutation,
  useGetRecintoQuery,
} from "../../store/recintos/recintosEndpoints";
import { useNavigate, useParams } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import Modal from "../../components/Modal";
import BackButton from "../../components/BackButton";
import { useState } from "react";

const RecintoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createRecinto, { isLoading: isCreating, error: createError }] =
    useCreateRecintoMutation();
  const [updateRecinto, { isLoading: isUpdating, error: updateError }] =
    useUpdateRecintoMutation();
  const { data: currentRecinto, isLoading: isLoadingRecinto } =
    useGetRecintoQuery(id!, { skip: !id });

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingRecinto;

  const validationSchema = Yup.object({
    name: Yup.string().required("Este campo es obligatorio"),
    address: Yup.string().required("Este campo es obligatorio"),
    code: Yup.string().required("Este campo es obligatorio"),
    department: Yup.string().required("Este campo es obligatorio"),
    municipality: Yup.string().required("Este campo es obligatorio"),
    province: Yup.string().required("Este campo es obligatorio"),
    totalTables: Yup.number()
      .required("Este campo es obligatorio")
      .min(1, "Debe ser mayor a 0"),
    coordinates: Yup.object({
      latitude: Yup.number()
        .required("Latitud es obligatoria")
        .min(-90)
        .max(90),
      longitude: Yup.number()
        .required("Longitud es obligatoria")
        .min(-180)
        .max(180),
    }),
  });

  const initialValues = {
    name: currentRecinto?.name || "",
    address: currentRecinto?.address || "",
    code: currentRecinto?.code || "",
    department: currentRecinto?.department || "",
    municipality: currentRecinto?.municipality || "",
    province: currentRecinto?.province || "",
    totalTables: currentRecinto?.totalTables || 0,
    coordinates: {
      latitude: currentRecinto?.coordinates.latitude || 0,
      longitude: currentRecinto?.coordinates.longitude || 0,
    },
    active: currentRecinto?.active ?? true,
  };

  const handleSubmit = async (
    values: Omit<RecintoElectoral, "_id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (isEditMode && id) {
        await updateRecinto({ id, recinto: values }).unwrap();
      } else {
        await createRecinto(values).unwrap();
      }
      setIsModalOpen(true);
      navigate("/recintos");
    } catch (err) {
      console.error("Failed to save recinto:", err);
    }
  };

  return (
    <>
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center mb-8 border-b pb-4 border-gray-300">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              {isEditMode ? "Editar" : "Registro de"} Recinto Electoral
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? "actualizar" : "crear"} el recinto. Por
              favor intente nuevamente.
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="code"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Código
                        </label>
                        <Field
                          id="code"
                          name="code"
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage
                          name="code"
                          component="div"
                          className="text-orange-600 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="totalTables"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Total de Mesas
                        </label>
                        <Field
                          id="totalTables"
                          name="totalTables"
                          type="number"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage
                          name="totalTables"
                          component="div"
                          className="text-orange-600 text-sm mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nombre del Recinto
                      </label>
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Dirección
                      </label>
                      <Field
                        id="address"
                        name="address"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="address"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="department"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Departamento
                      </label>
                      <Field
                        id="department"
                        name="department"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="department"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="province"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Provincia
                      </label>
                      <Field
                        id="province"
                        name="province"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="province"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="municipality"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Municipio
                      </label>
                      <Field
                        id="municipality"
                        name="municipality"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="municipality"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="coordinates.latitude"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Latitud
                    </label>
                    <Field
                      id="coordinates.latitude"
                      name="coordinates.latitude"
                      type="number"
                      step="0.000001"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="coordinates.latitude"
                      component="div"
                      className="text-orange-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="coordinates.longitude"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Longitud
                    </label>
                    <Field
                      id="coordinates.longitude"
                      name="coordinates.longitude"
                      type="number"
                      step="0.000001"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="coordinates.longitude"
                      component="div"
                      className="text-orange-600 text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate("/recintos")}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading || isSubmitting}
                  >
                    Guardar
                  </LoadingButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Exito"
      />
    </>
  );
};

export default RecintoForm;
