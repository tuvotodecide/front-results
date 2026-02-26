import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
    useGetElectoralTableByTableCodeQuery,
    useLazyGetElectoralTablesByElectoralLocationIdQuery,
} from "../store/electoralTables/electoralTablesEndpoints";
import {
    useLazyGetLiveResultsByLocationQuery,
    useLazyGetResultsByLocationQuery,
} from "../store/resultados/resultadosEndpoints";
import { useLazyGetBallotByTableCodeQuery } from "../store/ballots/ballotsEndpoints";
import {
    useGetAttestationCasesByTableCodeQuery,
    useGetMostSupportedBallotByTableCodeQuery,
} from "../store/attestations/attestationsEndpoints";
import useElectionConfig from "../hooks/useElectionConfig";
import useElectionId from "../hooks/useElectionId";
import useAutoRefreshTick from "../hooks/useAutoRefreshTick";
import { FIVE_MINUTES_MS } from "../utils/electionAutoRefreshWindow";
import { getPartyColor } from "../pages/Resultados/partyColors";
import { ElectoralTableType, BallotType } from "../types";
import { setCurrentTable } from "../store/resultados/resultadosSlice";
import { getResultsLabels } from "../pages/Resultados/resultsLabels";

export const useTableDetailsLogic = (tableCode: string | undefined) => {
    const electionId = useElectionId();
    const dispatch = useDispatch();

    const [getResultsByLocation] = useLazyGetResultsByLocationQuery();
    const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
    const [getBallotsByTableCode] = useLazyGetBallotByTableCodeQuery();
    const [getTablesByLocationId] = useLazyGetElectoralTablesByElectoralLocationIdQuery();

    const [presidentialData, setPresidentialData] = useState<Array<{ name: string; value: number; color: string }>>([]);
    const [deputiesData, setDeputiesData] = useState<Array<{ name: string; value: number; color: string }>>([]);
    const [participation, setParticipation] = useState<Array<{ name: string; value: any; color: string }>>([]);
    const [otherTables, setOtherTables] = useState<ElectoralTableType[]>([]);
    const [images, setImages] = useState<BallotType[]>([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [showAllTables, setShowAllTables] = useState(false);

    const {
        election,
        hasActiveConfig,
        isVotingPeriod: isPreliminaryPhase,
        isResultsPeriod: isFinalPhase,
        isAutoRefreshWindow,
    } = useElectionConfig();

    const refreshTick = useAutoRefreshTick({
        enabled: hasActiveConfig && (isPreliminaryPhase || isFinalPhase) && isAutoRefreshWindow,
        intervalMs: FIVE_MINUTES_MS,
    });

    const resultsLabels = getResultsLabels(election?.type);

    const {
        data: electoralTableData,
        isError: isElectoralTableError,
        isLoading: isElectoralTableLoading,
        isFetching: isElectoralTableFetching,
    } = useGetElectoralTableByTableCodeQuery(tableCode || "", {
        skip: !tableCode,
    });

    const { data: mostSupportedBallotData } = useGetMostSupportedBallotByTableCodeQuery(
        { tableCode: tableCode || "", electionId: electionId ?? undefined },
        {
            skip: !tableCode,
            pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
        },
    );

    const { data: attestationCases } = useGetAttestationCasesByTableCodeQuery(
        { tableCode: tableCode || "", electionId: electionId ?? undefined },
        {
            skip: !tableCode,
            pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
        },
    );

    useEffect(() => {
        if (tableCode) {
            dispatch(setCurrentTable(tableCode));
        }
    }, [tableCode, dispatch]);

    useEffect(() => {
        if (!tableCode || !electionId) return;
        getBallotsByTableCode({ tableCode, electionId })
            .unwrap()
            .then((data: any) => setImages(data))
            .catch(() => setImages([]));
    }, [tableCode, electionId, getBallotsByTableCode]);

    useEffect(() => {
        if (!tableCode || !electoralTableData) return;

        if (electoralTableData.electoralLocation) {
            getTablesByLocationId(electoralTableData.electoralLocation._id)
                .unwrap()
                .then((data) => {
                    setOtherTables(data.filter((table: ElectoralTableType) => table.tableCode !== tableCode));
                })
                .catch(() => setOtherTables([]));
        }

        if (!hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase)) {
            setPresidentialData([]);
            setDeputiesData([]);
            setParticipation([]);
            return;
        }

        const fetcher = isFinalPhase ? getResultsByLocation : getLiveResultsByLocation;
        let isActive = true;
        setResultsLoading(true);

        const formatResults = (results: any[]) => (results ?? []).map((item: any) => ({
            name: item.partyId,
            value: item.totalVotes,
            color: getPartyColor(item.partyId) || ("#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")),
        }));

        const presidentialPromise = fetcher({
            tableCode,
            electionType: election?.type ?? "presidential",
            electionId: electionId ?? undefined,
        }).unwrap().then((data) => {
            if (!isActive) return;
            setPresidentialData(formatResults(data.results));
            if (data.summary) {
                setParticipation([
                    { name: "Válidos", value: data.summary.validVotes || 0, color: "#8cc689" },
                    { name: "Nulos", value: data.summary.nullVotes || 0, color: "#81858e" },
                    { name: "Blancos", value: data.summary.blankVotes || 0, color: "#f3f3ce" },
                ]);
            }
        });

        const deputiesPromise = fetcher({
            tableCode,
            electionType: election?.type ?? "deputies",
            electionId: electionId ?? undefined,
        }).unwrap().then((data) => {
            if (!isActive) return;
            setDeputiesData(formatResults(data.results));
        });

        Promise.allSettled([presidentialPromise, deputiesPromise]).finally(() => {
            if (isActive) setResultsLoading(false);
        });

        return () => { isActive = false; };
    }, [
        refreshTick,
        tableCode,
        electoralTableData,
        electionId,
        election,
        hasActiveConfig,
        isPreliminaryPhase,
        isFinalPhase,
        isAutoRefreshWindow,
        getBallotsByTableCode,
        getTablesByLocationId,
        getResultsByLocation,
        getLiveResultsByLocation,
    ]);

    return {
        election,
        electoralTableData,
        presidentialData,
        deputiesData,
        participation,
        otherTables,
        images,
        resultsLoading,
        isElectoralTableLoading: isElectoralTableLoading || isElectoralTableFetching,
        isElectoralTableError,
        mostSupportedBallotData,
        attestationCases,
        hasActiveConfig,
        isPreliminaryPhase,
        isFinalPhase,
        resultsLabels,
        showAllTables,
        setShowAllTables,
    };
};
