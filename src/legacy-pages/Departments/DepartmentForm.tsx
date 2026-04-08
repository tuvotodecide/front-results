import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  useCreateDepartmentMutation,
  useGetDepartmentQuery,
  useUpdateDepartmentMutation,
} from '../../store/departments/departmentsEndpoints';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingButton from '../../components/LoadingButton';
import Modal from '../../components/Modal';
import BackButton from '../../components/BackButton';
import { useState } from 'react';

const DepartmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreateDepartmentMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdateDepartmentMutation();
  const { data: currentItem, isLoading: isLoadingitem } = useGetDepartmentQuery(
    id!,
    { skip: !id }
  );

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingitem;

  const validationSchema = Yup.object({
    name: Yup.string().required('Este campo es obligatorio'),
  });

  const initialValues = {
    name: currentItem?.name || '',
    active: currentItem?.active ?? true,
  };

  const handleSubmit = async (values: { name: string; active: boolean }) => {
    try {
      // Create payload without timestamp fields since the API doesn't expect them
      const payload = {
        name: values.name,
        active: values.active,
      };

      if (isEditMode && id) {
        await updateItem({ id, item: payload }).unwrap();
      } else {
        await createItem(payload as any).unwrap();
      }
      setIsModalOpen(true);
      navigate('/departamentos');
    } catch (err) {
      console.error('Failed to save department:', err);
    }
  };

  return (
    <>
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center mb-8 border-b pb-4 border-gray-300">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              {isEditMode ? 'Editar' : 'Registro de'} Departamento
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? 'actualizar' : 'crear'} el departamento.
              Por favor intente nuevamente.
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
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nombre del Departamento
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
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate('/departments')}
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

export default DepartmentForm;
