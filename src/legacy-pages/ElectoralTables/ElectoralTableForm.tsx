import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  useCreateElectoralTableMutation,
  useGetElectoralTableQuery,
  useUpdateElectoralTableMutation,
} from '../../store/electoralTables/electoralTablesEndpoints';
import { useLazyGetElectoralLocationsByElectoralSeatIdQuery } from '../../store/electoralLocations/electoralLocationsEndpoints';
import { useLazyGetElectoralSeatsByMunicipalityIdQuery } from '../../store/electoralSeats/electoralSeatsEndpoints';
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
  CreateElectoralTableType,
  UpdateElectoralTableType,
  ElectoralSeatByMunicipalityType,
  ElectoralLocationByElectoralSeatType,
} from '../../types';
import AsyncSelect from 'react-select/async';

const ElectoralTableForm: React.FC = () => {
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
  const [selectedElectoralSeat, setSelectedElectoralSeat] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedElectoralLocation, setSelectedElectoralLocation] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [getProvinces] = useLazyGetProvincesQuery();
  const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
  const [getDepartments] = useLazyGetDepartmentsQuery();
  const [getMunicipalities] = useLazyGetMunicipalitiesQuery();
  const [getMunicipalitiesByProvinceId] =
    useLazyGetMunicipalitiesByProvinceIdQuery();
  const [getElectoralSeatsByMunicipalityId] =
    useLazyGetElectoralSeatsByMunicipalityIdQuery();
  const [getElectoralLocationsByElectoralSeatId] =
    useLazyGetElectoralLocationsByElectoralSeatIdQuery();

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreateElectoralTableMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdateElectoralTableMutation();
  const { data: currentItem, isLoading: isLoadingitem } =
    useGetElectoralTableQuery(id!, { skip: !id });

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingitem;

  // Initialize selected province, department, municipality, electoral seat and electoral location when currentItem loads
  useEffect(() => {
    if (
      currentItem?.electoralLocationId &&
      typeof currentItem.electoralLocationId === 'object'
    ) {
      // Set electoral location
      setSelectedElectoralLocation({
        value: currentItem.electoralLocationId._id,
        label: currentItem.electoralLocationId.name,
      });

      // Set electoral seat
      setSelectedElectoralSeat({
        value: currentItem.electoralLocationId.electoralSeatId._id,
        label: currentItem.electoralLocationId.electoralSeatId.name,
      });

      // Set municipality
      if (currentItem.electoralLocationId.electoralSeatId.municipalityId) {
        setSelectedMunicipality({
          value:
            currentItem.electoralLocationId.electoralSeatId.municipalityId._id,
          label:
            currentItem.electoralLocationId.electoralSeatId.municipalityId.name,
        });

        // Set province
        if (
          currentItem.electoralLocationId.electoralSeatId.municipalityId
            .provinceId
        ) {
          setSelectedProvince({
            value:
              currentItem.electoralLocationId.electoralSeatId.municipalityId
                .provinceId._id,
            label:
              currentItem.electoralLocationId.electoralSeatId.municipalityId
                .provinceId.name,
          });

          // Set the department if it exists in the province data
          if (
            currentItem.electoralLocationId.electoralSeatId.municipalityId
              .provinceId.departmentId
          ) {
            setSelectedDepartment({
              value:
                currentItem.electoralLocationId.electoralSeatId.municipalityId
                  .provinceId.departmentId._id,
              label:
                currentItem.electoralLocationId.electoralSeatId.municipalityId
                  .provinceId.departmentId.name,
            });
          }
        }
      }
    }
  }, [currentItem]);

  // Reset province, municipality, electoral seat and electoral location selection when department changes
  useEffect(() => {
    if (selectedDepartment) {
      // If we're not in edit mode or the department has changed, clear province, municipality, electoral seat and electoral location
      if (
        !currentItem ||
        (currentItem.electoralLocationId &&
          typeof currentItem.electoralLocationId === 'object' &&
          currentItem.electoralLocationId.electoralSeatId.municipalityId
            .provinceId.departmentId._id !== selectedDepartment.value)
      ) {
        setSelectedProvince(null);
        setSelectedMunicipality(null);
        setSelectedElectoralSeat(null);
        setSelectedElectoralLocation(null);
      }
    }
  }, [selectedDepartment, currentItem]);

  // Reset municipality, electoral seat and electoral location selection when province changes
  useEffect(() => {
    if (selectedProvince) {
      // If we're not in edit mode or the province has changed, clear municipality, electoral seat and electoral location
      if (
        !currentItem ||
        (currentItem.electoralLocationId &&
          typeof currentItem.electoralLocationId === 'object' &&
          currentItem.electoralLocationId.electoralSeatId.municipalityId
            .provinceId._id !== selectedProvince.value)
      ) {
        setSelectedMunicipality(null);
        setSelectedElectoralSeat(null);
        setSelectedElectoralLocation(null);
      }
    }
  }, [selectedProvince, currentItem]);

  // Reset electoral seat and electoral location selection when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      // If we're not in edit mode or the municipality has changed, clear electoral seat and electoral location
      if (
        !currentItem ||
        (currentItem.electoralLocationId &&
          typeof currentItem.electoralLocationId === 'object' &&
          currentItem.electoralLocationId.electoralSeatId.municipalityId._id !==
            selectedMunicipality.value)
      ) {
        setSelectedElectoralSeat(null);
        setSelectedElectoralLocation(null);
      }
    }
  }, [selectedMunicipality, currentItem]);

  // Reset electoral location selection when electoral seat changes
  useEffect(() => {
    if (selectedElectoralSeat) {
      // If we're not in edit mode or the electoral seat has changed, clear electoral location
      if (
        !currentItem ||
        (currentItem.electoralLocationId &&
          typeof currentItem.electoralLocationId === 'object' &&
          currentItem.electoralLocationId.electoralSeatId._id !==
            selectedElectoralSeat.value)
      ) {
        setSelectedElectoralLocation(null);
      }
    }
  }, [selectedElectoralSeat, currentItem]);

  const validationSchema = Yup.object({
    tableNumber: Yup.string().required('Este campo es obligatorio'),
    tableCode: Yup.string().required('Este campo es obligatorio'),
    electoralLocationId: Yup.string().required(
      'Debe seleccionar un recinto electoral'
    ),
  });

  const initialValues = {
    tableNumber: currentItem?.tableNumber || '',
    tableCode: currentItem?.tableCode || '',
    active: currentItem?.active ?? true,
    departmentId:
      typeof currentItem?.electoralLocationId === 'object'
        ? currentItem.electoralLocationId.electoralSeatId.municipalityId
            .provinceId.departmentId._id
        : '',
    provinceId:
      typeof currentItem?.electoralLocationId === 'object'
        ? currentItem.electoralLocationId.electoralSeatId.municipalityId
            .provinceId._id
        : '',
    municipalityId:
      typeof currentItem?.electoralLocationId === 'object'
        ? currentItem.electoralLocationId.electoralSeatId.municipalityId._id
        : '',
    electoralSeatId:
      typeof currentItem?.electoralLocationId === 'object'
        ? currentItem.electoralLocationId.electoralSeatId._id
        : '',
    electoralLocationId:
      typeof currentItem?.electoralLocationId === 'object'
        ? currentItem.electoralLocationId._id
        : '',
  };

  const handleSubmit = async (values: {
    tableNumber: string;
    tableCode: string;
    active: boolean;
    departmentId: string;
    provinceId: string;
    municipalityId: string;
    electoralSeatId: string;
    electoralLocationId: string;
  }) => {
    console.log('Submitting values:', values);
    try {
      if (isEditMode && id) {
        // For updates, only send the fields that can be updated
        const updatePayload: UpdateElectoralTableType = {
          tableNumber: values.tableNumber,
          tableCode: values.tableCode,
          active: values.active,
          electoralLocationId: values.electoralLocationId,
        };
        await updateItem({ id, item: updatePayload }).unwrap();
      } else {
        // For creation, send all required fields
        const createPayload: CreateElectoralTableType = {
          tableNumber: values.tableNumber,
          tableCode: values.tableCode,
          active: values.active,
          electoralLocationId: values.electoralLocationId,
        };
        await createItem(createPayload).unwrap();
      }
      setIsModalOpen(true);
      navigate('/mesas');
    } catch (err) {
      console.error('Failed to save electoral table:', err);
    }
  };

  const loadElectoralLocations = async (inputValue: string = '') => {
    try {
      let data: ElectoralLocationByElectoralSeatType[];
      if (selectedElectoralSeat) {
        // If an electoral seat is selected, get electoral locations for that electoral seat
        data = await getElectoralLocationsByElectoralSeatId(
          selectedElectoralSeat.value
        ).unwrap();

        // Filter by search input if provided
        if (inputValue) {
          data = data.filter((item: ElectoralLocationByElectoralSeatType) =>
            item.name.toLowerCase().includes(inputValue.toLowerCase())
          );
        }
      } else {
        // If no electoral seat selected, return empty array
        data = [];
      }

      return data.map((item: ElectoralLocationByElectoralSeatType) => ({
        value: item._id,
        label: item.name,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  };

  const loadElectoralSeats = async (inputValue: string = '') => {
    try {
      let data: ElectoralSeatByMunicipalityType[];
      if (selectedMunicipality) {
        // If a municipality is selected, get electoral seats for that municipality
        data = await getElectoralSeatsByMunicipalityId(
          selectedMunicipality.value
        ).unwrap();

        // Filter by search input if provided
        if (inputValue) {
          data = data.filter((item: ElectoralSeatByMunicipalityType) =>
            item.name.toLowerCase().includes(inputValue.toLowerCase())
          );
        }
      } else {
        // If no municipality selected, return empty array
        data = [];
      }

      return data.map((item: ElectoralSeatByMunicipalityType) => ({
        value: item._id,
        label: item.name,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
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
              {isEditMode ? 'Editar' : 'Registro de'} Mesa Electoral
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? 'actualizar' : 'crear'} la mesa electoral.
              Por favor intente nuevamente.
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
                          // Clear province, municipality, electoral seat and electoral location selection when department changes
                          setSelectedProvince(null);
                          setSelectedMunicipality(null);
                          setSelectedElectoralSeat(null);
                          setSelectedElectoralLocation(null);
                          setFieldValue('provinceId', '');
                          setFieldValue('municipalityId', '');
                          setFieldValue('electoralSeatId', '');
                          setFieldValue('electoralLocationId', '');
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
                          // Clear municipality, electoral seat and electoral location selection when province changes
                          setSelectedMunicipality(null);
                          setSelectedElectoralSeat(null);
                          setSelectedElectoralLocation(null);
                          setFieldValue(
                            'provinceId',
                            selectedOption ? selectedOption.value : ''
                          );
                          setFieldValue('municipalityId', '');
                          setFieldValue('electoralSeatId', '');
                          setFieldValue('electoralLocationId', '');
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
                          setSelectedElectoralSeat(null);
                          setSelectedElectoralLocation(null);
                          setFieldValue(
                            'municipalityId',
                            selectedOption ? selectedOption.value : ''
                          );
                          setFieldValue('electoralSeatId', '');
                          setFieldValue('electoralLocationId', '');
                        }}
                        isDisabled={!selectedProvince}
                        noOptionsMessage={() =>
                          !selectedProvince
                            ? 'Primero selecciona una provincia'
                            : 'No se encontraron municipios'
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="electoralSeatId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Asiento Electoral
                      </label>
                      <AsyncSelect
                        key={selectedMunicipality?.value || 'no-municipality'}
                        name="electoralSeatId"
                        loadOptions={loadElectoralSeats}
                        defaultOptions={selectedMunicipality ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedElectoralSeat}
                        onChange={(selectedOption) => {
                          setSelectedElectoralSeat(selectedOption);
                          setSelectedElectoralLocation(null);
                          setFieldValue(
                            'electoralSeatId',
                            selectedOption ? selectedOption.value : ''
                          );
                          setFieldValue('electoralLocationId', '');
                        }}
                        isDisabled={!selectedMunicipality}
                        noOptionsMessage={() =>
                          !selectedMunicipality
                            ? 'Primero selecciona un municipio'
                            : 'No se encontraron asientos electorales'
                        }
                      />
                      <ErrorMessage
                        name="electoralSeatId"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="electoralLocationId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Recinto Electoral
                      </label>
                      <AsyncSelect
                        key={
                          selectedElectoralSeat?.value || 'no-electoral-seat'
                        }
                        name="electoralLocationId"
                        loadOptions={loadElectoralLocations}
                        defaultOptions={selectedElectoralSeat ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedElectoralLocation}
                        onChange={(selectedOption) => {
                          setSelectedElectoralLocation(selectedOption);
                          setFieldValue(
                            'electoralLocationId',
                            selectedOption ? selectedOption.value : ''
                          );
                        }}
                        isDisabled={!selectedElectoralSeat}
                        noOptionsMessage={() =>
                          !selectedElectoralSeat
                            ? 'Primero selecciona un asiento electoral'
                            : 'No se encontraron recintos electorales'
                        }
                      />
                      <ErrorMessage
                        name="electoralLocationId"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="tableNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Número de Mesa
                      </label>
                      <Field
                        id="tableNumber"
                        name="tableNumber"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="tableNumber"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="tableCode"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Código de Mesa
                      </label>
                      <Field
                        id="tableCode"
                        name="tableCode"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="tableCode"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate('/mesas')}
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

export default ElectoralTableForm;
