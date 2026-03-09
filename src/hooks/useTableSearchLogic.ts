import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLazyGetElectoralTablesByElectoralLocationIdQuery } from "../store/electoralTables/electoralTablesEndpoints";
import { selectFilters } from "../store/resultados/resultadosSlice";
import { useCountedBallots } from "../hooks/useCountedBallots";
import useElectionConfig from "../hooks/useElectionConfig";
import useElectionId from "../hooks/useElectionId";
import { ElectoralTableType } from "../types";

export const useTableSearchLogic = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const electionId = useElectionId();
    const filters = useSelector(selectFilters);
    const [getTablesByLocationId] = useLazyGetElectoralTablesByElectoralLocationIdQuery();

    const [filteredTables, setFilteredTables] = useState<ElectoralTableType[]>([]);
    const [mesaQuery, setMesaQuery] = useState("");
    const [showAllFilteredTables, setShowAllFilteredTables] = useState(false);

    const filteredMesas = (filteredTables || []).filter(t =>
        !mesaQuery ||
        t.tableNumber?.toString().includes(mesaQuery) ||
        t.tableCode?.toLowerCase().includes(mesaQuery.toLowerCase())
    );

    const {
        election,
        hasActiveConfig,
        isVotingPeriod: isPreliminaryPhase,
        isResultsPeriod: isFinalPhase,
        isAutoRefreshWindow,
    } = useElectionConfig();

    const {
        tables: countedTables,
        isLoading: countedBallotsLoading,
        isError: countedBallotsError,
        total: countedBallotsTotal,
    } = useCountedBallots({
        electionType: election?.type ?? "presidential",
        electionId: electionId ?? undefined,
        department: filters.department,
        province: filters.province,
        municipality: filters.municipality,
        page: 1,
        limit: 20,
        isLiveMode: isPreliminaryPhase && !isFinalPhase,
        enablePolling: isAutoRefreshWindow,
        skip: !hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase),
    });

    useEffect(() => {
        const electoralLocationId = searchParams.get("electoralLocation");
        if (electoralLocationId) {
            getTablesByLocationId(electoralLocationId)
                .unwrap()
                .then((data) => setFilteredTables(data))
                .catch(() => setFilteredTables([]));
        } else {
            setFilteredTables([]);
        }
    }, [searchParams, getTablesByLocationId]);

    const handleSearch = (searchTerm: string) => {
        if (!searchTerm) return;
        navigate(`/resultados/mesa/${searchTerm}`);
    };

    return {
        filters,
        election,
        hasActiveConfig,
        isPreliminaryPhase,
        isFinalPhase,
        filteredTables,
        filteredMesas,
        setMesaQuery,
        showAllFilteredTables,
        setShowAllFilteredTables,
        countedTables,
        countedBallotsLoading,
        countedBallotsError,
        countedBallotsTotal,
        handleSearch,
    };
};
