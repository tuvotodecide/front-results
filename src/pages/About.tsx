import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

const About: React.FC = () => {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link>
      </nav>
      <h1>About us</h1>
    </div>
  );
};

export default About;
