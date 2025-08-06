import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authSlice, AuthState } from './auth/authSlice';
import { recintosSlice, RecintosState } from './recintos/recintosSlice';
import {
  departmentsSlice,
  departmentsState,
} from './departments/departmentsSlice';
import { resultsSlice } from './resultados/resultadosSlice';

export interface RootState {
  [apiSlice.reducerPath]: ReturnType<typeof apiSlice.reducer>;
  auth: AuthState;
  recintos: RecintosState;
  departments: departmentsState;
}

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice.reducer,
    recintos: recintosSlice.reducer,
    departments: departmentsSlice.reducer,
    results: resultsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

// export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
