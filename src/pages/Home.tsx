import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div>
      <nav>
        <Link to="/">Resultados</Link> |{" "}
        <Link to="/enviarActa">Enviar acta</Link>
      </nav>
      <h1>Home</h1>
    </div>
  );
};

export default Home;
