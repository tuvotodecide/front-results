import React, { useState, useEffect } from "react";
import styles from "./Breadcrumb.module.css";
import { ChevronRight } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { selectDepartments } from "../store/departments/departmentsSlice";
import { useLazyGetDepartmentQuery } from "../store/departments/departmentsEndpoints";
import {
  useLazyGetProvincesByDepartmentIdQuery,
  useLazyGetProvinceQuery,
} from "../store/provinces/provincesEndpoints";
import {
  useLazyGetMunicipalitiesByProvinceIdQuery,
  useLazyGetMunicipalityQuery,
} from "../store/municipalities/municipalitiesEndpoints";
import {
  useLazyGetElectoralSeatsByMunicipalityIdQuery,
  useLazyGetElectoralSeatQuery,
} from "../store/electoralSeats/electoralSeatsEndpoints";
import {
  useLazyGetElectoralLocationsByElectoralSeatIdQuery,
  useLazyGetElectoralLocationQuery,
} from "../store/electoralLocations/electoralLocationsEndpoints";
import SimpleSearchBar from "./SimpleSearchBar";
import {
  setFilters,
  setFilterIds,
  setQueryParamsResults,
} from "../store/resultados/resultadosSlice";
import ElectionSelector from "./ElectionSelector";

interface LevelOption {
  _id: string;
  name: string;
}

interface breadcrumbOptions {
  departments: LevelOption[];
  provinces: LevelOption[];
  municipalities: LevelOption[];
  electoralSeats: LevelOption[];
  electoralLocations: LevelOption[];
}

interface PathItem2 {
  id: string;
  title: string;
  selectedOption?: LevelOption | null;
}

interface SelectedLevel extends PathItem2 {
  options: LevelOption[];
  index: number;
}

