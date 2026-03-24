import React from "react";
import AppRouter from "./Router";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  );
};

export default App;
