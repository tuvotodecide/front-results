import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import FrontendRuntimeNotice from "./shared/components/FrontendRuntimeNotice";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FrontendRuntimeNotice />
  </StrictMode>
);
