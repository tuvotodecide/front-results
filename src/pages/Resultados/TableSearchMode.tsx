import { Link } from "react-router-dom";
import Breadcrumb2 from "../../components/Breadcrumb2";
import SimpleSearchBar from "../../components/SimpleSearchBar";
import TablesSection from "./TablesSection";
import { useTableSearchLogic } from "../../hooks/useTableSearchLogic";

const TableSearchMode = () => {
    const {
        filters,
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
    } = useTableSearchLogic();

    return (
        <div className="inner-container bg-gray-50 border border-gray-200 rounded-lg">
            <div className="">
                <Breadcrumb2 autoOpen={false} />
            </div>

            {filteredTables.length > 0 ? (
                <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-gray-200 gap-4">
                        <h3 className="text-xl font-bold text-gray-800">
                            Mesas encontradas ({filteredTables.length})
                        </h3>
                        <SimpleSearchBar
                            className="w-full sm:max-w-xs"
                            placeholder="Filtrar por número o código..."
                            onChange={setMesaQuery}
                            onSearch={setMesaQuery}
                        />
                    </div>
                    <div
                        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${!showAllFilteredTables && filteredMesas.length > 15
                            ? "max-h-[calc(3*10rem+2*0.75rem)] overflow-hidden"
                            : ""
                            }`}
                    >
                        {filteredMesas.map((table) => (
                            <Link
                                key={table._id}
                                to={`/resultados/mesa/${table.tableCode}`}
                                className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-400 hover:shadow-md transition-all duration-200 block"
                            >
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                                        Mesa
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 mb-2">
                                        #{table.tableNumber}
                                    </div>
                                    <div className="text-xs text-gray-500 break-words" title={table.tableCode}>
                                        {table.tableCode}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {filteredMesas.length > 15 && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowAllFilteredTables(!showAllFilteredTables)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                            >
                                {showAllFilteredTables ? "Mostrar menos" : `Mostrar todas (${filteredMesas.length} mesas)`}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-md py-16 px-8 border border-gray-200 mt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="bg-gray-100 rounded-full p-4 mb-4">
                                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
                                Buscar Mesa Electoral
                            </h1>
                            <p className="text-gray-500 mb-8">
                                Use los filtros territoriales arriba o busque directamente por código de mesa
                            </p>
                            <SimpleSearchBar className="w-full max-w-md" onSearch={handleSearch} />
                        </div>
                    </div>

                    {hasActiveConfig && (isPreliminaryPhase || isFinalPhase) && (
                        <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                                {(() => {
                                    const modeLabel = isPreliminaryPhase ? "Preliminares" : "Finales";
                                    if (filters.municipality) return `Mesas con Resultados ${modeLabel} - ${filters.municipality}`;
                                    if (filters.province) return `Mesas con Resultados ${modeLabel} - ${filters.province}`;
                                    if (filters.department) return `Mesas con Resultados ${modeLabel} - ${filters.department}`;
                                    return `Mesas con Resultados ${modeLabel}`;
                                })()}{" "}
                                {countedBallotsTotal > 0 && `(${countedBallotsTotal})`}
                            </h3>
                            {countedBallotsLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {Array.from({ length: 10 }).map((_, index) => (
                                        <div key={index} className="border border-gray-300 rounded-lg p-4 animate-pulse">
                                            <div className="text-center">
                                                <div className="h-4 bg-gray-300 rounded w-16 mx-auto mb-2"></div>
                                                <div className="h-6 bg-gray-300 rounded w-12 mx-auto mb-2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : countedBallotsError ? (
                                <div className="text-center py-8 text-red-600">Error al cargar mesas con resultados</div>
                            ) : countedTables.length > 0 ? (
                                <TablesSection tables={countedTables} />
                            ) : (
                                <div className="text-center py-8 text-gray-500">No hay mesas con resultados disponibles</div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TableSearchMode;