const breadcrumbLevels = [
  {
    id: "department",
    title: "Departamento",
  },
  {
    id: "province",
    title: "Provincia",
  },
  {
    id: "municipality",
    title: "Municipio",
  },
  {
    id: "electoralSeat",
    title: "Asiento Electoral",
  },
  {
    id: "electoralLocation",
    title: "Recinto Electoral",
  },
];
const Breadcrumb = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [getDepartment] = useLazyGetDepartmentQuery();
  const [getProvince] = useLazyGetProvinceQuery();
  const [getMunicipality] = useLazyGetMunicipalityQuery();
  const [getElectoralSeat] = useLazyGetElectoralSeatQuery();
  const [getElectoralLocation] = useLazyGetElectoralLocationQuery();
  const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
  const [getMunicipalitiesByProvinceId] =
    useLazyGetMunicipalitiesByProvinceIdQuery();
  const [getElectoralSeatsByMunicipalityId] =
    useLazyGetElectoralSeatsByMunicipalityIdQuery();
  const [getElectoralLocationsByElectoralSeatId] =
    useLazyGetElectoralLocationsByElectoralSeatIdQuery();

  const departments = useSelector(selectDepartments);
  const [options, setOptions] = useState<breadcrumbOptions>({
    departments: [],
    provinces: [],
    municipalities: [],
    electoralSeats: [],
    electoralLocations: [],
  });
  const [selectedPath2, setSelectedPath2] = useState<PathItem2[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<SelectedLevel | null>(
    null
  );
  // State to control visibility of the current level selection section
  const [showCurrentLevel, setShowCurrentLevel] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<LevelOption[]>([]);

  // update to useMemo to be a function that returns filtered options
  const filterOptions = (options: LevelOption[], searchTerm: string) => {
    if (searchTerm === "") return options;
    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(options, {
      keys: ["name"],
      threshold: 0.4, // Lower threshold = more strict matching (0.0 = exact match, 1.0 = match anything)
      includeScore: true,
      minMatchCharLength: 1,
    });
    // Perform fuzzy search and return the items (not the Fuse result objects)
    return fuse.search(searchTerm).map((result) => result.item);
  };
  // const filteredOptions = useMemo(() => {
  //   const options = selectedLevel?.options || [];

  //   if (searchTerm === '') return options;

  //   // Configure Fuse.js for fuzzy search
  //   const fuse = new Fuse(options, {
  //     keys: ['name'],
  //     threshold: 0.4, // Lower threshold = more strict matching (0.0 = exact match, 1.0 = match anything)
  //     includeScore: true,
  //     minMatchCharLength: 1,
  //   });

  //   // Perform fuzzy search and return the items (not the Fuse result objects)
  //   return fuse.search(searchTerm).map((result) => result.item);
  // }, [selectedLevel, searchTerm]);

  // Function to build query parameters from selectedPath2
  const buildQueryParams = (path: PathItem2[]) => {
    const params = new URLSearchParams();
    path.forEach((item) => {
      if (item.selectedOption?._id) {
        params.set(item.id, item.selectedOption._id);
      }
    });
    return params;
  };

  // Update URL whenever selectedPath2 changes
  useEffect(() => {
    const params = buildQueryParams(selectedPath2);
    setSearchParams(params);
  }, [selectedPath2, setSearchParams]);

  // Initialize from URL parameters only once on mount
  useEffect(() => {
    dispatch(setQueryParamsResults(searchParams.toString()));
    if (!isInitialized && searchParams.size > 0 && selectedPath2.length === 0) {
      // console.log(
      //   '%cInitializing from URL params:',
      //   'color: blue; font-size: 16px; font-weight: bold;',
      //   Object.fromEntries(searchParams.entries())
      // );
      const {
        department: departmentId,
        province: provinceId,
        municipality: municipalityId,
        electoralSeat: electoralSeatId,
        electoralLocation: electoralLocationId,
      } = Object.fromEntries(searchParams.entries());

      const promises = [];
      if (departmentId) {
        promises.push(getDepartment(departmentId));
        if (provinceId) {
          promises.push(getProvince(provinceId));
          if (municipalityId) {
            promises.push(getMunicipality(municipalityId));
            if (electoralSeatId) {
              promises.push(getElectoralSeat(electoralSeatId));
              if (electoralLocationId) {
                promises.push(getElectoralLocation(electoralLocationId));
              }
            }
          }
        }
      }

      if (promises.length > 0) {
        Promise.allSettled(promises).then((results) => {
          const newPath: PathItem2[] = [];
          for (let index = 0; index < results.length; index++) {
            const result = results[index];
            if (result.status === "fulfilled" && result.value.data) {
              const level = breadcrumbLevels[index];
              const { _id, name } = result.value.data;
              newPath.push({
                ...level,
                selectedOption: {
                  _id: _id,
                  name: name,
                },
              });
            } else {
              break;
            }
          }
          setSelectedPath2(newPath);
          const filters = newPath.reduce((acc, item) => {
            acc[item.id] = item.selectedOption?.name || "";
            return acc;
          }, {} as Record<string, string>);
          const filterIds = newPath.reduce((acc, item) => {
            acc[item.id + "Id"] = item.selectedOption?._id || "";
            return acc;
          }, {} as Record<string, string>);
          dispatch(setFilters(filters));
          dispatch(setFilterIds(filterIds));
        });
      }
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  useEffect(() => {
    if (departments && departments.length > 0) {
      setOptions((prev) => ({
        ...prev,
        departments: departments.map((dept) => ({
          _id: dept._id,
          name: dept.name,
        })),
      }));
    }
  }, [departments]);

  const handleOptionClick = (
    optionIndex: number,
    optionClicked: LevelOption
  ) => {
    // Then update any item that matches the optionId with the clicked option
    const newPath: PathItem2[] = selectedPath2.slice(0, optionIndex);
    const baseNewItem = breadcrumbLevels[optionIndex];

    const newItem = {
      ...baseNewItem,
      selectedOption: optionClicked,
    };
    newPath.push(newItem);
    const filters = newPath.reduce((acc, item) => {
      acc[item.id] = item.selectedOption?.name || "";
      return acc;
    }, {} as Record<string, string>);
    const filterIds = newPath.reduce((acc, item) => {
      acc[item.id + "Id"] = item.selectedOption?._id || "";
      return acc;
    }, {} as Record<string, string>);
    dispatch(setFilters(filters));
    dispatch(setFilterIds(filterIds));

    setSelectedPath2(newPath);

    const reachedEnd = optionIndex >= breadcrumbLevels.length - 1;
    if (!reachedEnd) {
      selectLevel(optionIndex + 1, newPath);
    } else {
      setShowCurrentLevel(false);
    }

    // setSearchParams(buildQueryParams(newPath));
  };

  const selectLevel = async (
    levelIndex: number,
    pathOverride?: PathItem2[]
  ) => {
    const item = breadcrumbLevels[levelIndex];
    setIsLoadingOptions(true);

    try {
      const levelOptions = await getOptionsForLevel(levelIndex, pathOverride);
      const newSelectedLevel: SelectedLevel = {
        ...item,
        selectedOption: null, // Reset selected option for the new level
        options: levelOptions,
        index: levelIndex,
      };
      setSelectedLevel(newSelectedLevel);
      setFilteredOptions(levelOptions);
    } finally {
      setIsLoadingOptions(false);
    }
  };
  const getOptionsForLevel = async (
    levelIndex: number,
    pathOverride?: PathItem2[]
  ): Promise<LevelOption[]> => {
    if (levelIndex === 0) {
      return options.departments;
    }
    const currentPath = pathOverride || selectedPath2;

    const idParentOption = currentPath[levelIndex - 1]?.selectedOption?._id;
    // console.log(
    //   '%cParent option ID:',
    //   'color: purple; font-size: 16px; font-weight: bold;',
    //   idParentOption
    // );
    if (!idParentOption) {
      return [];
    }
    switch (levelIndex) {
      case 0:
        // GET departments
        // console.log(
        //   '%cDepartments fetched:',
        //   'color: green; font-size: 16px; font-weight: bold;',
        //   options.departments
        // );
        return options.departments;
      case 1:
        const resp = await getProvincesByDepartmentId(idParentOption).unwrap();
        // console.log(
        //   '%cProvinces fetched for department222222:',
        //   'color: green; font-size: 16px; font-weight: bold;',
        //   resp
        // );
        // GET provinces based on selected department
        return resp;
      case 2:
        const municipalitiesResp = await getMunicipalitiesByProvinceId(
          idParentOption
        ).unwrap();
        // console.log(
        //   '%cMunicipalities fetched for province:',
        //   'color: green; font-size: 16px; font-weight: bold;',
        //   municipalitiesResp
        // );
        return municipalitiesResp;
      case 3:
        const electoralSeatsResp = await getElectoralSeatsByMunicipalityId(
          idParentOption
        ).unwrap();
        // console.log(
        //   '%cElectoral seats fetched for municipality:',
        //   'color: green; font-size: 16px; font-weight: bold;',
        //   electoralSeatsResp
        // );
        return electoralSeatsResp;
      case 4:
        const electoralLocationsResp =
          await getElectoralLocationsByElectoralSeatId(idParentOption).unwrap();
        // console.log(
        //   '%cElectoral locations fetched for electoral seat:',
        //   'color: green; font-size: 16px; font-weight: bold;',
        //   electoralLocationsResp
        // );
        return electoralLocationsResp;
      default:
        return [];
    }
  };

  const handleBreadcrumbClick = async (pathItem: PathItem2, index: number) => {
    if (selectedLevel?.id !== pathItem.id && !showCurrentLevel) {
      setShowCurrentLevel(true);
    } else if (selectedLevel?.id === pathItem.id) {
      setShowCurrentLevel(!showCurrentLevel);
    }

    setIsLoadingOptions(true);

    try {
      const levelOptions = await getOptionsForLevel(index);
      setSelectedLevel({
        ...pathItem,
        options: levelOptions,
        index: index,
      });
      setFilteredOptions(levelOptions);
    } finally {
      setIsLoadingOptions(false);
    }
  };
  const resetPath = () => {
    //setSelectedPath2([]);
    selectLevel(0);

    if (selectedLevel?.index === 0) {
      setShowCurrentLevel((prev) => !prev);
    } else {
      setShowCurrentLevel(true);
    }
    // setSearchParams({});
  };

  const clearSelectedPath = () => {
    setSelectedPath2([]);
    setShowCurrentLevel(false);
    setSelectedLevel(null);
    setFilteredOptions([]);
    dispatch(setFilters({}));
    dispatch(setFilterIds({}));
  };
  // Show the next breadcrumb level form when "ver más" is clicked
  // const handleShowNextLevel = async () => {
  //   setShowCurrentLevel(true);
  // };

  const handleSearch = (query: string) => {
    const internalFilteredOptions = filterOptions(
      selectedLevel?.options || [],
      query
    );
    setFilteredOptions(internalFilteredOptions);
  };

  return (
    <div className="mx-auto pb-6">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 rounded-lg flex items-center justify-between">
        <nav className="flex items-center gap-x-1.5 text-sm w-full flex-nowrap overflow-x-auto">
          <button
            onClick={() => resetPath()}
            className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100"
          >
            <div className="text-xs text-gray-500 font-medium mb-1">País</div>
            <div className="flex items-center">
              <span className="font-medium">Bolivia</span>
            </div>
          </button>
          {selectedPath2.length > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
          )}
          {selectedPath2.map((pathItem, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => handleBreadcrumbClick(pathItem, index)}
                className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100 "
              >
                <div className="text-xs text-gray-500 font-medium mb-1">
                  {pathItem.title}
                </div>
                <div className="font-medium">
                  {pathItem?.selectedOption?.name}
                </div>
              </button>
              {index < selectedPath2.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              )}
            </React.Fragment>
          ))}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors duration-200 shrink-0"
              onClick={handleShowNextLevel}
              disabled={selectedPath2.length >= breadcrumbLevels.length}
            >
              Ver más
            </button> */}
            <ElectionSelector />
            <button
              className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={clearSelectedPath}
            >
              Resetear
            </button>
          </div>
        </nav>
        {/* Ver más button */}
      </div>

      {/* Current Level Selection (Closable) */}
      {selectedLevel && showCurrentLevel && (
        <div className="border border-gray-200 rounded-lg p-6 relative mt-6">
          {/* Close button, floating on top right */}
          <button
            className="absolute -top-3 -right-3 p-2 rounded-full bg-gray-50 hover:bg-gray-200 text-gray-400 hover:text-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
            style={{ zIndex: 20 }}
            aria-label="Cerrar"
            onClick={() => setShowCurrentLevel(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M4 20L20 4M4 4L20 20"
              />
            </svg>
          </button>
          <div
            className={`flex items-center mb-4 justify-between flex-wrap ${styles["suggestions-title-container"]}`}
          >
            <SimpleSearchBar
              className={styles["search-bar"]}
              onSearch={handleSearch}
            />
            <h2
              className={`text-lg font-semibold text-gray-800 ${styles["suggestions-title-text"]}`}
            >
              Seleccione {selectedLevel?.title}
            </h2>
          </div>
          <div className="relative">
            {isLoadingOptions && (
              <div
                className={`flex items-center justify-center py-12 ${styles["animate-fadeIn"]}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 font-medium">
                    Cargando opciones...
                  </span>
                </div>
              </div>
            )}

            {!isLoadingOptions && selectedLevel?.options && (
              <div className={styles["animate-fadeInUp"]}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleOptionClick(selectedLevel.index, option)
                      }
                      className={`p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${styles["animate-fadeInStagger"]}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="font-medium text-gray-800">
                        {option.name}
                      </div>
                      {/* <div className="text-sm text-gray-500 mt-1">
                        {selectedLevel.title}
                      </div> */}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Breadcrumb;
