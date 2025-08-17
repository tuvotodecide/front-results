import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  useCreateElectoralLocationMutation,
  useGetElectoralLocationQuery,
  useUpdateElectoralLocationMutation,
} from "../../store/electoralLocations/electoralLocationsEndpoints";
import { useLazyGetElectoralSeatsByMunicipalityIdQuery } from "../../store/electoralSeats/electoralSeatsEndpoints";
import {
  useLazyGetMunicipalitiesQuery,
  useLazyGetMunicipalitiesByProvinceIdQuery,
} from "../../store/municipalities/municipalitiesEndpoints";
import {
  useLazyGetProvincesQuery,
  useLazyGetProvincesByDepartmentIdQuery,
} from "../../store/provinces/provincesEndpoints";
import { useLazyGetDepartmentsQuery } from "../../store/departments/departmentsEndpoints";
import { useNavigate, useParams } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import Modal from "../../components/Modal";
import BackButton from "../../components/BackButton";
import { useState, useEffect } from "react";
import {
  ProvincesType,
  DepartmentType,
  CreateElectoralLocationType,
  UpdateElectoralLocationType,
  ElectoralSeatByMunicipalityType,
} from "../../types";
import AsyncSelect from "react-select/async";

const ElectoralLocationForm: React.FC = () => {
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
  const [getProvinces] = useLazyGetProvincesQuery();
  const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
  const [getDepartments] = useLazyGetDepartmentsQuery();
  const [getMunicipalities] = useLazyGetMunicipalitiesQuery();
  const [getMunicipalitiesByProvinceId] =
    useLazyGetMunicipalitiesByProvinceIdQuery();
  const [getElectoralSeatsByMunicipalityId] =
    useLazyGetElectoralSeatsByMunicipalityIdQuery();

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreateElectoralLocationMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdateElectoralLocationMutation();
  const { data: currentItem, isLoading: isLoadingitem } =
    useGetElectoralLocationQuery(id!, { skip: !id });

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingitem;

  // Initialize selected province, department, municipality and electoral seat when currentItem loads
  useEffect(() => {
    if (
      currentItem?.electoralSeatId &&
      typeof currentItem.electoralSeatId === "object"
    ) {
      // Set electoral seat
      setSelectedElectoralSeat({
        value: currentItem.electoralSeatId._id,
        label: currentItem.electoralSeatId.name,
      });

      // Set municipality
      if (currentItem.electoralSeatId.municipalityId) {
        setSelectedMunicipality({
          value: currentItem.electoralSeatId.municipalityId._id,
          label: currentItem.electoralSeatId.municipalityId.name,
        });

        // Set province
        if (currentItem.electoralSeatId.municipalityId.provinceId) {
          setSelectedProvince({
            value: currentItem.electoralSeatId.municipalityId.provinceId._id,
            label: currentItem.electoralSeatId.municipalityId.provinceId.name,
          });

          // Set the department if it exists in the province data
          if (
            currentItem.electoralSeatId.municipalityId.provinceId.departmentId
          ) {
            setSelectedDepartment({
              value:
                currentItem.electoralSeatId.municipalityId.provinceId
                  .departmentId._id,
              label:
                currentItem.electoralSeatId.municipalityId.provinceId
                  .departmentId.name,
            });
          }
        }
      }
    }
  }, [currentItem]);

  // Reset province, municipality and electoral seat selection when department changes
  useEffect(() => {
    if (selectedDepartment) {
      // If we're not in edit mode or the department has changed, clear province, municipality and electoral seat
      if (
        !currentItem ||
        (currentItem.electoralSeatId &&
          typeof currentItem.electoralSeatId === "object" &&
          currentItem.electoralSeatId.municipalityId.provinceId.departmentId
            ._id !== selectedDepartment.value)
      ) {
        setSelectedProvince(null);
        setSelectedMunicipality(null);
        setSelectedElectoralSeat(null);
      }
    }
  }, [selectedDepartment, currentItem]);

  // Reset municipality and electoral seat selection when province changes
  useEffect(() => {
    if (selectedProvince) {
      // If we're not in edit mode or the province has changed, clear municipality and electoral seat
      if (
        !currentItem ||
        (currentItem.electoralSeatId &&
          typeof currentItem.electoralSeatId === "object" &&
          currentItem.electoralSeatId.municipalityId.provinceId._id !==
            selectedProvince.value)
      ) {
        setSelectedMunicipality(null);
        setSelectedElectoralSeat(null);
      }
    }
  }, [selectedProvince, currentItem]);

  // Reset electoral seat selection when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      // If we're not in edit mode or the municipality has changed, clear electoral seat
      if (
        !currentItem ||
        (currentItem.electoralSeatId &&
          typeof currentItem.electoralSeatId === "object" &&
          currentItem.electoralSeatId.municipalityId._id !==
            selectedMunicipality.value)
      ) {
        setSelectedElectoralSeat(null);
      }
    }
  }, [selectedMunicipality, currentItem]);
  const notZeroMessage = "El valor no puede ser 0";

  const validationSchema = Yup.object({
    name: Yup.string().required("Este campo es obligatorio"),
    fid: Yup.string().required("Este campo es obligatorio"),
    address: Yup.string().required("Este campo es obligatorio"),
    code: Yup.string().required("Este campo es obligatorio"),
    district: Yup.string().required("Este campo es obligatorio"),
    zone: Yup.string().required("Este campo es obligatorio"),
    electoralSeatId: Yup.string().required(
      "Debe seleccionar un asiento electoral"
    ),
    latitude: Yup.number()
      .typeError("Debe ser un número válido")
      .required("Este campo es obligatorio")
      .min(-90, "La latitud debe estar entre -90 y 90")
      .max(90, "La latitud debe estar entre -90 y 90")
      .test("not-zero", notZeroMessage, (value) => value !== 0),
    longitude: Yup.number()
      .typeError("Debe ser un número válido")
      .required("Este campo es obligatorio")
      .min(-180, "La longitud debe estar entre -180 y 180")
      .max(180, "La longitud debe estar entre -180 y 180")
      .test("not-zero", notZeroMessage, (value) => value !== 0),
  });

  const initialValues = {
    name: currentItem?.name || "",
    fid: currentItem?.fid || "",
    address: currentItem?.address || "",
    code: currentItem?.code || "",
    district: currentItem?.district || "",
    zone: currentItem?.zone || "",
    active: currentItem?.active ?? true,
    latitude: currentItem?.coordinates?.latitude || 0,
    longitude: currentItem?.coordinates?.longitude || 0,
    departmentId:
      typeof currentItem?.electoralSeatId === "object"
        ? currentItem.electoralSeatId.municipalityId.provinceId.departmentId._id
        : "",
    provinceId:
      typeof currentItem?.electoralSeatId === "object"
        ? currentItem.electoralSeatId.municipalityId.provinceId._id
        : "",
    municipalityId:
      typeof currentItem?.electoralSeatId === "object"
        ? currentItem.electoralSeatId.municipalityId._id
        : "",
    electoralSeatId:
      typeof currentItem?.electoralSeatId === "object"
        ? currentItem.electoralSeatId._id
        : "",
  };

  const handleSubmit = async (values: {
    name: string;
    fid: string;
    address: string;
    code: string;
    district: string;
    zone: string;
    active: boolean;
    latitude: number;
    longitude: number;
    departmentId: string;
    provinceId: string;
    municipalityId: string;
    electoralSeatId: string;
  }) => {
    console.log("Submitting values:", values);
    try {
      if (isEditMode && id) {
        // For updates, only send the fields that can be updated
        const updatePayload: UpdateElectoralLocationType = {
          name: values.name,
          fid: values.fid,
          address: values.address,
          code: values.code,
          district: values.district,
          zone: values.zone,
          active: values.active,
          electoralSeatId: values.electoralSeatId,
          coordinates: {
            latitude: Number(values.latitude),
            longitude: Number(values.longitude),
          },
        };
        await updateItem({ id, item: updatePayload }).unwrap();
      } else {
        // For creation, send all required fields
        const createPayload: CreateElectoralLocationType = {
          name: values.name,
          fid: values.fid,
          address: values.address,
          code: values.code,
          district: values.district,
          zone: values.zone,
          active: values.active,
          electoralSeatId: values.electoralSeatId,
          coordinates: {
            latitude: Number(values.latitude),
            longitude: Number(values.longitude),
          },
          circunscripcion: {
            number: 4,
            type: "Especial",
            name: "Especial Indígena-Tarija",
          }, // Default circumscription
        };
        console.log("Creating values:", createPayload);
        await createItem(createPayload).unwrap();
      }

      setIsModalOpen(true);
      navigate("/recintos-electorales");
    } catch (err) {
      console.error("Failed to save electoral location:", err);
    }
  };

  const loadElectoralSeats = async (inputValue: string = "") => {
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
      console.error("Search failed:", error);
      return [];
    }
  };

  const loadMunicipalities = async (inputValue: string = "") => {
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
      console.error("Search failed:", error);
      return [];
    }
  };

  const loadProvinces = async (inputValue: string = "") => {
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
      console.error("Search failed:", error);
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
      console.error("Search failed:", error);
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
              {isEditMode ? "Editar" : "Registro de"} Recinto Electoral
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? "actualizar" : "crear"} el recinto
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
                          // Clear province, municipality and electoral seat selection when department changes
                          setSelectedProvince(null);
                          setSelectedMunicipality(null);
                          setSelectedElectoralSeat(null);
                          setFieldValue("provinceId", "");
                          setFieldValue("municipalityId", "");
                          setFieldValue("electoralSeatId", "");
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
                        key={selectedDepartment?.value || "no-department"}
                        name="provinceId"
                        loadOptions={loadProvinces}
                        defaultOptions={selectedDepartment ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedProvince}
                        onChange={(selectedOption) => {
                          setSelectedProvince(selectedOption);
                          // Clear municipality and electoral seat selection when province changes
                          setSelectedMunicipality(null);
                          setSelectedElectoralSeat(null);
                          setFieldValue(
                            "provinceId",
                            selectedOption ? selectedOption.value : ""
                          );
                          setFieldValue("municipalityId", "");
                          setFieldValue("electoralSeatId", "");
                        }}
                        isDisabled={!selectedDepartment}
                        noOptionsMessage={() =>
                          !selectedDepartment
                            ? "Primero selecciona un departamento"
                            : "No se encontraron provincias"
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
                        key={selectedProvince?.value || "no-province"}
                        name="municipalityId"
                        loadOptions={loadMunicipalities}
                        defaultOptions={selectedProvince ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedMunicipality}
                        onChange={(selectedOption) => {
                          setSelectedMunicipality(selectedOption);
                          setSelectedElectoralSeat(null);
                          setFieldValue(
                            "municipalityId",
                            selectedOption ? selectedOption.value : ""
                          );
                          setFieldValue("electoralSeatId", "");
                        }}
                        isDisabled={!selectedProvince}
                        noOptionsMessage={() =>
                          !selectedProvince
                            ? "Primero selecciona una provincia"
                            : "No se encontraron municipios"
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
                        key={selectedMunicipality?.value || "no-municipality"}
                        name="electoralSeatId"
                        loadOptions={loadElectoralSeats}
                        defaultOptions={selectedMunicipality ? true : false}
                        placeholder="Buscar..."
                        isClearable
                        value={selectedElectoralSeat}
                        onChange={(selectedOption) => {
                          setSelectedElectoralSeat(selectedOption);
                          setFieldValue(
                            "electoralSeatId",
                            selectedOption ? selectedOption.value : ""
                          );
                        }}
                        isDisabled={!selectedMunicipality}
                        noOptionsMessage={() =>
                          !selectedMunicipality
                            ? "Primero selecciona un municipio"
                            : "No se encontraron asientos electorales"
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
                        htmlFor="fid"
                        className="block text-sm font-medium text-gray-700"
                      >
                        FID
                      </label>
                      <Field
                        id="fid"
                        name="fid"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="fid"
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
                        Nombre del Recinto Electoral
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
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="district"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Distrito
                      </label>
                      <Field
                        id="district"
                        name="district"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="district"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="zone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Zona
                      </label>
                      <Field
                        id="zone"
                        name="zone"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="zone"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="latitude"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Latitud
                      </label>
                      <Field
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        placeholder="-21.357303"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="latitude"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="longitude"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Longitud
                      </label>
                      <Field
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        placeholder="-63.87766"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="longitude"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate("/recintos-electorales")}
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

export default ElectoralLocationForm;
