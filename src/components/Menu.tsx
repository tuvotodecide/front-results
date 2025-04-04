import { useState, useEffect, useRef } from "react";
import { FaBars, FaTimes, FaMoon, FaSun, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Menu.css";

const navigationItems = [
  { title: "Resultados", path: "/resultados" },
  { title: "Subir acta", path: "/enviarActa" },
  { title: "Crear usuario", path: "/crearCuenta" },
  { title: "Login", path: "/login" },
];

const Menu = () => {
  const [isActive, setIsActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    bodyRef.current = document.querySelector("body");
    const getMode = localStorage.getItem("mode");
    if (getMode && getMode === "dark-mode") {
      setIsDarkMode(true);
      bodyRef.current?.classList.add("dark");
    }
  }, []);

  const handleSidebarOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(true);
  };

  useEffect(() => {
    const handleBodyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.classList.contains("sidebarOpen") &&
        !target.classList.contains("menu")
      ) {
        setIsActive(false);
      }
    };

    document.body.addEventListener("click", handleBodyClick);
    return () => {
      document.body.removeEventListener("click", handleBodyClick);
    };
  }, []);

  const handleModeToggle = () => {
    setIsDarkMode(!isDarkMode);
    bodyRef.current?.classList.toggle("dark");
    localStorage.setItem("mode", isDarkMode ? "light-mode" : "dark-mode");
  };

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
  };

  return (
    <nav ref={navRef} className={isActive ? "active" : ""}>
      <div className="nav-bar">
        <div
          className="sidebarOpen"
          onClick={handleSidebarOpen}
          style={{ cursor: "pointer", padding: "8px" }}
        >
          <FaBars size={24} color="white" />
        </div>
        <span className="logo navLogo">
          <Link to="/">CodingLab</Link>
        </span>

        <div className="menu">
          <div className="logo-toggle">
            <span className="logo">
              <Link to="/">CodingLab</Link>
            </span>
            <FaTimes className="siderbarClose" color="white" />
          </div>

          <ul className="nav-links">
            {navigationItems.map((item) => (
              <li key={item.title}>
                <Link to={item.path}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="darkLight-searchBox">
          <div
            className={`dark-light ${isDarkMode ? "active" : ""}`}
            onClick={handleModeToggle}
          >
            {isDarkMode ? (
              <FaSun size={24} className="sun" color="white" />
            ) : (
              <FaMoon size={24} className="moon" color="white" />
            )}
          </div>

          {/* <div className="searchBox">
            <div
              className={`searchToggle ${isSearchActive ? "active" : ""}`}
              onClick={handleSearchToggle}
            >
              {isSearchActive ? (
                <FaTimes className="cancel" color="white" />
              ) : (
                <FaSearch className="search" color="white" />
              )}
            </div>

            <div className="search-field">
              <input type="text" placeholder="Search..." />
              <div
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <FaSearch color="var(--nav-color)" />
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </nav>
  );
};

export default Menu;
