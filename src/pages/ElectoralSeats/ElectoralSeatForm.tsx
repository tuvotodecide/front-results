import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  useCreateElectoralSeatMutation,
  useGetElectoralSeatQuery,
  useUpdateElectoralSeatMutation,
} from '../../store/electoralSeats/electoralSeatsEndpoints';
import {
  useLazyGetMunicipalitiesQuery,
  useLazyGetMunicipalitiesByProvinceIdQuery,
} from '../../store/municipalities/municipalitiesEndpoints';
import {
  useLazyGetProvincesQuery,
  useLazyGetProvincesByDepartmentIdQuery,
} from '../../store/provinces/provincesEndpoints';
import { useLazyGetDepartmentsQuery } from '../../store/departments/departmentsEndpoints';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingButton from '../../components/LoadingButton';
import Modal from '../../components/Modal';
import BackButton from '../../components/BackButton';
import { useState, useEffect } from 'react';
import {
  ProvincesType,
  DepartmentType,
  CreateElectoralSeatType,
  UpdateElectoralSeatType,
} from '../../types';
import AsyncSelect from 'react-select/async';

const ElectoralSeatForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [getProvinces] = useLazyGetProvincesQuery();
  const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
  const [getDepartments] = useLazyGetDepartmentsQuery();
  const [getMunicipalities] = useLazyGetMunicipalitiesQuery();
  const [getMunicipalitiesByProvinceId] =
    useLazyGetMunicipalitiesByProvinceIdQuery();

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreateElectoralSeatMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdateElectoralSeatMutation();
  const { data: currentItem, isLoading: isLoadingitem } =
    useGetElectoralSeatQuery(id!, { skip: !id });

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingitem;

  // Initialize selected province, department, and municipality when currentItem loads
  useEffect(() => {
    if (
      currentItem?.municipalityId &&
      typeof currentItem.municipalityId === 'object'
    ) {
      // Set municipality
      setSelectedMunicipality({
        value: currentItem.municipalityId._id,
        label: currentItem.municipalityId.name,
      });

      // Set province
      if (currentItem.municipalityId.provinceId) {
        setSelectedProvince({
          value: currentItem.municipalityId.provinceId._id,
          label: currentItem.municipalityId.provinceId.name,
        });

        // Set the department if it exists in the province data
        if (currentItem.municipalityId.provinceId.departmentId) {
          setSelectedDepartment({
            value: currentItem.municipalityId.provinceId.departmentId._id,
            label: currentItem.municipalityId.provinceId.departmentId.name,
          });
        }
      }
    }
  }, [currentItem]);

  // Reset province and municipality selection when department changes
  useEffect(() => {
    if (selectedDepartment) {
      // If we're not in edit mode or the department has changed, clear province and municipality
      if (
        !currentItem ||
        (currentItem.municipalityId &&
          typeof currentItem.municipalityId === 'object' &&
          currentItem.municipalityId.provinceId.departmentId._id !==
            selectedDepartment.value)
      ) {
        setSelectedProvince(null);
        setSelectedMunicipality(null);
      }
    }
  }, [selectedDepartment, currentItem]);

  // Reset municipality selection when province changes
  useEffect(() => {
    if (selectedProvince) {
      // If we're not in edit mode or the province has changed, clear municipality
      if (
        !currentItem ||
        (currentItem.municipalityId &&
          typeof currentItem.municipalityId === 'object' &&
          currentItem.municipalityId.provinceId._id !== selectedProvince.value)
      ) {
        setSelectedMunicipality(null);
      }
    }
  }, [selectedProvince, currentItem]);

  const validationSchema = Yup.object({
    name: Yup.string().required('Este campo es obligatorio'),
    idLoc: Yup.string().required('Este campo es obligatorio'),
    municipalityId: Yup.string().required('Debe seleccionar un municipio'),
  });

  const initialValues = {
    name: currentItem?.name || '',
    idLoc: currentItem?.idLoc || '',
    active: currentItem?.active ?? true,
    departmentId:
      typeof currentItem?.municipalityId === 'object'
        ? currentItem.municipalityId.provinceId.departmentId._id
        : '',
    provinceId:
      typeof currentItem?.municipalityId === 'object'
        ? currentItem.municipalityId.provinceId._id
        : '',
    municipalityId:
      typeof currentItem?.municipalityId === 'object'
        ? currentItem?.municipalityId._id
        : '',
  };

  const handleSubmit = async (values: {
    name: string;
    idLoc: string;
    active: boolean;
    departmentId: string;
    provinceId: string;
    municipalityId: string;
  }) => {
    console.log('Submitting values:', values);
    try {
      if (isEditMode && id) {
        // For updates, only send the fields that can be updated
        const updatePayload: UpdateElectoralSeatType = {
          name: values.name,
          idLoc: values.idLoc,
          active: values.active,
          municipalityId: values.municipalityId,
        };
        await updateItem({ id, item: updatePayload }).unwrap();
      } else {
        // For creation, send all required fields
        const createPayload: CreateElectoralSeatType = {
          name: values.name,
          idLoc: values.idLoc,
          active: values.active,
          municipalityId: values.municipalityId,
        };
        await createItem(createPayload).unwrap();
      }
      setIsModalOpen(true);
      navigate('/asientos-electorales');
    } catch (err) {
      console.error('Failed to save electoral seat:', err);
    }
  };

  const loadMunicipalities = async (inputValue: string = '') => {
    try {
      let data: any[];
      if (selectedProvince) {
        // If a province is selected, get municipalities for that province
        data = await getMunicipalitiesByProvinceId(
          selectedProvince.value
        ).unwrap();

        // Filter by search input if provided
        if (inputValue) {
          data = data.filter((item: any) =>
            item.name.toLowerCase().includes(inputValue.toLowerCase())
          );
        }
      } else {
        // If no province selected, search all municipalities
        const response = await getMunicipalities({
          search: inputValue,
          limit: 10,
        }).unwrap();
        data = response.data;
      }

      return data.map((item: any) => ({
        value: item._id,
        label: item.name,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  };

  const loadProvinces = async (inputValue: string = '') => {
    try {
      let data;
      if (selectedDepartment) {
        // If a department is selected, get provinces for that department
        data = await getProvincesByDepartmentId(
          selectedDepartment.value
        ).unwrap();

        // Filter by search input if provided
        if (inputValue) {
          data = data.filter((item: ProvincesType) =>
            item.name.toLowerCase().includes(inputValue.toLowerCase())
          );
        }
      } else {
        // If no department selected, search all provinces
        const response = await getProvinces({
          search: inputValue,
          limit: 10,
        }).unwrap();
        data = response.data;
      }

      return data.map((item: ProvincesType) => ({
        value: item._id,
        label: item.name,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
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
              {isEditMode ? 'Editar' : 'Registro de'} Asiento Electoral
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? 'actualizar' : 'crear'} el asiento
              electoral. Por favor intente nuevamente.
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="departmentId"
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
                          // Clear province and municipality selection when department changes
                          setSelectedProvince(null);
                          setSelectedMunicipality(null);
                          setFieldValue('provinceId', '');
                          setFieldValue('municipalityId', '');
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="provinceId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Provincia
                      </label>
                      <AsyncSelect
                        key={selectedDepartment?.value || 'no-department'}
                        name="provinceId"
                        loadOptions={loadProvinces}
                        defaultOptions={selectedDepartment ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedProvince}
                        onChange={(selectedOption) => {
                          setSelectedProvince(selectedOption);
                          // Clear municipality selection when province changes
                          setSelectedMunicipality(null);
                          setFieldValue(
                            'provinceId',
                            selectedOption ? selectedOption.value : ''
                          );
                          setFieldValue('municipalityId', '');
                        }}
                        isDisabled={!selectedDepartment}
                        noOptionsMessage={() =>
                          !selectedDepartment
                            ? 'Primero selecciona un departamento'
                            : 'No se encontraron provincias'
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="municipalityId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Municipio
                      </label>
                      <AsyncSelect
                        key={selectedProvince?.value || 'no-province'}
                        name="municipalityId"
                        loadOptions={loadMunicipalities}
                        defaultOptions={selectedProvince ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedMunicipality}
                        onChange={(selectedOption) => {
                          setSelectedMunicipality(selectedOption);
                          setFieldValue(
                            'municipalityId',
                            selectedOption ? selectedOption.value : ''
                          );
                        }}
                        isDisabled={!selectedProvince}
                        noOptionsMessage={() =>
                          !selectedProvince
                            ? 'Primero selecciona una provincia'
                            : 'No se encontraron municipios'
                        }
                      />
                      <ErrorMessage
                        name="municipalityId"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="idLoc"
                        className="block text-sm font-medium text-gray-700"
                      >
                        ID Localización
                      </label>
                      <Field
                        id="idLoc"
                        name="idLoc"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="idLoc"
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
                        Nombre del Asiento Electoral
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
                    onClick={() => navigate('/asientos-electorales')}
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

export default ElectoralSeatForm;
