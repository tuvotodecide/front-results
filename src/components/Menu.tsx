import { useState, useEffect, useRef } from "react";
import { FaBars, FaTimes, FaMoon, FaSun } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Menu.css";

type NavigationItem = {
  title: string;
  path?: string;
  subItems?: NavigationItem[];
  method?: () => void;
  isLink?: boolean;
};

type MenuProps = {
  navigationItems: NavigationItem[];
};

const Menu: React.FC<MenuProps> = ({ navigationItems }) => {
  const [isActive, setIsActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const getMode = localStorage.getItem("mode");
    if (getMode && getMode === "dark-mode") {
      setIsDarkMode(true);
      navRef.current?.classList.add("dark");
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
    navRef.current?.classList.toggle("dark");
    localStorage.setItem("mode", isDarkMode ? "light-mode" : "dark-mode");
  };

  return (
    <nav
      ref={navRef}
      className={`${isActive ? "active" : ""} ${isDarkMode ? "dark" : ""}`}
    >
      <div className="nav-bar">
        <div className="darkLight-searchBox">
          <div
            className={`dark-light ${isDarkMode ? "active" : ""}`}
            onClick={handleModeToggle}
          >
            {isDarkMode ? (
              <FaSun size={18} className="sun" color="white" />
            ) : (
              <FaMoon size={18} className="moon" color="white" />
            )}
          </div>
        </div>
        <span className="logo navLogo">
          <Link to="/">Yo Participo</Link>
        </span>

        <div className="menu">
          <div className="logo-toggle">
            <span className="logo">
              <Link to="/">Yo Participo</Link>
            </span>
            <FaTimes className="siderbarClose" color="white" />
          </div>

          <ul className="nav-links">
            {navigationItems.map((item) => (
              <li
                key={item.title}
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {item.isLink === false || !item.path ? (
                  <span
                    className="menu-item-text"
                    onClick={item.method ? item.method : undefined}
                  >
                    {item.title}
                  </span>
                ) : (
                  <Link to={item.path}>{item.title}</Link>
                )}
                {item.subItems && hoveredItem === item.title && (
                  <div className="subitems-panel">
                    <ul>
                      {item.subItems.map((subitem) => (
                        <li key={subitem.title}>
                          {subitem.isLink === false || !subitem.path ? (
                            <span
                              className="menu-item-text"
                              onClick={
                                subitem.method ? subitem.method : undefined
                              }
                            >
                              {subitem.title}
                            </span>
                          ) : (
                            <Link to={subitem.path}>{subitem.title}</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="sidebarOpen"
          onClick={handleSidebarOpen}
          style={{ cursor: "pointer", padding: "8px" }}
        >
          <FaBars size={24} color="white" />
        </div>
      </div>
    </nav>
  );
};

export default Menu;
