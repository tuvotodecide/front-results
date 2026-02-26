import { Link } from "react-router-dom";
import BackButton from "../../components/BackButton";
import SimpleSearchBar from "../../components/SimpleSearchBar";
import LocationSection from "./LocationSection";
import Graphs from "./Graphs";
import ImagesSection from "./ImagesSection";
import StatisticsBars from "./StatisticsBars";
import { useTableDetailsLogic } from "../../hooks/useTableResultsLogic";
import { useTableSearchLogic } from "../../hooks/useTableSearchLogic";

interface TableDetailsModeProps {
    tableCode: string;
}

const TableDetailsMode = ({ tableCode }: TableDetailsModeProps) => {
    const {
        election,
        electoralTableData,
        presidentialData,
        participation,
        otherTables,
        images,
        resultsLoading,
        isElectoralTableLoading,
        isElectoralTableError,
        mostSupportedBallotData,
        attestationCases,
        hasActiveConfig,
        isPreliminaryPhase,
        isFinalPhase,
        resultsLabels,
        showAllTables,
        setShowAllTables,
    } = useTableDetailsLogic(tableCode);

    const { handleSearch } = useTableSearchLogic();

    if (isElectoralTableLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="bg-gray-800 p-6 rounded-t-lg">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
                            <div className="h-8 bg-gray-600 rounded w-32 animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-20 bg-gray-100 rounded"></div>
                        <div className="h-40 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (isElectoralTableError && images.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="bg-gray-800 text-white p-6 rounded-t-lg flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <BackButton className="text-white" to="/resultados/mesa" />
                        <h1 className="text-2xl font-semibold">Mesa {tableCode}</h1>
                    </div>
                    <SimpleSearchBar onSearch={handleSearch} />
                </div>
                <div className="py-16 text-center text-gray-500">
                    No se encontraron datos para la mesa "{tableCode}"
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header Section */}
            <div className="bg-gray-800 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <BackButton className="text-white hover:text-gray-300" to="/resultados/mesa" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold">
                                {electoralTableData ? `Mesa #${electoralTableData?.tableNumber}` : `Mesa ${tableCode}`}
                            </h1>
                            {electoralTableData?.tableCode && (
                                <p className="text-gray-300 mt-1">Código: {electoralTableData.tableCode}</p>
                            )}
                        </div>
                    </div>
                    <SimpleSearchBar className="ml-auto" onSearch={handleSearch} />
                </div>
            </div>

            <div className="inner-container p-6">
                {electoralTableData && (
                    <div className="flex flex-row flex-wrap gap-4 mb-6">
                        <div className="border border-gray-200 rounded-lg p-6 basis-[450px] grow-2">
                            <h3 className="text-lg font-semibold mb-4">Ubicación</h3>
                            <LocationSection
                                department={electoralTableData?.department?.name}
                                province={electoralTableData?.province?.name}
                                municipality={electoralTableData?.municipality?.name}
                                electoralLocation={electoralTableData?.electoralLocation?.name}
                                electoralSeat={electoralTableData?.electoralSeat?.name}
                            />
                        </div>
                        <div className="border border-gray-200 rounded-lg p-6 basis-[300px] grow-1">
                            <h3 className="text-lg font-semibold mb-4">Datos Mesa</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase">Número</h4>
                                    <p>{electoralTableData.tableNumber}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase">Código</h4>
                                    <p>{electoralTableData.tableCode}</p>
                                </div>
                                {electoralTableData.electoralLocation?.address && (
                                    <div>
                                        <h4 className="text-xs font-medium text-gray-500 uppercase">Dirección</h4>
                                        <p>{electoralTableData.electoralLocation.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Logic */}
                {hasActiveConfig && !isPreliminaryPhase && !isFinalPhase ? (
                    <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                        <p className="text-lg text-gray-600 mb-2">Los resultados se habilitarán el:</p>
                        <p className="text-2xl font-bold">
                            {new Date(election?.resultsStartDateBolivia || "").toLocaleString("es-ES", { timeZone: "America/La_Paz" })}
                        </p>
                    </div>
                ) : resultsLoading ? (
                    <div className="text-center py-12">Cargando resultados...</div>
                ) : presidentialData.length > 0 ? (
                    <div className="space-y-6">
                        <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Participación</h3>
                            <StatisticsBars
                                title="Distribución de votos"
                                voteData={participation}
                                totalTables={1} // In table mode, it's always 1
                                totalVoters={participation.reduce((a, b) => a + b.value, 0)}
                            />
                        </div>
                        <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">{resultsLabels.primary}</h3>
                            <Graphs data={presidentialData} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        Sin datos de resultados disponibles aún
                    </div>
                )}

                {/* Images Selection */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Actas Digitalizadas</h3>
                    <ImagesSection
                        images={images}
                        mostSupportedBallot={mostSupportedBallotData}
                        attestationCases={attestationCases?.ballots || []}
                    />
                </div>

                {/* Other Tables Section */}
                {otherTables.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h3 className="text-lg font-semibold mb-4">Otras mesas del Recinto</h3>
                        <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 ${!showAllTables ? "max-h-[200px] overflow-hidden" : ""}`}>
                            {otherTables.map((table) => (
                                <Link
                                    key={table._id}
                                    to={`/resultados/mesa/${table.tableCode}`}
                                    className="border border-gray-200 rounded p-3 text-center hover:bg-blue-50 transition-colors"
                                >
                                    <div className="text-xs text-gray-400 uppercase">Mesa</div>
                                    <div className="font-bold">#{table.tableNumber}</div>
                                </Link>
                            ))}
                        </div>
                        {otherTables.length > 10 && (
                            <button
                                onClick={() => setShowAllTables(!showAllTables)}
                                className="mt-4 text-blue-600 font-medium hover:underline w-full text-center"
                            >
                                {showAllTables ? "Ver menos" : `Ver todas (${otherTables.length} mesas)`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableDetailsMode;
