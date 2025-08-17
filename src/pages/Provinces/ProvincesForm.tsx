import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  useCreateProvinceMutation,
  useGetProvinceQuery,
  useUpdateProvinceMutation,
} from '../../store/provinces/provincesEndpoints';
import { useLazyGetDepartmentsQuery } from '../../store/departments/departmentsEndpoints';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingButton from '../../components/LoadingButton';
import Modal from '../../components/Modal';
import BackButton from '../../components/BackButton';
import { useState, useEffect } from 'react';
import {
  DepartmentType,
  CreateProvinceType,
  UpdateProvinceType,
} from '../../types';
import AsyncSelect from 'react-select/async';

const ProvinceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [getDepartments] = useLazyGetDepartmentsQuery();

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreateProvinceMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdateProvinceMutation();
  const { data: currentItem, isLoading: isLoadingitem } = useGetProvinceQuery(
    id!,
    { skip: !id }
  );

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingitem;

  // Initialize selected department when currentItem loads
  useEffect(() => {
    if (
      currentItem?.departmentId &&
      typeof currentItem.departmentId === 'object'
    ) {
      setSelectedDepartment({
        value: currentItem.departmentId._id,
        label: currentItem.departmentId.name,
      });
    }
  }, [currentItem]);

  const validationSchema = Yup.object({
    name: Yup.string().required('Este campo es obligatorio'),
    departmentId: Yup.string().required('Debe seleccionar un departamento'),
  });

  const initialValues = {
    name: currentItem?.name || '',
    active: currentItem?.active ?? true,
    departmentId:
      typeof currentItem?.departmentId === 'object'
        ? currentItem?.departmentId._id
        : currentItem?.departmentId || '',
  };

  const handleSubmit = async (values: {
    name: string;
    active: boolean;
    departmentId: string;
  }) => {
    try {
      if (isEditMode && id) {
        // For updates, only send the fields that can be updated
        const updatePayload: UpdateProvinceType = {
          name: values.name,
          active: values.active,
          departmentId: values.departmentId,
        };
        await updateItem({ id, item: updatePayload }).unwrap();
      } else {
        // For creation, send all required fields
        const createPayload: CreateProvinceType = {
          name: values.name,
          active: values.active,
          departmentId: values.departmentId,
        };
        await createItem(createPayload).unwrap();
      }
      setIsModalOpen(true);
      navigate('/provincias');
    } catch (err) {
      console.error('Failed to save province:', err);
    }
  };

  const loadDepartments = async (inputValue: string) => {
    try {
      const { data } = await getDepartments({
        search: inputValue,
        limit: 10,
      }).unwrap();

      return data.map((item: DepartmentType) => ({
        value: item._id,
        label: item.name,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  };

  return (
    <>
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center mb-8 border-b pb-4 border-gray-300">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              {isEditMode ? 'Editar' : 'Registro de'} Provincia
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? 'actualizar' : 'crear'} la provincia. Por
              favor intente nuevamente.
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, setFieldValue }: any) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nombre de la Provincia
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
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Departamento
                      </label>
                      <AsyncSelect
                        name="departmentId"
                        loadOptions={loadDepartments}
                        defaultOptions={true}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedDepartment}
                        onChange={(selectedOption) => {
                          setSelectedDepartment(selectedOption);
                          setFieldValue(
                            'departmentId',
                            selectedOption ? selectedOption.value : ''
                          );
                        }}
                      />
                      <ErrorMessage
                        name="departmentId"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate('/provincias')}
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

export default ProvinceForm;
