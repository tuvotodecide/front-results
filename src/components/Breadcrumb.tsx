import React, { useState, useRef, useEffect } from "react";
import styles from "./Breadcrumb.module.css";
import { MdChevronRight, MdExpandMore, MdClose } from "react-icons/md";

interface BreadcrumbProps {
  departments: string[];
  provinces: string[];
  municipalities: string[];
  onSelectionChange?: (selection: Selection) => void;
}

interface Selection {
  department: string | null;
  province: string | null;
  municipality: string | null;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  departments,
  provinces,
  municipalities,
  onSelectionChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>({
    department: null,
    province: null,
    municipality: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      console.log("Selection changed breadcrumb:", selection);
      onSelectionChange(selection);
    }
  }, [selection]);

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

    let newSelection: Selection;
    if (level === "department") {
      newSelection = {
        department: value,
        province: null,
        municipality: null,
      };
    } else if (level === "province") {
      newSelection = {
        ...selection,
        province: value,
        municipality: null,
      };
    } else {
      newSelection = {
        ...selection,
        municipality: value,
      };
    }

    // Only update if there's an actual change
    if (
      newSelection.department !== selection.department ||
      newSelection.province !== selection.province ||
      newSelection.municipality !== selection.municipality
    ) {
      setSelection(newSelection);
    }
  };

  const handleDeselect = (level: string, e: React.MouseEvent) => {
    e.stopPropagation();

    let newSelection: Selection;
    if (level === "department") {
      newSelection = {
        department: null,
        province: null,
        municipality: null,
      };
    } else if (level === "province") {
      newSelection = {
        ...selection,
        province: null,
        municipality: null,
      };
    } else {
      newSelection = {
        ...selection,
        municipality: null,
      };
    }

    // Only update if there's an actual change
    if (
      newSelection.department !== selection.department ||
      newSelection.province !== selection.province ||
      newSelection.municipality !== selection.municipality
    ) {
      setSelection(newSelection);
    }
    setOpenDropdown(null);
  };

  const getDropdownItems = (level: string): string[] => {
    if (level === "department") {
      return departments;
    }

    if (level === "province" && selection.department) {
      return provinces;
    }

    if (level === "municipality" && selection.province) {
      return municipalities;
    }

    return [];
  };

  const getValue = (level: string): string => {
    if (level === "department" && selection.department) {
      return selection.department || "Seleccionar";
    }
    if (level === "province" && selection.province) {
      return selection.province || "Seleccionar";
    }
    if (level === "municipality" && selection.municipality) {
      return selection.municipality || "Seleccionar";
    }
    return "Seleccionar";
  };

  // Helper function to create breadcrumb item
  const renderBreadcrumbItem = (level: string, showSeparator: boolean) => {
    const isDisabled =
      (level === "province" && !selection.department) ||
      (level === "municipality" && !selection.province);

    return (
      <>
        <div className={styles["breadcrumb-item"]}>
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
              {!isDisabled && (
                <MdExpandMore className={styles["dropdown-icon"]} />
              )}
            </span>
          </a>
          {getValue(level) !== "Seleccionar" && (
            <div
              className={styles["cross-icon"]}
              onClick={(e) => handleDeselect(level, e)}
              role="button"
              aria-label={`Deselect ${level}`}
            >
              <MdClose />
            </div>
          )}
          {!isDisabled && (
            <div
              className={`${styles.dropdown} ${
                openDropdown === level ? styles.show : ""
              }`}
            >
              {getDropdownItems(level).map((item) => (
                <div
                  key={level + item}
                  className={styles["dropdown-item"]}
                  onClick={() => handleItemSelect(level, item)}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
        {showSeparator && (
          <span className={styles.separator} aria-hidden="true">
            <MdChevronRight />
          </span>
        )}
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
        <div className={styles["breadcrumb-item"]}>
          <a
            href="#"
            className={`${styles["breadcrumb-link"]} ${styles.clickable}`}
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              setSelection({
                department: null,
                province: null,
                municipality: null,
              });
              setOpenDropdown(null);
            }}
          >
            <span className={styles["breadcrumb-title"]}>País</span>
            <span className={styles["breadcrumb-value"]}>Bolivia</span>
          </a>
        </div>
        <span className={styles.separator} aria-hidden="true">
          <MdChevronRight />
        </span>
        {renderBreadcrumbItem("department", true)}
        {renderBreadcrumbItem("province", true)}
        {renderBreadcrumbItem("municipality", false)}
      </nav>
    </div>
  );
};
