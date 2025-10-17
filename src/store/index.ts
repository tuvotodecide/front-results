import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authSlice,  } from "./auth/authSlice";
import { recintosSlice,  } from "./recintos/recintosSlice";
import {
  departmentsSlice,
} from "./departments/departmentsSlice";
import { resultsSlice } from "./resultados/resultadosSlice";
import { electoralLocationsSlice } from "./electoralLocations/electoralLocationsSlice";
import electionReducer from "./election/electionSlice";


const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice.reducer,
    recintos: recintosSlice.reducer,
    departments: departmentsSlice.reducer,
    electoralLocations: electoralLocationsSlice.reducer,
    results: resultsSlice.reducer,
    election: electionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
