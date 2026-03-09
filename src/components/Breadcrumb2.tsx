import React from "react";
import styles from "./Breadcrumb.module.css";
import { ChevronRight } from "lucide-react";
import SimpleSearchBar from "./SimpleSearchBar";
import ElectionSelector from "./ElectionSelector";
import { useBreadcrumbLogic } from "../hooks/useBreadcrumbLogic";

interface Breadcrumb2Props {
  /**
   * If `true` (default), the component auto-opens the level selector during
   * initialization flows. If `false`, it stays closed until the user opens it.
   */
  autoOpen?: boolean;
}

const Breadcrumb = ({ autoOpen = true }: Breadcrumb2Props) => {
  const {
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
    resetPath,
    handleSearch,
  } = useBreadcrumbLogic(autoOpen);

  return (
    <div className="mx-auto pb-6">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 rounded-lg flex items-center justify-between">
        <nav className="flex items-center gap-x-1.5 text-sm w-full flex-nowrap overflow-x-auto">
          {allowManualPick && (
            <button
              onClick={resetPath}
              data-cy="country-select"
              className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100"
            >
              <div className="text-xs text-gray-500 font-medium mb-1">País</div>
              <div className="flex items-center">
                <span className="font-medium">Bolivia</span>
              </div>
            </button>
          )}
          {selectedPath.length > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
          )}
          {selectedPath.map((pathItem, index) => {
            if (role === "MAYOR" && index < 2) return null;
            return (
              <React.Fragment key={index}>
                {((role === "MAYOR" && index > 2) ||
                  (role !== "MAYOR" && index > 0)) && (
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                  )}
                <button
                  data-cy={`${pathItem.id}-select`}
                  onClick={() => handleBreadcrumbClick(index)}
                  className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100"
                >
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    {pathItem.title}
                  </div>
                  <div className="font-medium">
                    {pathItem?.selectedOption?.name}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <ElectionSelector />
            <button
              data-cy="filters-reset"
              className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={() => clearSelectedPath()}
            >
              Resetear
            </button>
          </div>
        </nav>
      </div>

      {/* Current Level Selection (Closable) */}
      {selectedLevel && showCurrentLevel && (
        <div className="border border-gray-200 rounded-lg p-6 relative mt-6">
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
              inputDataCy="table-search-input"
              submitDataCy="table-search-submit"
              className={styles["search-bar"]}
              onSearch={handleSearch}
              onChange={handleSearch}
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
              <div className={styles.optionsScroll}>
                <div
                  data-cy="level-options"
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                >
                  {filteredOptions.map((option, index) => (
                    <button
                      data-cy={`option-${selectedLevel.index}-${option._id}`}
                      key={index}
                      onClick={() => handleOptionClick(selectedLevel.index, option)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <div className="font-medium text-gray-800">
                        {option.name}
                      </div>
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
