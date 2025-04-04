import { useState } from "react";
// import logo from './imagenes/logo.png'; // Adjust path as needed
import "./Menu.css"; // Your existing CSS

const Menu = () => {
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => {
    setIsActive(!isActive);
  };

  const navLinks = [
    { id: 1, text: "Inicio", href: "#inicio" },
    { id: 2, text: "Quienes somos", href: "#quienes" },
    { id: 3, text: "Nuestros productos", href: "#productos" },
    { id: 4, text: "Contactanos", href: "#contacto" },
  ];

  return (
    <div className="menu">
      <div className="logo">
        {/* <img src={logo} alt="Casa de Arte Logo" /> */}
        <h2>Yo custodio</h2>
      </div>

      <ul className={`nav-links ${isActive ? "nav-active" : ""}`}>
        {navLinks.map((link, index) => (
          <li
            key={link.id}
            style={{
              animation: isActive
                ? `menufade 0.5s ease forwards ${index / 7 + 2}s`
                : "",
            }}
          >
            <a href={link.href}>{link.text}</a>
          </li>
        ))}
      </ul>

      <div className={`burger ${isActive ? "rotar" : ""}`} onClick={toggleMenu}>
        <div className="linea1"></div>
        <div className="linea2"></div>
        <div className="linea3"></div>
      </div>
    </div>
  );
};

export default Menu;
