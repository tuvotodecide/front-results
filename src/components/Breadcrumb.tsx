import React, { useState, useRef, useEffect } from "react";
import styles from "./Breadcrumb.module.css";

// Types
interface LocationItem {
  name: string;
  value: string;
  parentId?: string;
}

interface BreadcrumbProps {
  departamentos: LocationItem[];
  provincias: LocationItem[];
  municipios: LocationItem[];
  onSelectionChange?: (selection: Selection) => void;
}

interface Selection {
  departamento: string | null;
  provincia: string | null;
  municipio: string | null;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  departamentos,
  provincias,
  municipios,
  onSelectionChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>({
    departamento: null,
    provincia: null,
    municipio: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent component when selection changes
  useEffect(() => {
    onSelectionChange?.(selection);
    console.log("Selection changed:", selection);
  }, [selection, onSelectionChange]);

  // Handle clicks outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent, level: string) => {
    if (e.key === "Enter" || e.key === "Space" || e.key === "Escape") {
      e.preventDefault();
      setOpenDropdown(
        e.key === "Escape" ? null : openDropdown === level ? null : level
      );
    }
  };

  const handleDropdownClick = (level: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenDropdown(openDropdown === level ? null : level);
  };
  const handleItemSelect = (level: string, value: string) => {
    setOpenDropdown(null);

    if (level === "departamento") {
      setSelection({
        departamento: value,
        provincia: null,
        municipio: null,
      });
    } else if (level === "provincia") {
      setSelection((prev) => ({
        ...prev,
        provincia: value,
        municipio: null,
      }));
    } else if (level === "municipio") {
      setSelection((prev) => ({
        ...prev,
        municipio: value,
      }));
    }
  };

  const handleDeselect = (level: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the breadcrumb click
    if (level === "departamento") {
      setSelection({
        departamento: null,
        provincia: null,
        municipio: null,
      });
    } else if (level === "provincia") {
      setSelection((prev) => ({
        ...prev,
        provincia: null,
        municipio: null,
      }));
    } else if (level === "municipio") {
      setSelection((prev) => ({
        ...prev,
        municipio: null,
      }));
    }
    setOpenDropdown(null);
  };

  const getDropdownItems = (level: string): LocationItem[] => {
    if (level === "departamento") {
      return departamentos;
    }

    if (level === "provincia" && selection.departamento) {
      return provincias.filter(
        (provincia) => provincia.parentId === selection.departamento
      );
    }

    if (level === "municipio" && selection.provincia) {
      return municipios.filter(
        (municipio) => municipio.parentId === selection.provincia
      );
    }

    return [];
  };

  const getValue = (level: string): string => {
    if (level === "departamento" && selection.departamento) {
      const dept = departamentos.find(
        (d) => d.value === selection.departamento
      );
      return dept?.name || "Seleccionar";
    }
    if (level === "provincia" && selection.provincia) {
      const prov = provincias.find((p) => p.value === selection.provincia);
      return prov?.name || "Seleccionar";
    }
    if (level === "municipio" && selection.municipio) {
      const mun = municipios.find((m) => m.value === selection.municipio);
      return mun?.name || "Seleccionar";
    }
    return "Seleccionar";
  };

  // Helper function to create breadcrumb item
  const renderBreadcrumbItem = (level: string, showSeparator: boolean) => {
    const isDisabled =
      (level === "provincia" && !selection.departamento) ||
      (level === "municipio" && !selection.provincia);

    return (
      <>
        <div className={styles["breadcrumb-item"]}>
          {" "}
          <a
            href="#"
            className={`${styles["breadcrumb-link"]} ${
              isDisabled ? styles.disabled : styles.clickable
            } ${getValue(level) !== "Seleccionar" ? styles.active : ""} ${
              openDropdown === level ? styles.open : ""
            }`}
            onClick={(e) => !isDisabled && handleDropdownClick(level, e)}
            onKeyDown={(e) => !isDisabled && handleKeyDown(e, level)}
            role="button"
            aria-haspopup="true"
            aria-expanded={openDropdown === level}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
          >
            <span className={styles["breadcrumb-title"]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
            <span className={styles["breadcrumb-value"]}>
              <span className="text">{getValue(level)}</span>
            </span>
          </a>
          {getValue(level) !== "Seleccionar" && (
            <div
              className={styles["cross-icon"]}
              onClick={(e) => handleDeselect(level, e)}
              role="button"
              aria-label={`Deselect ${level}`}
            />
          )}
          {!isDisabled && (
            <div
              className={`${styles.dropdown} ${
                openDropdown === level ? styles.show : ""
              }`}
            >
              {getDropdownItems(level).map((item) => (
                <div
                  key={item.value}
                  className={styles["dropdown-item"]}
                  onClick={() => handleItemSelect(level, item.value)}
                >
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {showSeparator && <span className={styles.separator}>{">"}</span>}
      </>
    );
  };

  return (
    <div className={styles["breadcrumb-container"]} ref={containerRef}>
      <nav
        className={styles.breadcrumb}
        role="navigation"
        aria-label="Location breadcrumb"
      >
        {" "}
        <div className={styles["breadcrumb-item"]}>
          <a
            href="#"
            className={`${styles["breadcrumb-link"]} ${styles.clickable}`}
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              setSelection({
                departamento: null,
                provincia: null,
                municipio: null,
              });
              setOpenDropdown(null);
            }}
          >
            <span className={styles["breadcrumb-title"]}>País</span>
            <span className={styles["breadcrumb-value"]}>Bolivia</span>
          </a>
        </div>
        <span className={styles.separator} aria-hidden="true">
          {">"}
        </span>
        {renderBreadcrumbItem("departamento", true)}
        {renderBreadcrumbItem("provincia", true)}
        {renderBreadcrumbItem("municipio", false)}
      </nav>
    </div>
  );
};
