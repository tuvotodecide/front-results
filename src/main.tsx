import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import store from "./store";

async function prepareApp() {
  if (process.env.NODE_ENV === 'development') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass', // Permite que peticiones no mockeadas sigan normales
    })
  }
}

prepareApp().then(() => {
  createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
      <StrictMode>
        <App />
      </StrictMode>
    </Provider>
  );
});
