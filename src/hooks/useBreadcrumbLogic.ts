import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { RootState } from "../store";
import { selectAuth } from "../store/auth/authSlice";
import { useMyContract } from "../hooks/useMyContract";
import {
    setFilters,
    setFilterIds,
    setQueryParamsResults,
    selectQueryParamsResults,
    ResultsFilters,
    ResultsFilterIds,
} from "../store/resultados/resultadosSlice";
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
import { BREADCRUMB_LEVELS, LevelOption } from "../config/breadcrumbConfig";

export interface PathItem {
    id: string;
    title: string;
    selectedOption?: LevelOption | null;
}

export interface SelectedLevel extends PathItem {
    options: LevelOption[];
    index: number;
}

export interface BreadcrumbOptions {
    departments: LevelOption[];
    provinces: LevelOption[];
    municipalities: LevelOption[];
    electoralSeats: LevelOption[];
    electoralLocations: LevelOption[];
}

const emptyFilters: ResultsFilters = {
    department: "",
    province: "",
    municipality: "",
    electoralLocation: "",
    electoralSeat: "",
};

const emptyFilterIds: ResultsFilterIds = {
    departmentId: "",
    provinceId: "",
    municipalityId: "",
    electoralLocationId: "",
    electoralSeatId: "",
};

export const useBreadcrumbLogic = (autoOpen: boolean = true) => {
    const dispatch = useDispatch();
    const { user } = useSelector(selectAuth);
    const queryParamsResults = useSelector(selectQueryParamsResults);
    const { hasContract, contract } = useMyContract();
    const [searchParams, setSearchParams] = useSearchParams();

    // Lazy Queries
    const [getDepartment] = useLazyGetDepartmentQuery();
    const [getProvince] = useLazyGetProvinceQuery();
    const [getMunicipality] = useLazyGetMunicipalityQuery();
    const [getElectoralSeat] = useLazyGetElectoralSeatQuery();
    const [getElectoralLocation] = useLazyGetElectoralLocationQuery();
    const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
    const [getMunicipalitiesByProvinceId] = useLazyGetMunicipalitiesByProvinceIdQuery();
    const [getElectoralSeatsByMunicipalityId] = useLazyGetElectoralSeatsByMunicipalityIdQuery();
    const [getElectoralLocationsByElectoralSeatId] = useLazyGetElectoralLocationsByElectoralSeatIdQuery();

    const departmentsFromStore = useSelector(selectDepartments);
    const selectedElectionId = useSelector((s: RootState) => s.election.selectedElectionId);

    // Component State
    const [options, setOptions] = useState<BreadcrumbOptions>({
        departments: [],
        provinces: [],
        municipalities: [],
        electoralSeats: [],
        electoralLocations: [],
    });
    const [selectedPath, setSelectedPath] = useState<PathItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<SelectedLevel | null>(null);
    const [showCurrentLevel, setShowCurrentLevel] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<LevelOption[]>([]);

    const role = user?.role || "publico";
    const allowManualPick = role === "SUPERADMIN" || role === "publico" ||
        (role === "MAYOR" && !hasContract && !user?.municipalityId) ||
        (role === "GOVERNOR" && !hasContract && !user?.departmentId);

    const prevElectionIdRef = useRef<string | null>(null);
    const prevUserRef = useRef<any>(undefined);

    // Helper functions
    const buildQueryParams = (path: PathItem[]) => {
        const params = new URLSearchParams();
        path.forEach((item) => {
            if (item.selectedOption?._id) {
                params.set(item.id, item.selectedOption._id);
            }
        });
        return params;
    };

    const applyPathFilters = (path: PathItem[]) => {
        const filters = { ...emptyFilters };
        const filterIds = { ...emptyFilterIds };

        path.forEach((item) => {
            if (item.id in filters) (filters as any)[item.id] = item.selectedOption?.name || "";
            const idKey = item.id + "Id";
            if (idKey in filterIds) (filterIds as any)[idKey] = item.selectedOption?._id || "";
        });

        dispatch(setFilters(filters));
        dispatch(setFilterIds(filterIds));
    };

    const filterOptions = (optionsList: LevelOption[], query: string) => {
        if (query === "") return optionsList;
        const fuse = new Fuse(optionsList, {
            keys: ["name"],
            threshold: 0.4,
            includeScore: true,
            minMatchCharLength: 1,
        });
        return fuse.search(query).map((result) => result.item);
    };

    // Logic functions
    const getOptionsForLevel = async (levelIndex: number, pathOverride?: PathItem[]): Promise<LevelOption[]> => {
        if (levelIndex === 0) return options.departments;
        const currentPath = pathOverride || selectedPath;
        const idParentOption = currentPath[levelIndex - 1]?.selectedOption?._id;
        if (!idParentOption) return [];

        switch (levelIndex) {
            case 1: return await getProvincesByDepartmentId(idParentOption).unwrap();
            case 2: return await getMunicipalitiesByProvinceId(idParentOption).unwrap();
            case 3: return await getElectoralSeatsByMunicipalityId(idParentOption).unwrap();
            case 4: return await getElectoralLocationsByElectoralSeatId(idParentOption).unwrap();
            default: return [];
        }
    };

    const selectLevel = async (levelIndex: number, pathOverride?: PathItem[]) => {
        const item = BREADCRUMB_LEVELS[levelIndex];
        setIsLoadingOptions(true);
        try {
            const levelOptions = await getOptionsForLevel(levelIndex, pathOverride);
            const newSelectedLevel: SelectedLevel = {
                ...item,
                selectedOption: null,
                options: levelOptions,
                index: levelIndex,
            };
            setSelectedLevel(newSelectedLevel);
            setFilteredOptions(levelOptions);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const clearSelectedPath = (opts?: { open?: boolean }) => {
        const open = opts?.open ?? true;
        if (allowManualPick) {
            setSelectedPath([]);
            dispatch(setFilters(emptyFilters));
            dispatch(setFilterIds(emptyFilterIds));
            selectLevel(0);
            setShowCurrentLevel(open);
        } else {
            const userDeptId = user?.departmentId || "";
            const userDeptName = user?.departmentName || "";
            const userMunId = user?.municipalityId || "";
            const userMunName = user?.municipalityName || "";

            if (role === "MAYOR") {
                const deptId = hasContract ? contract?.territory.departmentId : userDeptId;
                const deptName = hasContract ? contract?.territory.departmentName : userDeptName;
                const munId = hasContract ? contract?.territory.municipalityId : userMunId;
                const munName = hasContract ? contract?.territory.municipalityName : userMunName;

                const basePath: PathItem[] = [
                    { id: "department", title: "Departamento", selectedOption: { _id: deptId || "", name: deptName || "" } },
                    { id: "province", title: "Provincia", selectedOption: { _id: "", name: "-" } },
                    { id: "municipality", title: "Municipio", selectedOption: { _id: munId || "", name: munName || "" } },
                ];
                setSelectedPath(basePath);
                applyPathFilters(basePath);
                selectLevel(3, basePath);
                setShowCurrentLevel(open);
            } else if (role === "GOVERNOR") {
                const deptId = hasContract ? contract?.territory.departmentId : userDeptId;
                const deptName = hasContract ? contract?.territory.departmentName : userDeptName;

                const basePath: PathItem[] = [
                    { id: "department", title: "Departamento", selectedOption: { _id: deptId || "", name: deptName || "" } },
                ];
                setSelectedPath(basePath);
                applyPathFilters(basePath);
                selectLevel(1, basePath);
                setShowCurrentLevel(open);
            }
        }
    };

    // Effects
    useEffect(() => {
        if (prevElectionIdRef.current === null) {
            prevElectionIdRef.current = selectedElectionId ?? null;
            return;
        }
        if (prevElectionIdRef.current !== (selectedElectionId ?? null)) {
            prevElectionIdRef.current = selectedElectionId ?? null;
            clearSelectedPath({ open: autoOpen });
        }
    }, [selectedElectionId, autoOpen]);

    useEffect(() => {
        if (prevUserRef.current && !user) {
            setSelectedPath([]);
            dispatch(setFilters(emptyFilters));
            dispatch(setFilterIds(emptyFilterIds));
            dispatch(setQueryParamsResults(""));
            setSelectedLevel(null);
            setShowCurrentLevel(false);
            setIsInitialized(false);
            setSearchParams({});
        }
        prevUserRef.current = user;
    }, [user, dispatch, setSearchParams]);

    useEffect(() => {
        const params = buildQueryParams(selectedPath);
        setSearchParams(params);
    }, [selectedPath, setSearchParams]);

    const searchParamsString = searchParams.toString();
    useEffect(() => {
        if (queryParamsResults !== searchParamsString) {
            dispatch(setQueryParamsResults(searchParamsString));
        }
    }, [searchParamsString, queryParamsResults, dispatch]);

    const prevAllowManualPick = useRef(allowManualPick);
    useEffect(() => {
        if (prevAllowManualPick.current !== allowManualPick) {
            setIsInitialized(false);
            prevAllowManualPick.current = allowManualPick;
        }
    }, [allowManualPick]);

    useEffect(() => {
        if (searchParamsString && !isInitialized && allowManualPick) {
            const paramsSnapshot = new URLSearchParams(searchParamsString);
            if (paramsSnapshot.size > 0 && selectedPath.length === 0) {
                const fetchers = [
                    { key: "department", index: 0, fetch: getDepartment },
                    { key: "province", index: 1, fetch: getProvince },
                    { key: "municipality", index: 2, fetch: getMunicipality },
                    { key: "electoralSeat", index: 3, fetch: getElectoralSeat },
                    { key: "electoralLocation", index: 4, fetch: getElectoralLocation },
                ];

                const promises = fetchers
                    .filter((f) => !!paramsSnapshot.get(f.key))
                    .map((f) => {
                        const id = paramsSnapshot.get(f.key);
                        return f.fetch(id!).unwrap().then((data: any) => ({
                            index: f.index,
                            key: f.key,
                            data: data,
                        }));
                    });

                if (promises.length > 0) {
                    Promise.allSettled(promises).then((results) => {
                        const map = new Map<number, PathItem>();
                        results.forEach((r) => {
                            if (r.status === "fulfilled" && r.value?.data?._id) {
                                const level = BREADCRUMB_LEVELS[r.value.index];
                                map.set(r.value.index, {
                                    ...level,
                                    selectedOption: { _id: r.value.data._id, name: r.value.data.name },
                                });
                            }
                        });

                        const newPath: PathItem[] = [];
                        for (let i = 0; i < BREADCRUMB_LEVELS.length; i++) {
                            const item = map.get(i);
                            if (item) newPath.push(item);
                        }

                        const hasDept = map.get(0);
                        const hasProv = map.get(1);
                        const hasMun = map.get(2);

                        if (hasDept && hasMun && !hasProv) {
                            const forced: PathItem[] = [hasDept, { ...BREADCRUMB_LEVELS[1], selectedOption: { _id: "", name: "-" } }, hasMun];
                            setSelectedPath(forced);
                            applyPathFilters(forced);
                            selectLevel(3, forced);
                            if (autoOpen) setShowCurrentLevel(true);
                        } else {
                            setSelectedPath(newPath);
                            applyPathFilters(newPath);
                            const nextIndex = newPath.length;
                            if (nextIndex < BREADCRUMB_LEVELS.length) {
                                selectLevel(nextIndex, newPath);
                                if (autoOpen) setShowCurrentLevel(true);
                            } else {
                                setShowCurrentLevel(false);
                            }
                        }
                    });
                }
                setIsInitialized(true);
            }
        } else if (!isInitialized) {
            if (allowManualPick) {
                selectLevel(0);
                if (autoOpen) setShowCurrentLevel(true);
            } else {
                // Forzar la inicializaci├│n de la ruta restringida
                clearSelectedPath({ open: autoOpen });
            }
            setIsInitialized(true);
        }
    }, [searchParamsString, queryParamsResults, allowManualPick, isInitialized, selectedPath.length]);

    useEffect(() => {
        if (departmentsFromStore && departmentsFromStore.length > 0) {
            const mapped = departmentsFromStore.map((dept) => ({ _id: dept._id, name: dept.name }));
            setOptions((prev) => ({ ...prev, departments: mapped }));
            if (selectedLevel?.index === 0) {
                setSelectedLevel(prev => prev ? { ...prev, options: mapped } : null);
                setFilteredOptions(mapped);
            }
        }
    }, [departmentsFromStore, selectedLevel?.index]);

    // Handlers
    const handleOptionClick = (optionIndex: number, optionClicked: LevelOption) => {
        const newPath: PathItem[] = selectedPath.slice(0, optionIndex);
        const newItem = { ...BREADCRUMB_LEVELS[optionIndex], selectedOption: optionClicked };
        newPath.push(newItem);
        applyPathFilters(newPath);
        setSelectedPath(newPath);

        if (optionIndex < BREADCRUMB_LEVELS.length - 1) {
            selectLevel(optionIndex + 1, newPath);
        } else {
            setShowCurrentLevel(false);
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        const userBaseLevel = role === "MAYOR" ? 2 : role === "GOVERNOR" ? 0 : -1;
        let pathOverride: PathItem[] | undefined;
        const canTrimToIndex = index < selectedPath.length - 1 && (allowManualPick || index >= userBaseLevel);

        if (canTrimToIndex) {
            const trimmedPath = selectedPath.slice(0, index + 1);
            setSelectedPath(trimmedPath);
            applyPathFilters(trimmedPath);
            pathOverride = trimmedPath;
        }

        const isClickingBaseLevel = !allowManualPick && index === userBaseLevel;
        const targetLevelIndex = isClickingBaseLevel ? index + 1 : index;

        if (selectedLevel?.index === targetLevelIndex && showCurrentLevel) {
            setShowCurrentLevel(false);
        } else {
            setShowCurrentLevel(true);
            selectLevel(targetLevelIndex, pathOverride);
        }
    };

    const handleSearch = (query: string) => {
        const internalFilteredOptions = filterOptions(selectedLevel?.options || [], query);
        setFilteredOptions(internalFilteredOptions);
    };

    return {
        user,
        role,
        allowManualPick,
        selectedPath,
        selectedLevel,
        showCurrentLevel,
        isLoadingOptions,
        filteredOptions,
        setShowCurrentLevel,
        handleOptionClick,
        handleBreadcrumbClick,
        clearSelectedPath,
        resetPath: () => clearSelectedPath(),
        handleSearch,
    };
};
